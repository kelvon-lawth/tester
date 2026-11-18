---
phase: 07-client-login-dashboard
plan: 02
subsystem: testing
tags: [cdp, browser-test, guards, csp, supabase-stub]
requires: [07-01]
provides:
  - tools/auth-browser-test.js with groups harness, sdk, public, file-login, file-dashboard, file-setpass, stub-login, stub-dashboard, stub-reset, stub-setpass, stub-change, csp, live, deployed, rollback
  - tools/run-guards.sh (14 offline guards, one summary)
  - check-deploy, check-design-system, check-portability, smoke-test, qa-browser-test extended to five pages
affects: [07-04, 07-05, 07-06, 07-07, 07-08, 07-09]
tech-stack:
  added: []
  patterns: [CDP Fetch stubbing of *.supabase.co, local server applying vercel.json headers, exit 2 for "could not run"]
key-files:
  created: [tools/auth-browser-test.js, tools/run-guards.sh]
  modified: [tools/check-deploy.js, tools/check-design-system.js, tools/check-portability.js, tools/smoke-test.js, tools/qa-browser-test.js]
key-decisions:
  - "Extra `harness` group (passes now) proves the stubbing, body recording, dropped connections and header serving work before any page exists"
  - "qa-browser-test keeps PAGES (two pages) for the keyboard group and adds PAGES5 for overflow, tap, shell and hosting"
  - "Browser test exits 2 for missing credentials, missing BASE_URL and protected addresses so an && chain cannot treat them as a pass"
  - "Hero 'text changes' is measured on the visible word (opacity and mask), because .hero-word__text alone stays 'bakery' while alternates cycle"
requirements-completed: []
duration: 55min
completed: 2026-11-18
---

# Phase 7 Plan 02: Browser test and guard extension Summary

A CDP browser test that defines every browser-testable AUTH behaviour before the pages exist, and the existing guards widened to five pages without removing any assertion.

## Tasks and commits

| Task | Commit | Notes |
|------|--------|-------|
| 1 Harness, public, sdk, file groups | 909e99b | Tasks 1 and 2 are one file written whole, so they share a commit (as in 07-01) |
| 2 Stub, csp, live, deployed, rollback groups | 909e99b | |
| 3 Guard extensions and run-guards.sh | bd0aa0a | No deletions in either commit |

## State now (red ledger check)

`node tools/auth-browser-test.js` exits 1, every group fails with a named reason (missing SDK, `/login.html answered 404`, no Client login link, vercel.json has no headers array). `harness` passes. No Chrome process or `_site/` is left behind. `deployed` without BASE_URL exits 2, `live` without credentials prints `LIVE TESTS NOT RUN` and exits 2. `check-auth.js secrets` still passes.

Still green, untouched: check-contrast, check-home, check-contact, font-metrics-test (contact, home and motion browser tests not changed).

Red, matching the ledger: check-deploy (missing pages, auth scripts, SDK, license, vercel.json headers, styleguide link and prototype note on new pages), check-portability (three required pages missing), check-design-system (shell parity needs the three pages), smoke-test and qa-browser-test overflow, tap, shell, hosting (pages missing; keyboard, weight, styleguide unchanged).

Checks made on the guard edits: a fake `supabase.min.js` with the wrong hash still trips both the `fetch(` and `XMLHttpRequest` rules (no exemption without the pinned sha256). The exemption itself and the public-page no-reference check cannot go green until 07-05 vendors the SDK.

## Deviations from Plan

**1. [Rule 2 - Missing critical] Added a `harness` self-check group.** The stub groups cannot be exercised until the pages exist, so a passing group now proves the stubbing mechanics (Fetch interception, request recording, 429 and dropped connections, vercel.json header serving). Not in the plan's group list; additive.

**2. [Rule 1 - Bug] Hero activity and image checks.** First run showed `.hero-word__text` never changes (alternates cycle) and below-the-fold images are lazy. The test now watches the visible word and scrolls before checking `naturalWidth`.

Nothing else. No existing assertion removed or loosened (diff reviewed: only list literals grew, plus added checks).

## Notes for later plans

- The stub groups (`stub-*`, `csp` for the new pages, `live`) have been run only against missing pages. They encode the UI spec and 07-05 contract (`#login-form`, `#reset-form`, `#password-form`, `#auth-status`, `.dash`, `.dash__sample`, `window.AuthApp.flash`, text-matched buttons). Expect to correct test mistakes, not only code, when 07-05 and 07-06 first run them; fix a test only where the spec, not the page, is wrong.
- Stubs assume supabase-js `maybeSingle` on GET gets an array back and `verifyOtp` posts `{token_hash,type}` to `/auth/v1/verify`; the stub also handles the `vnd.pgrst.object` Accept form.
- `public` runs the first-view budget (3 seconds, no scroll), the same measure as qa `weight`.
- Run `sh tools/run-guards.sh` with run_in_background.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Files found: tools/auth-browser-test.js, tools/run-guards.sh. Commits 909e99b and bd0aa0a exist on phase-07-client-login.
