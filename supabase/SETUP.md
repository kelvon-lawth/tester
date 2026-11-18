# Supabase setup, step by step

You do these steps once, in your own browser. Labels in the console may differ slightly
from the ones below; if something is named differently or missing, tell Claude.

Public and private values:
- The project URL and the publishable key (starts with `sb_publishable_`) are public values
  and fine to share in chat.
- The secret key, the database password and the test passwords never go in chat. If you
  paste one by accident, rotate it in the console.

## Steps

1. Create a free Supabase account and project, in a region near you. Store the database
   password in your password manager. Claude does not need it and it must not be shared.
2. In Authentication settings: turn OFF "Allow new users to sign up". Set the minimum
   password length to 10. Check "Confirm email" is on. If offered, set "Email OTP
   expiration" to 24 hours (86400 seconds). Tell Claude if any label differs or the
   setting isn't there.
3. In Authentication, URL Configuration: set Site URL to `https://tester-five-sage.vercel.app`
   and add the redirect URL `https://tester-five-sage.vercel.app/**`. Do not add preview
   wildcards.
4. In Authentication, Email Templates: paste the Invite and Reset templates from
   `supabase/email-templates.md`.
5. In the SQL Editor: run `supabase/schema.sql`. Share the results of the three
   verification queries at the end (they contain no secrets). Expected: row level security
   on (t); one SELECT rule for {authenticated}; only SELECT for authenticated and nothing
   for anon. Also check that Security Advisor shows no "RLS disabled" warning for this table.
6. In Authentication, Users, Add user, Create new user: create `test-client-a@example.com`
   and `test-client-b@example.com`, each with a different long password of your choosing,
   and auto-confirm on. If the console refuses that address, use an address you control and
   tell Claude only that it was refused. Don't reuse any account you rely on elsewhere. Then
   run `supabase/seed-test-clients.sql` in the SQL Editor. If you used other addresses,
   change them in the editor only and don't save the file. It stops with an error unless it
   finds exactly those two accounts, and it should finish by showing Sample Alex and
   Sample Blake.
7. Check the invite behaviour: with sign-up still off, use Add user, Send invitation, to the
   email of a member of your Supabase organisation. Report whether the console accepted it
   and whether the email arrived. Do not click the link, because the page isn't live yet.
   Then delete that invited user. This uses 1 of the 2 emails per hour.
8. Put the test credentials on this computer where only the test tools can read them. In
   your own Terminal window, not in the chat, run `touch .env.local && chmod 600 .env.local`
   in the project folder, and add these four lines using a text editor:
   `TEST_CLIENT_A_EMAIL=`, `TEST_CLIENT_A_PASSWORD=`, `TEST_CLIENT_B_EMAIL=`,
   `TEST_CLIENT_B_PASSWORD=`, each followed by your value. The file is ignored by git,
   Claude will not open it, and the tests load it themselves and print no values. If you
   would rather not have a file, set those variables in your own Terminal and run
   `node tools/auth-rls-test.js` there, then paste only the printed table, which never
   contains credentials.
9. In Project Settings, API Keys: copy the Project URL and the publishable key and paste
   only those two into the chat. Do not share the secret key.

## What to reply with

The project URL, the publishable key, the three SQL results, the invite result, and any
labels that differed. Or reply "not yet" and the phase stops here with an honest status.
