RLS-RUN | 2026-11-18 | ce7cd0ba792d6f34353b43bbc2fb9bbe826c7a8a | NOT RUN

## 2026-11-18 status

The user replied "not yet" at the 07-04 Task 2 checkpoint: no Supabase project exists yet. AUTH-05 and AUTH-06 are not verified. The phase is paused at this checkpoint, and nothing may be pushed until a later line says RLS OK.

## 2026-11-18 live sign-in group (07-05 Task 4)

LIVE-SIGNIN | 2026-11-18 | NOT RUN

Reason: no Supabase project exists yet (07-04 Task 2 is paused at "not yet"), so there are no real project values and no test client accounts. `node tools/auth-browser-test.js live` exited 2 with "missing TEST_CLIENT_A_EMAIL, TEST_CLIENT_A_PASSWORD, TEST_CLIENT_B_EMAIL, TEST_CLIENT_B_PASSWORD". `js/auth-config.js` holds a PLACEHOLDER stand-in that 07-04 Task 3 must replace.

Not proven live: client A signs in and sees A's content, reload keeps the session, sign-out, client B sees only B's content. AUTH-02 and AUTH-04 stay open. Nothing may be pushed until this line says it passed.

What the app does with each error status (decided from HTTP status, from the stubbed behaviour only; real service behaviour is unobserved):
- 429: "Let's slow down a moment" banner, form kept.
- 400, 401, 403 at sign-in: one "That didn't work" message for wrong email, wrong password and unconfirmed account; password cleared, email kept.
- Network failure, status 0, 5xx and anything unknown: "I couldn't reach the sign-in service" with Try again, form kept.
- 401 or PGRST301 on the dashboard row read: local session dropped, "Your session has ended. Please sign in again." shown on the login page.

## 2026-11-18 live regression run (07-06 Task 3)

LIVE-REGRESSION | 2026-11-18 | NOT RUN

Reason: same as above, no project and no test credentials. `node tools/auth-browser-test.js live` reports "LIVE TESTS NOT RUN: missing TEST_CLIENT_A_EMAIL ...". Also unobserved live: research assumption A3 (what the recover endpoint returns for an unknown address; the page shows one identical result for any non-429, non-network outcome, so it is covered either way), real email delivery and link format for invite and reset (07-09).

## 2026-11-18 security headers run (07-07 Task 1)

CSP headers from vercel.json applied by the local test server. PASS: `check-auth csp secrets`, `check-deploy`, and `auth-browser-test csp public stub-login stub-dashboard stub-setpass` (no CSP violation on 10 page loads, Home and Contact included).

LIVE-UNDER-CSP | 2026-11-18 | NOT RUN

Reason: no Supabase project and no test credentials; `node tools/auth-browser-test.js live` exited 2 with "missing TEST_CLIENT_A_EMAIL ...". Whether connect-src lets the real sign-in through is unproven. connect-src currently names the stand-in origin https://standin.supabase.co and must be changed together with js/auth-config.js in 07-04 Task 3 (the csp guard fails if they drift). The policy still has to be proven on the deployed site in 07-08.
RLS-RUN | 2026-11-18 | d34f18a7928831e2cd377b47f963f25923112f9b | NOT RUN

## Pre-push (2026-11-18)

Not ready to push. Gates 1, 2 and 3 did not pass: there is still no Supabase project. js/auth-config.js is the stand-in (check-auth config fails on purpose), and the RLS test and live sign-in could not run without the project and test credentials. AUTH-05 and AUTH-06 are not verified.

TESTED_SHA: d34f18a7928831e2cd377b47f963f25923112f9b
GATE-1 FAILED ALL GUARDS (13 of 14; check-auth config fails on the stand-in js/auth-config.js) d34f18a7928831e2cd377b47f963f25923112f9b
GATE-2 NOT RUN RLS (no Supabase project or test credentials) d34f18a7928831e2cd377b47f963f25923112f9b
GATE-3 NOT RUN LIVE SIGN-IN (no Supabase project or test credentials) d34f18a7928831e2cd377b47f963f25923112f9b
GATE-4 PASS HISTORY CLEAN d34f18a7928831e2cd377b47f963f25923112f9b
GATE-5 PASS NO UNCOMMITTED CODE d34f18a7928831e2cd377b47f963f25923112f9b
RLS-RUN | 2026-11-18 | d87a64dd64acceddbfee99dfa8a68239d64f468f | FAILED

## 07-04 live setup and first live run (2026-11-18)

The project was configured through the Supabase Management API with a personal access token the user supplied (the user chose this over the console steps). The token was kept in a session temp file outside the repo and never committed.

- A5 labels: n/a (set by API). Values confirmed by reading them back: disable_signup true, password_min_length 10, mailer_autoconfirm false (confirm email on), mailer_otp_exp 86400, site_url https://tester-five-sage.vercel.app, uri_allow_list https://tester-five-sage.vercel.app/**.
- Email templates: NOT APPLIED. The API refused with `entitlement_required`: free projects on the default email provider cannot change templates without custom SMTP. The default templates use ConfirmationURL, not the token_hash links set-password.html expects, so invite and reset emails do not reach the set-password flow yet.
- SQL verification: client_dashboards relrowsecurity = true; one policy "clients read own dashboard", cmd SELECT, roles {authenticated}; grants are authenticated SELECT only, with nothing for anon or public.
- Test accounts: two accounts created by the admin API with random 24-character passwords written straight to .env.local (0600, git-ignored). The values were never displayed. Seed: Sample Alex / Sample Starter Plan and Sample Blake / Sample Growth Plan.
- A6 (invite with sign-up off): not yet checked.

Live RLS run: every data-protection case passed (R1 to R9 and S1: own row only, no cross-read, signed-out and forged-token reads 401, every write 401 or 403, rows unchanged, sign-up refused 422). P1 wrong password: 400 invalid_credentials (A4). P3 invalid token_hash: 403 otp_expired (A8).

**P2 FAILED (A3 is false here).** /auth/v1/recover returns 400 `email_address_invalid` for the existing test account (the default email provider rejects @example.com addresses) and 200 for an unknown address. The API therefore shows whether an account exists. The page itself shows the same message either way, but anyone can call the API directly. The likely fix is custom SMTP, which also unlocks the templates. The result was left as it is; the test was not changed, and the decision is with the user.
RLS-RUN | 2026-11-19 | c34a976bbd80a703823d7ab9a4f7ddcc8ff257ae | FAILED
RLS-RUN | 2026-11-19 | c34a976bbd80a703823d7ab9a4f7ddcc8ff257ae | RLS OK

## Custom SMTP, templates, P2 and A6 (2026-11-19)

- Resend domain samwhitlockmarketing.com.de verified (DNS in Cloudflare: CNAME send, CNAME rsend, TXT resend._domainkey, TXT _dmarc; all DNS only). The user entered SMTP in Supabase themselves; read back by API: smtp.resend.com:465, user resend, sender no-reply@samwhitlockmarketing.com.de, password set (never seen by Claude).
- Email templates APPLIED by API: invite and recovery now link to set-password.html?token_hash=...&type=invite|recovery. Read back and checked.
- First re-run: P2 still FAILED (known 500, unknown 200). Resend logs showed 422 validation_error: Resend refuses @example.com recipients. The email itself (template, link, sender) was correct.
- Fix (user approved): the two test accounts moved by the admin API to Resend test-recipient addresses on resend.dev; .env.local updated. The test itself was not changed.
- A6 (invite with sign-up off): admin invite to a throwaway Resend test-recipient address returned 200 with invited_at set; Resend accepted the email (200). The invited user was deleted afterwards.
RLS-RUN | 2026-11-19 | 89eb8bf4e146d69654c6b0c836e16c53f2be897f | RLS OK
