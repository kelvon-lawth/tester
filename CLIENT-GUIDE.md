# Client login: the marketer's guide

This guide is for you, the marketer. It explains how to give a client a login, change what they see, and keep the project healthy. You do not need to write any code. It is not part of the website: it never gets published.

## Read this first: email limits (what email can't do yet)

Supabase's built-in email only reaches members of your own Supabase team, and only 2 emails an hour. That means real clients will not receive invite or password-reset emails yet.

So, for now:

1. You create each client's account yourself, with a temporary password (see "Adding a client").
2. If a client forgets their password, they contact you and you set a new one (see "Setting a temporary password").

The "forgotten password" and invite pages exist and work, but they only help people on your Supabase team until an email service is added. Adding one is future work. It normally needs a sending domain (an address like hello@yourbusiness.co.uk that you own).

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
   - `check_in`: when you next talk, for example `Every second Friday`.
   - `is_sample`: leave on (true) for practice content, turn off for real content.
   - `steps`: their next steps. Copy this example and change the words, keeping the punctuation exactly as it is:

```
[
  {"title":"Pick your favourite shop photos","detail":"Choose five photos you like.","due":"This week","is_sample":false},
  {"title":"Approve the first week of posts","detail":"Reply with a thumbs up or changes.","due":"Next week","is_sample":false}
]
```

A typing mistake in `steps` (a missing quote or comma, say) does not break the page. The steps just don't show, so look at the page after saving to check.

Changes appear the next time the client loads the page. Clients cannot edit any of this themselves.

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
