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
