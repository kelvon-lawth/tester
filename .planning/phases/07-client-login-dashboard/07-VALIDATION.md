---
phase: 7
slug: client-login-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-11-06
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from the Validation Architecture section of 07-RESEARCH.md and the plan set. Commands assume the repo root. All tasks also run `sh tools/assert-phase-branch.sh`, which is omitted below for readability.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Zero-dependency Node scripts under `tools/` (existing convention), with headless Chrome over raw CDP |
| **Config file** | none |
| **Quick run command** | `node tools/check-auth.js && node tools/check-deploy.js` |
| **Full suite command** | `sh tools/run-guards.sh`, then `node tools/auth-rls-test.js`, then `node tools/auth-browser-test.js live` |
| **Estimated runtime** | Quick ~15 seconds. Full ~10 minutes (estimate, not yet timed; start `run-guards.sh` with run_in_background) |

**Exit codes for live tests:** 0 means ran and passed, 1 means failed, 2 means could not run (`LIVE TESTS NOT RUN`). Exit 2 is never a pass.

**Stubbed versus live:** stub groups intercept `*.supabase.co` and prove page behaviour only. Stub results never count toward AUTH-05. AUTH-05 comes only from `tools/auth-rls-test.js` against the real project.

---

## Sampling Rate

- **After every task commit:** Run the task's `<automated>` command, and `node tools/check-auth.js secrets ignore`. Until 07-07 the full quick command is expected to show the reds listed in the ledger in 07-02-PLAN.md.
- **After every plan wave:** Run the groups the ledger says should now be green, plus all guards previously green. From wave 6, run the full suite.
- **Before `/gsd:verify-work`:** Full suite must be green, including live, on the deployed address (07-08), followed by the human security check (07-09).
- **Max feedback latency:** 60 seconds for task-level checks, apart from `run-guards.sh` and the deployment poll (up to 5 minutes).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | AUTH-05, AUTH-07 | T-07-01, 02, 04, 07a | Secrets and JWT shapes fail the scan; `.env*` ignored; work on phase branch | static | `node tools/check-auth.js secrets ignore history` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | AUTH-01, 04, 05, 07 | T-07-01 | Feature groups fail before the feature exists | static (expected red) | `node tools/check-auth.js sdk sql config public login-page dashboard-page reset-copy setpass-page nav js csp docs` exits 1 | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | AUTH-05, AUTH-06 | T-07-03, 05, 06 | Cannot pass without running; output redacted | live REST (expected not run) | `node tools/auth-rls-test.js` exits 2 | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | AUTH-07 | T-07-10, 11 | Real headers applied; violations fail; no auth code on public pages | browser (expected red) | `node tools/auth-browser-test.js sdk public file-login file-dashboard file-setpass` exits 1 | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | AUTH-02, 03, 04 | T-07-09, 12a | Stub groups are UI only; deployed scan uses the hash-pinned SDK exemption | browser (expected red) | `node tools/auth-browser-test.js stub-login stub-dashboard stub-reset stub-setpass stub-change csp` exits 1 | ❌ W0 | ⬜ pending |
| 07-02-03 | 02 | 2 | AUTH-01, AUTH-07 | T-07-08, 12 | Guards extended, none loosened; SDK exemption hash-pinned | static (expected red) | `node tools/check-contrast.js && node tools/check-home.js && node tools/check-contact.js` | ✅ | ⬜ pending |
| 07-04-01 | 04 | 3 | AUTH-05, AUTH-06 | T-07-19 | No user_metadata; select-only grant; only fictional addresses | static | `node tools/check-auth.js sql secrets` | ❌ W0 | ⬜ pending |
| 07-04-02 | 04 | 3 | AUTH-05, AUTH-06 | T-07-18, 20, 21 | Sign-up off; only public values in chat | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-04-03 | 04 | 3 | AUTH-05, AUTH-06 | T-07-15, 16, 17, 18 | A and B read only their own row; signed-out gets none; writes refused; sign-up refused | live REST | `node tools/check-auth.js config secrets && node tools/auth-rls-test.js` | ❌ W0 | ⬜ pending |
| 07-05-01 | 05 | 4 | AUTH-02 | T-07-SC | Package confirmed by a person before vendoring | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-05-02 | 05 | 4 | AUTH-01, AUTH-07 | T-07-SC, 13, 14, 29 | SDK pinned; no auth code on Home or Contact | static + browser | `node tools/check-auth.js sdk public secrets && node tools/auth-browser-test.js sdk && node tools/home-browser-test.js && node tools/motion-browser-test.js` | ❌ W0 | ⬜ pending |
| 07-05-03 | 05 | 4 | AUTH-02, AUTH-07 | T-07-25, 26 | One message for credential failures; no SDK call on file:// | stubbed browser | `node tools/check-auth.js login-page && node tools/auth-browser-test.js stub-login file-login` | ❌ W0 | ⬜ pending |
| 07-05-04 | 05 | 4 | AUTH-02, AUTH-04 | T-07-23, 27, 28 | Row text rendered as text; gate hides content; no data in the static file | stubbed + live browser | `node tools/check-auth.js dashboard-page public secrets && node tools/auth-browser-test.js stub-dashboard file-dashboard public && node tools/auth-browser-test.js live` | ❌ W0 | ⬜ pending |
| 07-06-01 | 06 | 5 | AUTH-03 | T-07-32, 35 | Same result for known and unknown addresses; honest about email limits | stubbed browser | `node tools/check-auth.js login-page reset-copy && node tools/auth-browser-test.js stub-reset stub-login` | ❌ W0 | ⬜ pending |
| 07-06-02 | 06 | 5 | AUTH-03 | T-07-30, 31, 33, 36 | Token stripped at once; verify only on click; type allow-listed | stubbed browser | `node tools/check-auth.js setpass-page dashboard-page nav js secrets && node tools/auth-browser-test.js stub-setpass stub-change stub-dashboard file-setpass` | ❌ W0 | ⬜ pending |
| 07-06-03 | 06 | 5 | AUTH-01 | — | Page-list guards green with no guard edited | static + browser | `node tools/smoke-test.js && node tools/check-portability.js && node tools/check-design-system.js && node tools/qa-browser-test.js` | ✅ | ⬜ pending |
| 07-07-01 | 07 | 6 | AUTH-07 | T-07-37, 38, 39, 40 | Strict CSP with hash; no unsafe keywords; hero, fonts, forms unbroken | static + browser | `node tools/check-auth.js csp secrets && node tools/check-deploy.js && node tools/auth-browser-test.js csp public stub-login stub-dashboard stub-setpass` | ❌ W0 | ⬜ pending |
| 07-07-02 | 07 | 6 | AUTH-03, AUTH-06 | T-07-41, 42, 43 | Guide says what never to share; guide not deployed | static | `node tools/check-auth.js secrets && node tools/check-home.js replace && node tools/check-contact.js` | ✅ | ⬜ pending |
| 07-07-03 | 07 | 6 | — (D-13) | — | User sees the CLAUDE.md diff first | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-07-04 | 07 | 6 | AUTH-05, AUTH-06, AUTH-07 | T-07-44 | All five gate items checked individually against a recorded commit | full suite + live | Five gate checks in the task's verify | ❌ W0 | ⬜ pending |
| 07-08-01 | 08 | 7 | — | T-07-44, 45 | No branch push without user approval, default hold | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-08-02 | 08 | 7 | — | T-07-44 | Live site unchanged by the branch push | git + HTTP | `git ls-remote origin refs/heads/phase-07-client-login` | n/a | ⬜ pending |
| 07-08-03 | 08 | 7 | AUTH-07 | T-07-46 | Preview looked at for faults and console CSP errors | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-08-04 | 08 | 7 | AUTH-05, AUTH-07 | T-07-46, 48 | Fresh full run at the tip; code matches what was tested | full suite + live | `sh tools/run-guards.sh`, `node tools/auth-rls-test.js`, `node tools/auth-browser-test.js live` | ❌ W0 | ⬜ pending |
| 07-08-05 | 08 | 7 | — | T-07-44, 48a | No main push without user approval, default hold | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-08-06 | 08 | 7 | AUTH-01, 02, 04, 05, 07 | T-07-46, 47, 48 | Real headers hold under scroll and resize; dev files 404; shipped files clean; RLS holds | deployed browser + live REST | `BASE_URL=https://tester-five-sage.vercel.app EXPECT_SHA="$(git rev-parse main)" node tools/auth-browser-test.js deployed csp`, then `live`, then `node tools/auth-rls-test.js` | ❌ W0 | ⬜ pending |
| 07-09-01 | 09 | 8 | AUTH-03, AUTH-06 | T-07-51, 52 | Real inbox, guide walkthrough, security sign-off | manual checkpoint | see Manual-Only | n/a | ⬜ pending |
| 07-09-02 | 09 | 8 | All AUTH | T-07-49, 50 | AUTH-05 tick needs the latest entry to be the literal `RLS OK` line with date and SHA | static | `node tools/check-auth.js secrets docs`, plus the tick check in the task's verify | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Waves 1 and 2 of this phase (07-01, 07-02) are the Wave 0 work.

- [ ] `tools/assert-phase-branch.sh` — fails if the primary checkout leaves the phase branch or main moves
- [ ] `tools/auth-env.js` — in-process credential loader that prints names only
- [ ] `tools/check-auth.js` — static guard: secrets, ignore, sdk, sql, config, public, page groups, reset-copy, nav, js, csp, docs, history
- [ ] `tools/auth-rls-test.js` — live REST matrix for AUTH-05 and AUTH-06
- [ ] `tools/auth-browser-test.js` — sdk, public, file-*, stub-*, csp, live, deployed and rollback groups
- [ ] `tools/run-guards.sh` — every offline guard with a summary
- [ ] Updates to `tools/check-deploy.js`, `check-design-system.js`, `check-portability.js`, `smoke-test.js`, `qa-browser-test.js`, and `.gitignore` (`.env*`)
- [ ] Framework install: none

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Project created and configured; invite accepted with sign-up off (A6); setting labels (A5) | AUTH-05, AUTH-06 | Console only, and only the user holds the account | 07-04 Task 2 |
| Package is the official client | AUTH-02 | Audit tool unavailable, so the legitimacy gate needs a person | 07-05 Task 1 |
| CLAUDE.md wording | D-13 | The user approves the exact diff | 07-07 Task 3 |
| Branch push and main push approvals | Phase gate | Only the user can authorise publishing | 07-08 Tasks 1 and 5 |
| Preview checked for visual faults and console CSP errors | AUTH-07 | Preview addresses may be login-protected. Automated checks run too if reachable | 07-08 Task 3 |
| Instant Rollback, only if needed | Phase gate | Dashboard action by the user; followed by the automated `rollback` check | 07-08 context |
| Real invite and reset delivery; expired link | AUTH-03 | External email, limited to team-member addresses (D-12) | 07-09 Task 1, parts A and B |
| Guide walkthrough with a temporary password | AUTH-06 | Tests whether a person can follow the document | 07-09 Task 1, part C |
| Look and feel on a real phone | AUTH-01, AUTH-07 | Judgement call on real hardware | 07-09 Task 1, part D |
| Human security check | D-11 | Sign-off is a human decision | 07-09 Task 1, part E |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (checkpoints are verified by the automated task after them, or listed above)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [ ] Feedback latency < 60s (not met by `run-guards.sh` or the deployment poll, which are run at gates only; the actual runtime is not yet measured)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
