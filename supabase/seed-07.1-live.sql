-- Sample data for the two live test clients (Phase 07.1). Fictional values only.
-- Rows are found by first_name, never by email. Safe to run again: it clears only these
-- two clients' rows in the new tables first.
-- Client A (Sample Alex, basics) also gets hidden Growth rows, so "0 rows for A" proves the
-- policy and not an empty table.

begin;

do $$
declare
  a uuid;
  b uuid;
  n integer;
begin
  select count(*) into n from public.client_dashboards where first_name = 'Sample Alex' and is_sample;
  if n <> 1 then
    raise exception 'Expected exactly one sample row for Sample Alex, found %. Nothing was changed.', n;
  end if;
  select count(*) into n from public.client_dashboards where first_name = 'Sample Blake' and is_sample;
  if n <> 1 then
    raise exception 'Expected exactly one sample row for Sample Blake, found %. Nothing was changed.', n;
  end if;
  if (select count(*) from public.client_dashboards where first_name in ('Sample Alex', 'Sample Blake')) <> 2 then
    raise exception 'A sample name matches a non-sample row. Nothing was changed.';
  end if;

  select user_id into a from public.client_dashboards where first_name = 'Sample Alex';
  select user_id into b from public.client_dashboards where first_name = 'Sample Blake';

  update public.client_dashboards set
    plan_tier = 'basics', report_month = '2026-10-01',
    next_check_in = '2026-12-04', renewal_on = '2027-01-15',
    kpi1_label = 'Sample: phone calls', kpi2_label = 'Sample: direction requests', kpi3_label = 'Sample: website visits'
  where user_id = a;

  update public.client_dashboards set
    plan_tier = 'growth', report_month = '2026-10-01',
    next_check_in = '2026-12-01', renewal_on = '2027-03-01',
    kpi1_label = 'Sample: phone calls', kpi2_label = 'Sample: website visits', kpi3_label = 'Sample: newsletter sign-ups'
  where user_id = b;

  delete from public.monthly_metrics   where user_id in (a, b);
  delete from public.dashboard_items   where user_id in (a, b);
  delete from public.content_calendar  where user_id in (a, b);
  delete from public.ad_results        where user_id in (a, b);
  delete from public.report_archive    where user_id in (a, b);

  insert into public.monthly_metrics (user_id, month, kpi1, kpi2, kpi3) values
    (a, '2026-05-01', 31, 18, 640), (a, '2026-06-01', 35, 20, 700), (a, '2026-07-01', 33, 22, 690),
    (a, '2026-08-01', 38, 25, 760), (a, '2026-09-01', 40, 24, 810), (a, '2026-10-01', 45, 27, 905),
    (a, '2026-11-01', 50, 30, 950),
    (b, '2026-05-01', 12, 420, 3), (b, '2026-06-01', 14, 450, 4), (b, '2026-07-01', 15, 430, 4),
    (b, '2026-08-01', 16, 470, 5), (b, '2026-09-01', 18, 410, 5), (b, '2026-10-01', 18, 388, 7),
    (b, '2026-11-01', 20, 400, 8);

  insert into public.dashboard_items (user_id, kind, title, detail, item_date, sort_order) values
    (a, 'waiting', 'Sample: pick your favourite shop photos', 'Sample: choose five photos you like.', '2026-11-27', 1),
    (a, 'waiting', 'Sample: approve the first week of posts', 'Sample: reply with a thumbs up or changes.', '2026-12-02', 2),
    (a, 'done', 'Sample: refreshed your Google opening hours', null, '2026-10-08', 0),
    (a, 'done', 'Sample: designed the autumn window poster', null, '2026-10-21', 0),
    (a, 'done', 'Sample: set up your monthly report', null, '2026-09-15', 0),
    (b, 'waiting', 'Sample: send the opening hours list', 'Sample: include holiday closures.', '2026-11-28', 1),
    (b, 'waiting', 'Sample: review the poster draft', 'Sample: check spelling and colours.', '2026-12-05', 2),
    (b, 'done', 'Sample: sent the October newsletter', null, '2026-10-14', 0),
    (b, 'done', 'Sample: launched the half-term ad', null, '2026-10-20', 0);

  insert into public.content_calendar (user_id, post_on, channel, title, status) values
    (a, current_date + 3, 'Instagram', 'Sample Alex hidden: autumn reel', null),
    (a, current_date + 6, 'Facebook', 'Sample Alex hidden: offer post', null),
    (b, current_date + 2, 'Instagram', 'Sample: Saturday bake sale post', 'Planned'),
    (b, current_date + 5, 'Facebook', 'Sample: newsletter teaser', 'Needs your OK'),
    (b, current_date + 11, 'Instagram', 'Sample: Christmas opening hours', 'Planned'),
    (b, current_date - 4, null, 'Sample: last week''s post', null),
    (b, current_date + 20, null, 'Sample: January sale post', null);

  insert into public.ad_results (user_id, month, campaign, spend, clicks, results, results_label) values
    (a, '2026-10-01', 'Sample Alex hidden campaign', 55.00, 120, 6, 'enquiries'),
    (b, '2026-10-01', 'Sample: half-term family offer', 120.50, 340, 18, 'enquiries'),
    (b, '2026-10-01', 'Sample: local search ads', 80.00, 210, 9, 'calls');

  insert into public.report_archive (user_id, month, title, url) values
    (a, '2026-10-01', 'Sample Alex hidden report October 2026', 'https://example.com/sample-alex-hidden-2026-10.pdf'),
    (b, '2026-10-01', 'Sample: October 2026 report', 'https://example.com/sample-blake-report-2026-10.pdf'),
    (b, '2026-09-01', 'Sample: September 2026 report', 'https://example.com/sample-blake-report-2026-09.pdf'),
    (b, '2026-08-01', 'Sample: August 2026 report', 'https://example.com/sample-blake-report-2026-08.pdf');
end
$$;

commit;

select first_name, plan_tier, report_month from public.client_dashboards
 where first_name in ('Sample Alex', 'Sample Blake') order by first_name;
