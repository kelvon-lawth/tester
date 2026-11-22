-- Sample rows for the two test accounts. Run in the SQL Editor after creating both users.
-- The @example.com addresses below are fictional and fine to commit; real addresses are not.
-- They name the sample accounts only and are not anyone's real login. If you created your
-- test accounts under other addresses, change them here in the SQL Editor only, and do not
-- save that version to the repo.
-- All rows are marked sample content. Client A is on the basics tier and also has hidden
-- Growth rows, so "0 rows for A" proves the policy and not an empty table.

do $$
declare
  found_count integer;
  a uuid;
  b uuid;
begin
  select count(*) into found_count
    from auth.users
   where email in ('test-client-a@example.com', 'test-client-b@example.com');

  if found_count <> 2 then
    raise exception 'Expected exactly the two test accounts, found %. Nothing was inserted.', found_count;
  end if;

  select id into a from auth.users where email = 'test-client-a@example.com';
  select id into b from auth.users where email = 'test-client-b@example.com';

  insert into public.client_dashboards
    (user_id, first_name, plan_name, plan_items, check_in, steps, is_sample,
     plan_tier, report_month, next_check_in, renewal_on, kpi1_label, kpi2_label, kpi3_label)
  values (a, 'Sample Alex', 'Sample Starter Plan',
    array['Sample: monthly social posts', 'Sample: Google profile tune-up', 'Sample: one small local ad'],
    'Sample: every second Friday',
    '[
      {"title":"Sample step: pick your favourite shop photos","detail":"Sample detail: choose five photos you like.","due":"Sample date: this week","is_sample":true},
      {"title":"Sample step: approve the first week of posts","detail":"Sample detail: reply with a thumbs up or changes.","due":"Sample date: next week","is_sample":true},
      {"title":"Sample step: chat about next month’s offer","detail":"Sample detail: a short call or message.","due":"Sample date: end of month","is_sample":true}
    ]'::jsonb,
    true,
    'basics', '2026-10-01', '2026-12-04', '2027-01-15',
    'Sample: phone calls', 'Sample: direction requests', 'Sample: website visits');

  insert into public.client_dashboards
    (user_id, first_name, plan_name, plan_items, check_in, steps, is_sample,
     plan_tier, report_month, next_check_in, renewal_on, kpi1_label, kpi2_label, kpi3_label)
  values (b, 'Sample Blake', 'Sample Growth Plan',
    array['Sample: weekly newsletter draft', 'Sample: window poster design'],
    'Sample: every Tuesday morning',
    '[
      {"title":"Sample step: send the opening hours list","detail":"Sample detail: include holiday closures.","due":"Sample date: tomorrow","is_sample":true},
      {"title":"Sample step: review the poster draft","detail":"Sample detail: check spelling and colours.","due":"Sample date: in two weeks","is_sample":true}
    ]'::jsonb,
    true,
    'growth', '2026-10-01', '2026-12-01', '2027-03-01',
    'Sample: phone calls', 'Sample: website visits', 'Sample: newsletter sign-ups');

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

-- You should see Sample Alex (basics) and Sample Blake (growth).
select first_name, plan_name, plan_tier from public.client_dashboards order by first_name;
