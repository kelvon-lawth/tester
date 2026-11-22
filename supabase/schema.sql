-- Client dashboards: one row per client. Run this whole file in the Supabase SQL Editor.
-- The protection lives here in the database (row level security), not in the web page.
-- No real client data belongs in these tables until the human security check has passed.
-- This is the fresh-project version in its final Phase 07.1 state. An existing project
-- that already has Phase 7 applies supabase/migration-07.1.sql instead.

create type public.plan_tier as enum ('basics', 'growth');
create type public.item_kind as enum ('waiting', 'done');

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
  updated_at timestamptz not null default now(),
  -- Default 'basics' so any row not set on purpose stays locked.
  plan_tier     public.plan_tier not null default 'basics',
  -- First day of the month the numbers describe, set by hand.
  report_month  date,
  next_check_in date,
  renewal_on    date,
  kpi1_label    text,
  kpi2_label    text,
  kpi3_label    text,
  constraint report_month_first_day check (report_month is null or extract(day from report_month) = 1)
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

-- Monthly numbers: one row per client per month.
create table public.monthly_metrics (
  user_id uuid not null references public.client_dashboards (user_id) on delete cascade,
  month   date not null check (extract(day from month) = 1),
  kpi1    numeric check (kpi1 >= 0),
  kpi2    numeric check (kpi2 >= 0),
  kpi3    numeric check (kpi3 >= 0),
  primary key (user_id, month)
);

-- Waiting and done items (every client).
create table public.dashboard_items (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.client_dashboards (user_id) on delete cascade,
  kind       public.item_kind not null default 'waiting',
  title      text not null,
  detail     text,
  item_date  date,
  sort_order int not null default 0
);
create index dashboard_items_user_idx on public.dashboard_items (user_id);

-- Growth-only tables.
create table public.content_calendar (
  id      bigint generated always as identity primary key,
  user_id uuid not null references public.client_dashboards (user_id) on delete cascade,
  post_on date not null,
  channel text,
  title   text not null,
  status  text
);
create index content_calendar_user_idx on public.content_calendar (user_id, post_on);

create table public.ad_results (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.client_dashboards (user_id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  campaign      text not null default 'All ads',
  spend         numeric(10,2) check (spend >= 0),
  clicks        integer check (clicks >= 0),
  results       integer check (results >= 0),
  results_label text not null default 'enquiries'
);
create index ad_results_user_idx on public.ad_results (user_id, month);

create table public.report_archive (
  id      bigint generated always as identity primary key,
  user_id uuid not null references public.client_dashboards (user_id) on delete cascade,
  month   date not null check (extract(day from month) = 1),
  title   text not null,
  url     text not null check (url ~ '^https://')
);
create index report_archive_user_idx on public.report_archive (user_id, month);

-- Row level security and explicit privileges on every new table.
alter table public.monthly_metrics  enable row level security;
alter table public.dashboard_items  enable row level security;
alter table public.content_calendar enable row level security;
alter table public.ad_results       enable row level security;
alter table public.report_archive   enable row level security;

revoke all on public.monthly_metrics  from public, anon, authenticated;
revoke all on public.dashboard_items  from public, anon, authenticated;
revoke all on public.content_calendar from public, anon, authenticated;
revoke all on public.ad_results       from public, anon, authenticated;
revoke all on public.report_archive   from public, anon, authenticated;

grant select on public.monthly_metrics  to authenticated;
grant select on public.dashboard_items  to authenticated;
grant select on public.content_calendar to authenticated;
grant select on public.ad_results       to authenticated;
grant select on public.report_archive   to authenticated;

-- Policies. Read only, own rows only. No write policy exists anywhere.
create policy "clients read own items" on public.dashboard_items
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Metrics: never past the reported month; Basics see only the reported month and the one before.
create policy "clients read own metrics by plan" on public.monthly_metrics
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid())
        and d.report_month is not null
        and monthly_metrics.month <= d.report_month
        and (d.plan_tier = 'growth'
             or monthly_metrics.month >= (d.report_month - interval '1 month')::date)
    )
  );

-- Growth-only: own rows AND the caller's own dashboard row is on the growth tier.
create policy "growth clients read own calendar" on public.content_calendar
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid()) and d.plan_tier = 'growth'
    )
  );

create policy "growth clients read own ad results" on public.ad_results
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid()) and d.plan_tier = 'growth'
    )
  );

create policy "growth clients read own reports" on public.report_archive
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid()) and d.plan_tier = 'growth'
    )
  );

-- Verification: run these three queries and share the results.
-- 1) Row level security is on for all six tables (expect t on every row):
select c.relname, c.relrowsecurity from pg_class c
 where c.oid in (
   'public.client_dashboards'::regclass, 'public.monthly_metrics'::regclass,
   'public.dashboard_items'::regclass, 'public.content_calendar'::regclass,
   'public.ad_results'::regclass, 'public.report_archive'::regclass)
 order by c.relname;

-- 2) Exactly six rules, all command SELECT, roles {authenticated}:
select tablename, policyname, cmd, roles from pg_policies
 where schemaname = 'public' order by tablename, policyname;

-- 3) Only SELECT for authenticated, and no rows at all for anon:
select table_name, grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public'
   and table_name in ('client_dashboards','monthly_metrics','dashboard_items','content_calendar','ad_results','report_archive')
   and grantee in ('anon','authenticated')
 order by table_name, grantee;
