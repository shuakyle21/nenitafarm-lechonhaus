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

## Current policy posture (from committed SQL — VERIFY live)

| Table | Policy | Effect today |
| --- | --- | --- |
| `orders` | `USING (true)` SELECT/INSERT/UPDATE | **Wide open** to anyone with the anon key |
| `menu_items` | `USING (true)` all ops | Wide open |
| `paper_pos_imports` | `USING (true)` all ops | Wide open |
| `staff_transactions` | `TO authenticated … USING (true)` | **Contradiction** — `anon` is not `authenticated`, so this should *block* the app's own queries. Either it's failing in prod, or extra anon policies exist. **VERIFY.** |
| `audit_logs` | admin role-claim check | Effectively denies all client reads (no role claim exists); writes happen via `SECURITY DEFINER` triggers, so they still work |

The posture is **inconsistent**: some tables are fully public, others reference an
auth identity that doesn't exist in this setup.

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

Even before A or B, shrink the blast radius:

- **Drop the blanket `DELETE`/`UPDATE` `USING (true)` policies** on `orders`,
  `menu_items`, `paper_pos_imports`. Deletion/edits should go through RPCs only.
- Make `menu_items` **read-only** to `anon` (SELECT only) — the catalog rarely
  changes and edits can be admin-RPC'd.
- Confirm `audit_logs` is not directly writable or readable by `anon`.

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

1. **VERIFY (live DB)** via Supabase MCP: dump the *actual* policies on `orders`,
   `menu_items`, `paper_pos_imports`, `staff_transactions`, `audit_logs`; confirm
   whether `staff_transactions` access currently works for `anon`; inspect the
   `authenticate_user` function body for any existing session mechanism.
2. Decide between **Option A** (recommended) and **Option B**.
3. Implement **Option C** as an immediate stopgap.
4. Write the chosen migration; validate against a Supabase branch before prod.
