---
phase: 07-client-login-dashboard
plan: 06
subsystem: auth
tags: [supabase-js, password-reset, invite, vanilla-js]
requires:
  - phase: 07-05
    provides: login page, dashboard, shared auth helpers
provides:
  - forgotten-password request view on login.html (also opens from login.html#reset)
  - set-password.html and js/set-password.js (invite, reset, change-password routes)
  - "Change your password" link on the dashboard
  - set-password page in the build allowlist
affects: [07-07, 07-08, 07-09]
tech-stack:
  added: []
  patterns: ["token stripped with replaceState before any await", "link used only on Continue click", "single h1 whose text changes per state"]
key-files:
  created: [set-password.html, js/set-password.js]
  modified: [login.html, js/login.js, dashboard.html, css/styles.css, tools/build-site.sh, tools/auth-browser-test.js, .planning/phases/07-client-login-dashboard/07-LIVE-EVIDENCE.md]
key-decisions:
  - "Reset shows the identical Check your inbox block for any non-429, non-network outcome; a dropped connection shows the service banner instead"
  - "Verify errors count as expired unless they are network or 5xx faults, decided from HTTP status and error type, not code names"
requirements-completed: []
duration: ~1h
completed: 2026-11-18
---

# Phase 7 Plan 06: Password routes Summary

Forgotten-password request, invite/reset link page and change-password route are built and pass every offline test against a stubbed service; none of it has run against a real Supabase project, because none exists yet.

## Outstanding (read this first)

- **Live project still missing.** 07-04 Task 2 is paused ("not yet"). `js/auth-config.js` is still the PLACEHOLDER stand-in, so `node tools/check-auth.js config` fails on purpose. Nothing may be pushed until 07-04 Task 3 replaces it and the RLS line is recorded.
- `node tools/auth-browser-test.js live` exits as NOT RUN (no credentials). Recorded in 07-LIVE-EVIDENCE.md. No AUTH requirement was marked complete (AUTH-01 and AUTH-03 stay open until proven live).
- Not observed against the real service: what the recover endpoint returns for an unknown address (research A3; the page is identical for any non-rate, non-network answer, so it is covered either way), the real invite and reset email link format, and real email delivery (07-09, with a team member's address).
- Screenshots at 320/375/768/1280 were not taken. Overflow (all five pages, five states each), tap-target and shell checks pass, but the visual check against the UI spec is left for the 07-09 human check. Visual doubts to look at: the "Change your password" text link sitting under the Sign out button (right-aligned from 640px), and the reset card on the tint band.

## Tasks

1. Task 1, commit 198f076: reset view inside login.html (copy kept in the file for the `reset-copy` guard), `resetPasswordForEmail` with no redirect option, 60 second resend countdown announced only at start and end, 429 copy, network failure banner, `#reset` entry, Back to sign in resets the Show password toggle.
2. Task 2, commit 97d9c2b: set-password.html and js/set-password.js, build allowlist, dashboard link.
3. Task 3: no code change needed, all page-list guards pass.

## Results

Pass: check-auth setpass-page, login-page, reset-copy, dashboard-page, nav, js, public, secrets; auth-browser-test stub-reset, stub-login, stub-setpass, stub-change, stub-dashboard, file-setpass; smoke-test, check-portability, check-design-system; qa-browser-test overflow, tap, keyboard, shell, weight, hosting, styleguide; check-home, check-contact, check-contrast.

Red as expected: `config` (placeholder, by design), `csp` (vercel.json headers, 07-07), `docs` (CLAUDE.md, REPLACE-ME.md, CLIENT-GUIDE.md, 07-07). `live`: NOT RUN.

## Deviations from Plan

**1. [Rule 1 - wrong test assertion] tools/auth-browser-test.js, `stub-setpass`.** The "no request URL contains the token" check also counted the first document request, which is the email link itself and carries the token by definition, so it failed on a correct page. The check now skips only the GET of `set-password.html?...`; every other request URL and all console output are still checked for both the token and the password. Security assertion not loosened (the page strips the token and the test still proves no other request carries it). Committed with Task 2.

**2. [Rule 3] qa-browser-test.js times out as one run.** The whole-script 280s limit is hit when all seven groups run in one process (after the first two groups, on five pages). Each group passes when run on its own. No guard or timeout was edited. 07-09 or later may want to run groups separately.

**3. Single h1 per page.** The reset heading and the set-password states reuse the one h1 and change its text (the guards require exactly one h1).

## Known Stubs

- `js/auth-config.js` placeholder values (resolved by 07-04 Task 3).

## Threat Flags

None beyond the plan's threat model.

## Self-Check: PASSED

set-password.html, js/set-password.js, commits 198f076 and 97d9c2b exist.
