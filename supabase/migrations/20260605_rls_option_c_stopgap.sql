-- RLS Hardening — Option C stopgap (interim damage control)
--
-- Verified against the live DB 2026-06-05. See src/docs/RLS_HARDENING_PLAN.md.
--
-- IMPORTANT CONTEXT: this app is a client-side SPA that talks to Supabase with
-- ONLY the public anon key, and performs DIRECT table DML on almost every table
-- (orders, menu_items, paper_pos_imports, expenses, staff, attendance, …). It
-- has no Supabase Auth session — every request hits Postgres as `anon`.
--
-- Therefore deny-by-default on any table the frontend reads/writes directly will
-- BREAK the live app until those operations are moved behind SECURITY DEFINER
-- RPCs (Option A). This file is split accordingly:
--
--   PART 1 — SAFE TO APPLY NOW. Locks the two objects the frontend never touches
--            directly (`users`, accessed only via the authenticate_user RPC; and
--            `audit_logs`, never read by the client), plus hardens the two
--            SECURITY DEFINER functions. No app behaviour changes.
--
--   PART 2 — DO NOT APPLY until the corresponding writes/reads are moved to RPCs.
--            Left commented with rationale so the intent is recorded.
--
-- The Supabase MCP is read-only; apply this from the SQL editor / CLI, and
-- validate on a Supabase branch before prod.

begin;

-- =====================================================================
-- PART 1 — SAFE NOW
-- =====================================================================

-- 1. public.users — RLS is currently DISABLED, so `anon` can SELECT every row,
--    INCLUDING password_hash. The frontend never queries this table directly
--    (login goes through the authenticate_user RPC, which is SECURITY DEFINER
--    and bypasses RLS). Enabling RLS with no anon policy denies all direct
--    access while leaving login working. TOP PRIORITY.
alter table public.users enable row level security;
-- (no policies => deny-all for anon/authenticated; RPC access is unaffected)

-- 2. public.audit_logs — the live policy "Admins can view audit logs" is
--    SELECT TO public USING (true), i.e. the entire audit trail is readable by
--    anyone with the anon key. The frontend does not read audit_logs directly.
--    Drop the open read policy. Trigger writes use SECURITY DEFINER and continue
--    to work with no policy present.
drop policy if exists "Admins can view audit logs" on public.audit_logs;
-- (audit_logs keeps RLS enabled with no policy => no direct client read/write)

-- 3. Pin search_path on the SECURITY DEFINER functions (advisor:
--    function_search_path_mutable). Recreated with fully-qualified references so
--    they keep working under `search_path = ''`. pgcrypto lives in `extensions`.
create or replace function public.authenticate_user(p_username text, p_password text)
  returns table(id uuid, username text, role text)
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  return query
  select u.id, u.username, u.role
  from public.users u
  where u.username = p_username
    and u.password_hash = extensions.crypt(p_password, u.password_hash);
end;
$$;

create or replace function public.audit_trigger_func()
  returns trigger
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
    current_user_id uuid;
begin
    if (TG_OP = 'INSERT') then
        begin
            current_user_id := NEW.created_by;
        exception when others then
            current_user_id := null;
        end;
    else
        begin
            current_user_id := NEW.updated_by;
        exception when others then
            current_user_id := null;
        end;
    end if;

    if current_user_id is null then
        begin
            current_user_id := (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid;
        exception when others then
            current_user_id := null;
        end;
    end if;

    if (TG_OP = 'DELETE') then
        insert into public.audit_logs (table_name, record_id, action, old_data, changed_by)
        values (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), current_user_id);
        return OLD;
    elsif (TG_OP = 'UPDATE') then
        insert into public.audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
        values (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), current_user_id);
        return NEW;
    elsif (TG_OP = 'INSERT') then
        insert into public.audit_logs (table_name, record_id, action, new_data, changed_by)
        values (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), current_user_id);
        return NEW;
    end if;
    return null;
end;
$$;

commit;

-- =====================================================================
-- PART 2 — DEFERRED (do NOT apply until the matching ops move to RPCs)
-- =====================================================================
--
-- Every statement below removes access the live SPA currently relies on via the
-- anon key. Enabling them now would break those features. Move the operation to
-- a SECURITY DEFINER RPC (Option A) first, then uncomment.
--
-- expenses: RLS is DISABLED (advisor ERROR) but the frontend does direct DML
-- (3 call sites). Enabling RLS without a policy denies the expenses feature.
--   alter table public.expenses enable row level security;
--   -- then add narrowly-scoped policies OR route writes through an RPC.
--
-- orders / menu_items / paper_pos_imports: drop the blanket write policies so
-- edits/deletes go through RPCs. The SPA currently does direct insert/update/
-- delete on all three, so these break the app until those paths are RPC-backed.
--   drop policy if exists "Orders are deletable by everyone" on public.orders;
--   drop policy if exists "Orders are updatable by everyone" on public.orders;
--   drop policy if exists "Menu items are deletable by everyone (DEMO ONLY)" on public.menu_items;
--   drop policy if exists "Menu items are updatable by everyone (DEMO ONLY)" on public.menu_items;
--   drop policy if exists "Menu items are insertable by everyone (DEMO ONLY)" on public.menu_items;
--   drop policy if exists "Paper POS imports are deletable by everyone" on public.paper_pos_imports;
--   drop policy if exists "Paper POS imports are updatable by everyone" on public.paper_pos_imports;
--
-- reporting_sales_details: SECURITY DEFINER view (advisor ERROR). Recreate as
-- security_invoker once the underlying tables have correct policies.
--   alter view public.reporting_sales_details set (security_invoker = true);
--
-- menu-images storage bucket: drops the broad list policy. Safe only if images
-- are referenced by direct public URL (not listed) — verify in the UI first.
--   drop policy if exists "Public Access" on storage.objects;
