-- Sample rows for the two test accounts. Run in the SQL Editor after creating both users.
-- The @example.com addresses below are fictional and fine to commit; real addresses are not.
-- They name the sample accounts only and are not anyone's real login. If you created your
-- test accounts under other addresses, change them here in the SQL Editor only, and do not
-- save that version to the repo.
-- All rows are marked sample content.

do $$
declare
  found_count integer;
begin
  select count(*) into found_count
    from auth.users
   where email in ('test-client-a@example.com', 'test-client-b@example.com');

  if found_count <> 2 then
    raise exception 'Expected exactly the two test accounts, found %. Nothing was inserted.', found_count;
  end if;

  insert into public.client_dashboards (user_id, first_name, plan_name, plan_items, check_in, steps, is_sample)
  select id, 'Sample Alex', 'Sample Starter Plan',
    array['Sample: monthly social posts', 'Sample: Google profile tune-up', 'Sample: one small local ad'],
    'Sample: every second Friday',
    '[
      {"title":"Sample step: pick your favourite shop photos","detail":"Sample detail: choose five photos you like.","due":"Sample date: this week","is_sample":true},
      {"title":"Sample step: approve the first week of posts","detail":"Sample detail: reply with a thumbs up or changes.","due":"Sample date: next week","is_sample":true},
      {"title":"Sample step: chat about next month’s offer","detail":"Sample detail: a short call or message.","due":"Sample date: end of month","is_sample":true}
    ]'::jsonb,
    true
    from auth.users where email = 'test-client-a@example.com';

  insert into public.client_dashboards (user_id, first_name, plan_name, plan_items, check_in, steps, is_sample)
  select id, 'Sample Blake', 'Sample Growth Plan',
    array['Sample: weekly newsletter draft', 'Sample: window poster design'],
    'Sample: every Tuesday morning',
    '[
      {"title":"Sample step: send the opening hours list","detail":"Sample detail: include holiday closures.","due":"Sample date: tomorrow","is_sample":true},
      {"title":"Sample step: review the poster draft","detail":"Sample detail: check spelling and colours.","due":"Sample date: in two weeks","is_sample":true}
    ]'::jsonb,
    true
    from auth.users where email = 'test-client-b@example.com';
end
$$;

-- You should see Sample Alex and Sample Blake.
select first_name, plan_name from public.client_dashboards order by first_name;
