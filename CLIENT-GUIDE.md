# Client login: the marketer's guide

This guide is for you, the marketer. It explains how to give a client a login, change what they see, and keep the project healthy. You do not need to write any code. It is not part of the website: it never gets published.

## Read this first: email limits (what email can do now)

Since 19 November 2026 the project sends its emails through Resend, from no-reply@samwhitlockmarketing.com.de. Invite and password-reset emails now reach any client's address, not only your Supabase team.

The limits that remain:

1. Supabase sends at most 30 emails an hour across the project. Resend's free plan also has its own daily and monthly caps (check your Resend dashboard).
2. If an email doesn't arrive, ask the client to check their spam folder, wait a few minutes, then send it again. Resend's **Logs** page shows whether it went out.
3. You can still create a client yourself with a temporary password (see "Adding a client"). This works even if email is down.

Two ways to give a client a login:

- **Invite by email:** in **Authentication**, **Users**, press **Add user**, then **Send invitation**, and type their email. They get a link and choose their own password.
- **Temporary password:** follow "Adding a client" below.

## Adding a client

1. Open your project in the Supabase website and sign in.
2. In the left menu choose **Authentication**, then **Users**.
3. Press **Add user**, then **Create new user**.
4. Type the client's email address and a temporary password (see the next section).
5. Turn **Auto Confirm User** on, so they can sign in straight away. (The labels may look slightly different from these.)
6. Press **Create user**.

Sign-up stays switched off. Nobody can create their own account, so only people you add can sign in.

## Setting a temporary password

1. Choose a long password: at least 10 characters. A few random words joined together works well.
2. Share it with the client privately, by phone or in person. Do not put it in the same message as their email address.
3. Ask them to sign in and press **Change your password** on their dashboard straight away.

If a client forgets their password: open **Authentication**, **Users**, find them, and choose the option to set or reset their password. Type a new temporary password, share it privately as above, and ask them to change it.

## Editing a dashboard (a client's page)

Each client sees one row of information. You edit it in the Supabase website:

1. Choose **Table Editor** in the left menu, then the table `client_dashboards`.
2. For a new client press **Insert**, then **Insert row**. For an existing client, click the row to edit it.
3. In `user_id`, paste the client's user id. You find it in **Authentication**, **Users**, in the **User UID** column.
4. Fill in the other fields:
   - `first_name`: what the page calls them, for example `Alex`.
   - `plan_name`: for example `Growth Plan`.
   - `plan_items`: the list of things included in their plan. Add one line per item.
   - `check_in`: the human description of when you talk, for example `Every second Friday`.
   - `plan_tier`: a dropdown, `basics` or `growth` (see "Changing a client's plan").
   - `report_month`: always the 1st of the month, for example `2026-10-01`. The page shows "Figures for October 2026".
   - `next_check_in` and `renewal_on`: date pickers for the next check-in and the plan renewal.
   - `kpi1_label`, `kpi2_label`, `kpi3_label`: the three numbers you track for this client, for example `Phone calls`. Keep them the same every month so changes compare like with like.
   - `is_sample`: leave on (true) for practice content, turn off for real content.
   - `steps`: no longer shown on the page. You can leave it as it is.

Changes appear the next time the client loads the page. Clients cannot edit any of this themselves.

## Every month (about 5 minutes per client)

1. **monthly_metrics:** open last month's row, use the row menu to **Duplicate row**, change the month to the 1st of the new month and type the three numbers.
2. **client_dashboards:** set `report_month` to that month and update `next_check_in` and `renewal_on`.
3. **dashboard_items:** change finished items from waiting to done and set `item_date` to the day they were done (only items dated inside the report month show under "Done this month"). Add new waiting items and use `sort_order` to put them in order.
4. **Growth clients only:** add `content_calendar` rows for the next 2 weeks, one `ad_results` row per campaign for the month, and one `report_archive` row with an https link.

Tip on `user_id`: copy it from the client's `client_dashboards` row (or from **Authentication**, **Users**). The **Duplicate row** shortcut keeps it, so you rarely need to paste it.

### Error messages you might see

- A date that is not the 1st in a month column is refused.
- Negative numbers are refused.
- Report links must start with `https://` or they are refused.
- If `report_month` is missing, the client sees "Your first numbers will appear here...".

## Changing a client's plan

Edit `plan_tier` on their `client_dashboards` row. The change applies on their next page load.

- Local Basics clients see the four Growth cards locked, with an "Ask about Growth" email link.
- The lock is enforced by the database, so a Basics client cannot read Growth rows even through the API.
- Downgrading deletes nothing. The Growth rows stay and show again if the client goes back to Growth.

## Removing a client

In **Authentication**, **Users**, delete the user. Their dashboard row is removed automatically.

## Before a demo: check the project is awake

Free Supabase projects pause after about 7 days of low activity. While paused, login and the dashboard show "I couldn’t reach the sign-in service".

A day or so before a demo:

1. Open the Supabase website and look at your project.
2. If it says it is paused, press **Resume** or **Restore** and wait for it to start.
3. Sign in to the site with a test account to confirm it works.

This risk was accepted for the prototype. No keep-alive is set up.

## Real client data

Use sample content only until the human security check has passed (decision D-11). The result of that check is recorded in `.planning/phases/07-client-login-dashboard/07-LIVE-EVIDENCE.md`. Note that the free plan has fewer protections and no guarantees, so keep that in mind before holding real client information.

## What never to share

- The **secret key** (also called the service-role key).
- The **database password**.
- Any **client's password**, except the temporary one you give that client.

The project URL and the **publishable key** are meant to be public and are fine. They are already in the website's files.
