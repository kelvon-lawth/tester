-- Run only after the user approves; undoes 07.1 and nothing from Phase 7.
-- Removes the five new tables, the seven new columns, the constraint and the two types.

begin;

drop table if exists public.report_archive cascade;
drop table if exists public.ad_results cascade;
drop table if exists public.content_calendar cascade;
drop table if exists public.dashboard_items cascade;
drop table if exists public.monthly_metrics cascade;

alter table public.client_dashboards drop constraint if exists report_month_first_day;

alter table public.client_dashboards
  drop column if exists plan_tier,
  drop column if exists report_month,
  drop column if exists next_check_in,
  drop column if exists renewal_on,
  drop column if exists kpi1_label,
  drop column if exists kpi2_label,
  drop column if exists kpi3_label;

drop type if exists public.item_kind, public.plan_tier;

notify pgrst, 'reload schema';

commit;
