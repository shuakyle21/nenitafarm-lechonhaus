-- RLS Hardening — Option A: server-side session tokens + SECURITY DEFINER RPCs
--
-- Verified against the live DB 2026-06-05. See src/docs/RLS_HARDENING_PLAN.md.
--
-- Goal: stop trusting the anon client. Mutations move behind SECURITY DEFINER
-- RPCs that each validate a session token minted by authenticate_user. Once the
-- frontend calls these RPCs instead of direct .from().insert()/.update()/
-- .delete(), the blanket USING(true) write policies can be dropped (Part 2 of
-- 20260605_rls_option_c_stopgap.sql) and the tables are no longer client-writable.
--
-- pgcrypto lives in the `extensions` schema (verified). All functions pin
-- search_path = '' and fully-qualify references.
--
-- The Supabase MCP is read-only; apply from the SQL editor / CLI and validate on
-- a Supabase branch before prod. Roll out in this order:
--   1. Apply this migration (adds RPCs; nothing breaks — old direct DML still works).
--   2. Switch the frontend to the RPCs (see the wiring notes at the bottom).
--   3. Apply Part 2 of the stopgap to revoke direct DML.

begin;

-- =====================================================================
-- 1. SESSION STORE
-- =====================================================================
-- Opaque token is returned to the client ONCE; only its SHA-256 hash is stored,
-- so a DB leak does not expose usable tokens. RLS-enabled with no policy => the
-- anon client can never read/write this table directly; only the SECURITY
-- DEFINER functions below touch it.
create table if not exists public.user_sessions (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  last_seen   timestamptz not null default now()
);

create index if not exists user_sessions_token_hash_idx on public.user_sessions (token_hash);
create index if not exists user_sessions_expires_at_idx on public.user_sessions (expires_at);

alter table public.user_sessions enable row level security;
-- (no policies => no direct anon/authenticated access)

-- Default session lifetime. Adjust to taste.
-- (kept inline in functions below rather than a GUC for simplicity)

-- =====================================================================
-- 2. AUTH: issue a token on successful login
-- =====================================================================
-- Return type changes (adds token + expires_at), so drop before recreate.
drop function if exists public.authenticate_user(text, text);

create function public.authenticate_user(p_username text, p_password text)
  returns table(id uuid, username text, role text, token text, expires_at timestamptz)
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_user   public.users%rowtype;
  v_token  text;
  v_expiry timestamptz := now() + interval '12 hours';
begin
  select * into v_user
  from public.users u
  where u.username = p_username
    and u.password_hash = extensions.crypt(p_password, u.password_hash);

  if not found then
    -- Return empty set on bad credentials (matches current frontend behaviour:
    -- LoginModule treats data.length === 0 as "invalid login").
    return;
  end if;

  -- Opaque 256-bit token; only its hash is persisted.
  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.user_sessions (token_hash, user_id, role, expires_at)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), v_user.id, v_user.role, v_expiry);

  -- Opportunistic cleanup of expired sessions.
  delete from public.user_sessions s where s.expires_at < now();

  return query select v_user.id, v_user.username, v_user.role, v_token, v_expiry;
end;
$$;

-- =====================================================================
-- 3. SESSION VALIDATION HELPER (internal; used by every mutation RPC)
-- =====================================================================
-- Returns the live session row or raises. Also slides last_seen forward.
-- NOT granted to anon (callers reach it only indirectly via the RPCs below).
create or replace function public._session_user(p_token text)
  returns public.user_sessions
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
begin
  if p_token is null or length(p_token) = 0 then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;

  select * into v_session
  from public.user_sessions s
  where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');

  if not found then
    raise exception 'INVALID_SESSION' using errcode = '28000';
  end if;

  if v_session.expires_at < now() then
    delete from public.user_sessions s where s.id = v_session.id;
    raise exception 'SESSION_EXPIRED' using errcode = '28000';
  end if;

  update public.user_sessions s set last_seen = now() where s.id = v_session.id;
  return v_session;
end;
$$;

-- Internal role-guard helper.
create or replace function public._require_role(p_token text, p_role text)
  returns public.user_sessions
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
begin
  v_session := public._session_user(p_token);
  if v_session.role <> p_role then
    raise exception 'FORBIDDEN' using errcode = '42501';
  end if;
  return v_session;
end;
$$;

-- =====================================================================
-- 4. LOGOUT
-- =====================================================================
create or replace function public.logout(p_token text)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
begin
  delete from public.user_sessions s
  where s.token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
end;
$$;

-- =====================================================================
-- 5. MUTATION RPCs
-- =====================================================================

-- 5a. create_order — atomic header + items insert (replaces the two-step,
-- non-atomic insert in useOfflineSync.insertOrderToSupabase / paperPos sync).
-- p_items: jsonb array of { menu_item_id, name, quantity, price_at_time, weight }
create or replace function public.create_order(
  p_token        text,
  p_order        jsonb,
  p_items        jsonb
)
  returns public.orders
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
  v_order   public.orders%rowtype;
  v_item    jsonb;
begin
  v_session := public._session_user(p_token);

  insert into public.orders (
    total_amount, status, payment_method, payment_reference, discount_details,
    cash, change, order_type, delivery_address, delivery_time, contact_number,
    table_number, server_name, created_at, created_by
  )
  values (
    (p_order->>'total_amount')::numeric,
    coalesce(p_order->>'status', 'completed'),
    coalesce(p_order->>'payment_method', 'CASH'),
    p_order->>'payment_reference',
    p_order->'discount_details',
    nullif(p_order->>'cash','')::numeric,
    nullif(p_order->>'change','')::numeric,
    coalesce(p_order->>'order_type', 'DINE_IN'),
    p_order->>'delivery_address',
    p_order->>'delivery_time',
    p_order->>'contact_number',
    p_order->>'table_number',
    p_order->>'server_name',
    coalesce(nullif(p_order->>'created_at','')::timestamptz, now()),
    v_session.user_id
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.order_items (order_id, menu_item_id, name, quantity, price_at_time, weight)
    values (
      v_order.id,
      nullif(v_item->>'menu_item_id','')::uuid,
      v_item->>'name',
      (v_item->>'quantity')::numeric,
      (v_item->>'price_at_time')::numeric,
      nullif(v_item->>'weight','')::numeric
    );
  end loop;

  return v_order;  -- whole function is one transaction: items fail => order rolls back
end;
$$;

-- 5b. void_order — soft-delete (sets deleted_at) or hard-delete. ADMIN only.
-- Current frontend hard-deletes; switch to soft-delete if you add the column use.
create or replace function public.void_order(p_token text, p_order_id uuid)
  returns void
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
begin
  v_session := public._require_role(p_token, 'ADMIN');
  delete from public.orders o where o.id = p_order_id;  -- order_items cascade via FK
end;
$$;

-- 5c. import_paper_record — single paper POS import.
create or replace function public.import_paper_record(p_token text, p_record jsonb)
  returns public.paper_pos_imports
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
  v_row     public.paper_pos_imports%rowtype;
begin
  v_session := public._session_user(p_token);

  insert into public.paper_pos_imports (
    date, items, total_amount, payment_method, order_type, notes, imported_by, synced
  )
  values (
    p_record->>'date',
    p_record->>'items',
    (p_record->>'total_amount')::numeric,
    coalesce(p_record->>'payment_method', 'CASH'),
    coalesce(p_record->>'order_type', 'DINE_IN'),
    p_record->>'notes',
    p_record->>'imported_by',
    false
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- 5d. record_staff_transaction — advances/payouts/etc. ADMIN only (payroll).
create or replace function public.record_staff_transaction(p_token text, p_txn jsonb)
  returns public.staff_transactions
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
  v_row     public.staff_transactions%rowtype;
begin
  v_session := public._require_role(p_token, 'ADMIN');

  insert into public.staff_transactions (
    staff_id, amount, type, description, notes,
    pay_period_start, pay_period_end, date, status, created_by
  )
  values (
    (p_txn->>'staff_id')::uuid,
    (p_txn->>'amount')::numeric,
    p_txn->>'type',
    p_txn->>'description',
    p_txn->>'notes',
    nullif(p_txn->>'pay_period_start','')::date,
    nullif(p_txn->>'pay_period_end','')::date,
    coalesce(nullif(p_txn->>'date','')::date, current_date),
    coalesce(p_txn->>'status', 'PENDING'),
    v_session.user_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- 5e. record_expense — ADMIN only.
create or replace function public.record_expense(p_token text, p_expense jsonb)
  returns public.expenses
  language plpgsql
  security definer
  set search_path = ''
as $$
declare
  v_session public.user_sessions%rowtype;
  v_row     public.expenses%rowtype;
begin
  v_session := public._require_role(p_token, 'ADMIN');

  insert into public.expenses (amount, reason, requested_by, date, created_by)
  values (
    (p_expense->>'amount')::numeric,
    p_expense->>'reason',
    p_expense->>'requested_by',
    coalesce(nullif(p_expense->>'date','')::timestamptz, now()),
    v_session.user_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

-- =====================================================================
-- 6. GRANTS
-- =====================================================================
-- The anon client may invoke these RPCs (each enforces the session internally).
grant execute on function public.authenticate_user(text, text)               to anon, authenticated;
grant execute on function public.logout(text)                                to anon, authenticated;
grant execute on function public.create_order(text, jsonb, jsonb)            to anon, authenticated;
grant execute on function public.void_order(text, uuid)                      to anon, authenticated;
grant execute on function public.import_paper_record(text, jsonb)            to anon, authenticated;
grant execute on function public.record_staff_transaction(text, jsonb)       to anon, authenticated;
grant execute on function public.record_expense(text, jsonb)                 to anon, authenticated;

-- Internal helpers must NOT be callable from the REST API.
revoke execute on function public._session_user(text)        from anon, authenticated, public;
revoke execute on function public._require_role(text, text)  from anon, authenticated, public;

commit;

-- =====================================================================
-- FRONTEND WIRING NOTES (apply step 2 after this migration)
-- =====================================================================
--
-- 1. Login (src/components/LoginModule.tsx): authenticate_user now also returns
--    `token` and `expires_at`. Persist the token and pass it to every RPC:
--
--      const { data } = await supabase.rpc('authenticate_user', { p_username, p_password });
--      const u = data[0];
--      sessionStorage.setItem('session_token', u.token);   // or in-memory/app state
--      onLogin({ id: u.id, username: u.username, role: u.role });
--
--    On logout: supabase.rpc('logout', { p_token }); sessionStorage.removeItem(...)
--
-- 2. Orders (src/hooks/useOfflineSync.ts insertOrderToSupabase): replace the
--    two .from('orders')/.from('order_items') inserts with one atomic call:
--
--      const { data: order, error } = await supabase.rpc('create_order', {
--        p_token,
--        p_order: { total_amount: order.total, payment_method: order.paymentMethod, ... },
--        p_items: order.items.map(i => ({ menu_item_id: i.id, name: i.name,
--                   quantity: i.quantity, price_at_time: i.price, weight: i.weight })),
--      });
--      // inventory deduction stays client-side for now (or fold into the RPC later)
--
-- 3. Delete order (orderService.deleteOrder): supabase.rpc('void_order', { p_token, p_order_id: id })
--
-- 4. Paper POS (paperPosImportService.importRecord): supabase.rpc('import_paper_record', { p_token, p_record })
--    The .syncRecordToOrder header+items inserts should reuse create_order.
--
-- 5. Staff txns (StaffModule / FinancialModule / staffManagementService):
--    supabase.rpc('record_staff_transaction', { p_token, p_txn })
--
-- 6. Expenses (FinancialModule / paperPosImportService.importExpenses):
--    supabase.rpc('record_expense', { p_token, p_expense })
--
-- Handle the raised errors (AUTH_REQUIRED / INVALID_SESSION / SESSION_EXPIRED /
-- FORBIDDEN) by sending the user back to the login screen.
--
-- Once ALL direct mutations are routed through RPCs, apply Part 2 of
-- 20260605_rls_option_c_stopgap.sql to drop the USING(true) write policies and
-- enable RLS on expenses.
