# RLS Hardening Plan

> Status: **plan only** — no policy changes applied yet. Several steps below are
> marked **VERIFY (live DB)** because the committed SQL files are known to drift
> from the live database; confirm via the Supabase MCP (read-only) before acting.

## The core problem

The app is a client-side SPA that talks to Supabase with **only the public anon
key** (`src/lib/supabase.ts` → `createClient(url, anonKey)`), and authenticates
through a **custom RPC** (`supabase.rpc('authenticate_user', …)` against a custom
`users` table). There is **no Supabase Auth session**.

Consequences:

- Every request reaches Postgres as the **`anon`** role. `auth.uid()` and
  `auth.role()` are **always NULL**.
- RLS cannot tell one staff member from another — there is no JWT identity to key
  policies on.
- The anon key ships inside the browser bundle, so anyone who opens the app can
  extract it and call the REST API directly.

## Current policy posture (VERIFIED live 2026-06-05)

| Table | Live policy | Effect today |
| --- | --- | --- |
| `orders` | `USING (true)` SELECT/INSERT/UPDATE/DELETE → `{public}` | **Wide open** to anyone with the anon key |
| `menu_items` | `USING (true)` SELECT/INSERT/UPDATE/DELETE → `{public}` (writes labeled "DEMO ONLY") | Wide open |
| `paper_pos_imports` | `USING (true)` SELECT/INSERT/UPDATE/DELETE → `{public}` | Wide open |
| `staff_transactions` | `Allow all access` — `cmd = ALL`, `roles = {public}`, `qual = true` | **Wide open to `anon`.** ✅ Resolved: the committed `TO authenticated` SQL is **stale**; live is public-all, which is why the app's queries succeed in prod. |
| `audit_logs` | `Admins can view audit logs` — `SELECT`, `{public}`, **`qual = true`** | ⚠️ **Readable by everyone.** The plan previously assumed this denied client reads — it does **not**. Anyone with the anon key can read the full audit log. Writes still happen via `SECURITY DEFINER` triggers. |

RLS is **enabled** on all five tables, but every policy is permissive-`true`, so
enablement buys nothing. The posture is uniformly wide-open, not "inconsistent" as
previously thought.

### 🔴 Critical findings beyond the original five tables (security advisors)

These are **higher priority** than the `USING (true)` tables above — they leak data
with *no policy at all*:

| Object | Issue | Risk |
| --- | --- | --- |
| `public.users` | **RLS DISABLED** entirely | `anon` can `SELECT` every row, **including `password_hash`**. Bcrypt-hashed via `crypt()`, but the whole credential table is exposed. **Top priority.** |
| `public.expenses` | **RLS DISABLED** entirely | Fully exposed to `anon`. |
| `public.reporting_sales_details` | **`SECURITY DEFINER` view** | Runs with creator privileges, bypassing RLS for callers. |
| `public.sales_adjustments` | RLS enabled, **no policy** | Denies all (safe), but inconsistent. |
| `authenticate_user`, `audit_trigger_func` | **mutable `search_path`** (`proconfig = null`) | Injection risk for `SECURITY DEFINER` functions. Set `search_path = ''`. |
| `menu-images` bucket | Public bucket with broad `SELECT` allows **listing all files** | Minor; public bucket doesn't need the list policy. |

Plus 18 `rls_policy_always_true` advisor hits spanning `attendance`, `bookings`,
`cash_transactions`, `order_items`, `staff` (in addition to the five above).

### `authenticate_user` — no session mechanism exists (confirms step 4)

```sql
CREATE OR REPLACE FUNCTION public.authenticate_user(p_username text, p_password text)
  RETURNS TABLE(id uuid, username text, role text)
  LANGUAGE plpgsql SECURITY DEFINER       -- note: NO `set search_path`
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.username, u.role
  FROM users u
  WHERE u.username = p_username
    AND u.password_hash = crypt(p_password, u.password_hash);  -- bcrypt, good
END;
$$;
```

It returns identity **in plaintext with no token** — there is nothing for Option A's
mutation RPCs to verify yet. The token mechanism (step 4) must be built first.

## Recommended direction

Because there is no per-user JWT, **RLS alone cannot secure this app**. The right
fix is to stop trusting the client and move authority server-side.

### Option A — Route mutations through `SECURITY DEFINER` RPCs (recommended)

Keep the existing custom-login UX, but make the database the gatekeeper.

1. **Lock the tables.** Replace every `USING (true)` write policy with deny-by-
   default. Allow the client *direct* access only to what genuinely must be read
   anonymously (e.g. `menu_items` SELECT for the POS), nothing else.
2. **Expose intent-specific RPCs** (`create_order`, `void_order`,
   `import_paper_record`, `record_staff_transaction`, …) as `SECURITY DEFINER`
   functions with `set search_path = ''`. Each validates a **session token**
   issued by `authenticate_user` (see step 4) and performs the write with the
   definer's privileges.
3. **Grant `execute` on those RPCs to `anon`**, and revoke direct table DML from
   `anon`. The client calls `supabase.rpc('create_order', …)` instead of
   `.from('orders').insert(…)`.
4. **Issue and verify a session token.** `authenticate_user` should return a
   signed, expiring token (or set a Postgres setting via a verified RPC) that the
   mutation RPCs check. Without this, the RPCs are just as open as the tables.

Pros: minimal frontend change (swap `.from().insert()` → `.rpc()`), keeps custom
login, real enforcement. Cons: requires writing/validating the token mechanism.

### Option B — Adopt Supabase Auth

Migrate login to Supabase Auth so requests carry a real JWT, then write proper
RLS: `using ((select auth.uid()) = …)` and role checks via a `profiles` table.

Pros: idiomatic, per-user RLS, future-proof. Cons: larger refactor of the login
flow and the `users` table; re-onboarding existing staff accounts.

### Option C — Interim damage control (do this regardless, this week)

Re-prioritized after the live verification — the **RLS-disabled tables come first**,
since they leak data with no policy at all:

1. **Enable RLS on `public.users` and `public.expenses`** and add deny-by-default
   (no anon policy). The `users` exposure (password hashes readable by anon) is the
   most urgent item in this whole document.
2. **Lock `audit_logs` reads** — the live `qual = true` SELECT policy must be
   dropped/replaced so `anon` cannot read the audit trail. Writes are via
   `SECURITY DEFINER` triggers and are unaffected.
3. **Drop the blanket `DELETE`/`UPDATE` `USING (true)` policies** on `orders`,
   `menu_items`, `paper_pos_imports`. Deletion/edits should go through RPCs only.
4. Make `menu_items` **read-only** to `anon` (SELECT only) — the catalog rarely
   changes and edits can be admin-RPC'd.
5. **Pin `search_path = ''`** on `authenticate_user` and `audit_trigger_func`.
6. Drop the broad list `SELECT` policy on the `menu-images` public bucket.

> Draft SQL for steps 1–5 lives in
> `supabase/migrations/20260605_rls_option_c_stopgap.sql`. The MCP is read-only,
> so apply it from the Supabase SQL editor / CLI, and validate on a branch first.

## RLS performance note (`security-rls-performance`)

When real policies are written, **wrap auth calls in a subquery** so they evaluate
once per query instead of once per row:

```sql
-- slow: auth.uid() runs per row
using (auth.uid() = user_id)
-- fast: evaluated once
using ((select auth.uid()) = user_id)
```

And ensure any column referenced inside a policy (`user_id`, `staff_id`, etc.) is
indexed — see `20260605_add_fk_indexes.sql`.

## Next actions

1. ~~**VERIFY (live DB)**~~ ✅ **Done 2026-06-05.** Findings folded into the posture
   table above. Key surprises: `staff_transactions` is public-all (not
   authenticated), `audit_logs` is publicly readable, and `users`/`expenses` have
   **RLS disabled entirely**. `authenticate_user` has no session token.
2. **Apply Option C stopgap** (`20260605_rls_option_c_stopgap.sql`) — urgent,
   especially the `users` table. Validate on a Supabase branch first.
3. Decide between **Option A** (recommended) and **Option B**.
4. For Option A: build the session-token mechanism in `authenticate_user` first
   (currently returns plaintext identity, nothing to verify against).
5. Write the chosen migration; validate against a Supabase branch before prod.
