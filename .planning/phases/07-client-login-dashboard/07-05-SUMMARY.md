---
phase: 07-client-login-dashboard
plan: 05
subsystem: auth
tags: [supabase-js, vanilla-js, login, dashboard]
requires:
  - phase: 07-02
    provides: browser test groups and guards
  - phase: 07-04
    provides: schema and config contract (real project NOT yet created)
provides:
  - vendored supabase-js 2.119.0 (pinned by sha256)
  - Client login header link on Home and Contact
  - login.html, dashboard.html, js/auth-common.js, js/login.js, js/dashboard.js
affects: [07-06, 07-07, 07-08]
tech-stack:
  added: ["@supabase/supabase-js 2.119.0 (vendored UMD, MIT)"]
  patterns: ["IIFE scripts on auth pages only", "textContent-only rendering", "window.AuthApp shared helpers"]
key-files:
  created: [assets/js/vendor/supabase.min.js, assets/js/vendor/SUPABASE-LICENSE.txt, assets/js/vendor/SUPABASE-VERSION.md, login.html, dashboard.html, js/auth-config.js, js/auth-common.js, js/login.js, js/dashboard.js]
  modified: [index.html, contact.html, css/styles.css, tools/build-site.sh, tools/auth-browser-test.js, .planning/phases/07-client-login-dashboard/07-LIVE-EVIDENCE.md]
key-decisions:
  - "auth-config.js is a PLACEHOLDER stand-in (standin.supabase.co); the config guard fails on purpose until 07-04 Task 3"
  - "Page modifier class lives on body (page-auth), because check-auth requires the exact main tag"
requirements-completed: []
duration: ~1h
completed: 2026-11-18
---

# Phase 7 Plan 05: Login page, dashboard and vendored SDK Summary

Sign-in and dashboard code is built and passes every offline test against a stubbed service, but nothing has been proven against a real Supabase project, because none exists yet.

## Outstanding (read this first)

- **Live proof not run.** `node tools/auth-browser-test.js live` exits 2 (no test credentials, no project). Recorded as NOT RUN in 07-LIVE-EVIDENCE.md. AUTH-02 and AUTH-04 stay open. No AUTH requirement was marked complete.
- **`js/auth-config.js` is a PLACEHOLDER** (`https://standin.supabase.co`, `sb_publishable_standin`). It must be replaced with the real values in 07-04 Task 3 before any push. `node tools/check-auth.js config` fails on purpose because of it; the guard was not weakened.
- The "Forgotten your password?" button is present but not wired (07-06 does that).

## Tasks

1. Task 1 (package check): user typed "package ok" on 2026-11-18. Recorded in SUPABASE-VERSION.md.
2. Task 2, commit dff5f98: SDK vendored (sha256 matched the pinned value), licence shipped by the build, third header link, wrapped two-row header below 640px (`--header-h` 92px there, 64px from 640px), login.html and dashboard.html shells, build allowlist.
3. Task 3, commit 28cf070: auth-common.js, login.js, auth-config stand-in, build copies them.
4. Task 4, commit dd96bf9: dashboard.js, build copies it, live evidence recorded as NOT RUN.

## Results

Pass: `check-auth` sdk, public, login-page, dashboard-page, secrets, js (except missing set-password.js); `auth-browser-test` sdk, harness, public, file-login, file-dashboard, stub-login, stub-dashboard; check-home, check-contact, check-contrast, home-browser-test, motion-browser-test, contact-browser-test.

Expected failures: `config` (placeholder, by design); set-password.html missing in `nav`, `js`, check-design-system, check-portability and smoke-test (07-06); check-deploy and csp (07-07).

## Deviations from Plan

**1. [Rule 3 - Blocking] Test edit in tools/auth-browser-test.js.** `withPage` opened every page in the shared default browser context, so the session stored by the stub-login "success" scenario leaked into the next scenario (login redirected to the dashboard, so the form never showed). Each page now gets its own browser context, disposed afterwards. No assertion was changed or loosened; it only isolates storage between scenarios.

**2. [Rule 3] Auth-page class on body, not main.** `check-auth` requires the exact `<main id="main" tabindex="-1">`, so `page-auth` is on `<body>`. CSS overrides the Home `main:not(.page-contact)` section padding for these pages.

**3. Stand-in config** as instructed (see Outstanding).

**4. Info banners** use the card edge colour, not blue, to respect the blue allow-list.

## Known Stubs

- `js/auth-config.js` placeholder values (resolved by 07-04 Task 3).
- `#reset-view` empty and "Forgotten your password?" not wired (07-06).

## Threat Flags

None beyond the plan's threat model. The SDK is vendored, hash-pinned and absent from Home and Contact (checked by `public`).

## Self-Check: PASSED

Files and commits dff5f98, 28cf070, dd96bf9 exist.
