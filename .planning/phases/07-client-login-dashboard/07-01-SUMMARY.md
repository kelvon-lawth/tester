---
phase: 07-client-login-dashboard
plan: 01
subsystem: testing
tags: [guards, secrets-scan, rls, supabase, node]
requires: []
provides:
  - tools/check-auth.js with 15 named groups (secrets, ignore, history green; 12 feature groups red)
  - tools/auth-env.js credential loader (names only)
  - tools/auth-rls-test.js live REST matrix, exits 2 with no credentials
  - tools/assert-phase-branch.sh branch and main-moved guard
  - .gitignore rule for .env*
affects: [07-02, 07-04, 07-05, 07-06, 07-07, 07-08, 07-09]
tech-stack:
  added: []
  patterns: [two-tier secrets scan with self-test, redacting print, exit 2 for "could not run"]
key-files:
  created: [tools/assert-phase-branch.sh, tools/auth-env.js, tools/check-auth.js, tools/auth-rls-test.js]
  modified: [.gitignore]
key-decisions:
  - "Live test exits 2 (not 0) when credentials are missing, so an && chain cannot pass it"
  - "connect-src check allows 'self' plus exactly the Supabase origin, and nothing else"
  - "check-auth.js and its feature groups were written in one file in Task 1, so Task 2 has no separate commit"
requirements-completed: [AUTH-05, AUTH-06, AUTH-07]
duration: 25min
completed: 2026-11-18
---

# Phase 7 Plan 01: Auth guards Summary

Static guard (secrets, ignore, history plus twelve feature groups), credential-safe env loader, and a live RLS and sign-up REST test that exits 2 with LIVE TESTS NOT RUN when it has no credentials.

## Tasks and commits

| Task | Commit | Notes |
|------|--------|-------|
| 1 Branch assert, secrets scan, ignore rule | b6ddbc3 | Also contains every feature group of check-auth.js (Task 2 content) |
| 2 Feature groups, red | b6ddbc3 | Same commit as Task 1, the file was written whole |
| 3 Live RLS test | 9e80150 | |

## Baseline of check-auth.js groups

Green: `secrets`, `ignore`, `history`.
Red (expected, files or features not yet built): `sdk`, `sql`, `config`, `public`, `login-page`, `dashboard-page`, `reset-copy`, `setpass-page`, `nav`, `js`, `csp`, `docs`. A run of those twelve exits 1. No group passes on a missing file.

`node tools/auth-rls-test.js` prints `LIVE TESTS NOT RUN: <names>` and exits 2. `node tools/auth-env.js --check` prints four "missing" lines. P1 to P3 probe observations (A3, A4, A8) are not recorded yet because no credentials exist; 07-04 must record them.

## Deviations from Plan

None in behaviour. Process note: Task 2 shares a commit with Task 1. The no-credentials verification run appended a `NOT RUN` line to 07-LIVE-EVIDENCE.md, which I deleted uncommitted so the file does not exist until a real run.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Files found: tools/assert-phase-branch.sh, tools/auth-env.js, tools/check-auth.js, tools/auth-rls-test.js. Commits b6ddbc3 and 9e80150 exist on phase-07-client-login. main unmoved.
