-- Phase 07.1 migration: plan tiers, monthly numbers, items, and the Growth-only tables.
-- ADDITIVE ONLY: new types, new columns, new tables, new policies. Nothing is removed or
-- changed in type, so the deployed Phase 7 page keeps working before and after this runs.
-- The old columns (steps, plan_name, plan_items, check_in) are kept for that page.
-- Apply this BEFORE the new dashboard page ships. Safe to run again.
-- The protection lives here in the database (row level security), not in the web page.

begin;

-- 1. Tier on the existing table. Default 'basics' means any row not set on purpose stays locked.
do $$ begin
  create type public.plan_tier as enum ('basics', 'growth');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.item_kind as enum ('waiting', 'done');
exception when duplicate_object then null; end $$;

alter table public.client_dashboards
  add column if not exists plan_tier     public.plan_tier not null default 'basics',
  add column if not exists report_month  date,
  add column if not exists next_check_in date,
  add column if not exists renewal_on    date,
  add column if not exists kpi1_label    text,
  add column if not exists kpi2_label    text,
  add column if not exists kpi3_label    text;

-- report_month is the first day of the month the numbers describe, set by hand.
do $$ begin
  alter table public.client_dashboards
    add constraint report_month_first_day
    check (report_month is null or extract(day from report_month) = 1);
exception when duplicate_object then null; end $$;

-- 2. Monthly numbers: one row per client per month.
create table if not exists public.monthly_metrics (
  user_id uuid not null references public.client_dashboards (user_id) on delete cascade,
  month   date not null check (extract(day from month) = 1),
  kpi1    numeric check (kpi1 >= 0),
  kpi2    numeric check (kpi2 >= 0),
  kpi3    numeric check (kpi3 >= 0),
  primary key (user_id, month)
);

-- 3. Waiting and done items (every client).
create table if not exists public.dashboard_items (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.client_dashboards (user_id) on delete cascade,
  kind       public.item_kind not null default 'waiting',
  title      text not null,
  detail     text,
  item_date  date,
  sort_order int not null default 0
);
create index if not exists dashboard_items_user_idx on public.dashboard_items (user_id);

-- 4. Growth-only tables.
create table if not exists public.content_calendar (
  id      bigint generated always as identity primary key,
  user_id uuid not null references public.client_dashboards (user_id) on delete cascade,
  post_on date not null,
  channel text,
  title   text not null,
  status  text
);
create index if not exists content_calendar_user_idx on public.content_calendar (user_id, post_on);

create table if not exists public.ad_results (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.client_dashboards (user_id) on delete cascade,
  month         date not null check (extract(day from month) = 1),
  campaign      text not null default 'All ads',
  spend         numeric(10,2) check (spend >= 0),
  clicks        integer check (clicks >= 0),
  results       integer check (results >= 0),
  results_label text not null default 'enquiries'
);
create index if not exists ad_results_user_idx on public.ad_results (user_id, month);

create table if not exists public.report_archive (
  id      bigint generated always as identity primary key,
  user_id uuid not null references public.client_dashboards (user_id) on delete cascade,
  month   date not null check (extract(day from month) = 1),
  title   text not null,
  url     text not null check (url ~ '^https://')
);
create index if not exists report_archive_user_idx on public.report_archive (user_id, month);

-- 5. Row level security and explicit privileges on every new table.
-- Remove everything first, then give signed-in clients read access only.
do $$
declare t text;
begin
  foreach t in array array['monthly_metrics','dashboard_items','content_calendar','ad_results','report_archive']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant select on public.%I to authenticated', t);
  end loop;
end $$;

-- 6. Policies. Read only, own rows only. No write policy exists anywhere.
drop policy if exists "clients read own items" on public.dashboard_items;
create policy "clients read own items" on public.dashboard_items
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Metrics: never past the reported month; Basics see only the reported month and the one before.
drop policy if exists "clients read own metrics by plan" on public.monthly_metrics;
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
drop policy if exists "growth clients read own calendar" on public.content_calendar;
create policy "growth clients read own calendar" on public.content_calendar
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid()) and d.plan_tier = 'growth'
    )
  );

drop policy if exists "growth clients read own ad results" on public.ad_results;
create policy "growth clients read own ad results" on public.ad_results
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid()) and d.plan_tier = 'growth'
    )
  );

drop policy if exists "growth clients read own reports" on public.report_archive;
create policy "growth clients read own reports" on public.report_archive
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.client_dashboards d
      where d.user_id = (select auth.uid()) and d.plan_tier = 'growth'
    )
  );

notify pgrst, 'reload schema';

commit;
