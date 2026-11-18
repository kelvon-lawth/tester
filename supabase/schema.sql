-- Client dashboards: one row per client. Run this whole file in the Supabase SQL Editor.
-- The protection lives here in the database (row level security), not in the web page.
-- No real client data belongs in this table until the human security check has passed.

-- One row per client. user_id is the owner and the only thing the policy looks at.
create table public.client_dashboards (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  plan_name  text not null,
  plan_items text[] not null default '{}',
  check_in   text,
  -- array of objects: title, detail, due, is_sample (boolean)
  steps      jsonb not null default '[]'::jsonb,
  is_sample  boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.client_dashboards enable row level security;

-- Explicit privileges. Remove everything first so no role keeps a default, then
-- give signed-in clients read access only. Nobody else gets any access.
revoke all on public.client_dashboards from public, anon, authenticated;
grant select on public.client_dashboards to authenticated;

-- Read-own rule. There is no write rule and no write privilege, so clients cannot change rows.
-- The marketer edits rows in the console, which uses the owner role and bypasses this.
create policy "clients read own dashboard"
  on public.client_dashboards
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Verification: run these three queries and share the results.
-- 1) Row level security is on (expect t):
select relrowsecurity from pg_class where oid = 'public.client_dashboards'::regclass;

-- 2) Exactly one rule, command SELECT, roles {authenticated}:
select policyname, cmd, roles from pg_policies where tablename = 'client_dashboards';

-- 3) Only SELECT for authenticated, and no rows at all for anon:
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'client_dashboards' and grantee in ('anon','authenticated');
