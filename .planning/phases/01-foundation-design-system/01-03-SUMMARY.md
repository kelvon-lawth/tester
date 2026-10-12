---
phase: 01-foundation-design-system
plan: 03
subsystem: fonts
tags: [fonts, font-face, size-adjust, cls, testing]
requires: [01-01, 01-02]
provides:
  - "tools/font-metrics.html + font-metrics.js: headless harness measuring fallback vs webfont width/line count"
  - "tools/font-metrics-test.js: threshold test (width delta <= 2%, body line counts equal, 320px fit)"
  - "Tuned Fraunces Fallback and Figtree Fallback @font-face metric overrides in css/styles.css"
affects: [phase-2, phase-3, phase-4]
tech-stack:
  added: []
  patterns: [size-adjust/ascent-override/descent-override fallback faces, headless Chrome measurement via spawn]
key-files:
  created:
    - tools/font-metrics.html
    - tools/font-metrics.js
    - tools/font-metrics-test.js
  modified:
    - css/styles.css
    - tools/smoke-test.js
    - .planning/phases/01-foundation-design-system/01-SKELETON.md
    - REPLACE-ME.md
key-decisions:
  - "Fraunces fallback uses local(\"Georgia Bold\") at weight 600, not plain Georgia"
  - "Harness simulates 320px with a 320px box and the real --fs-display clamp evaluated at 320px"
  - "Test runners use spawn with an args array (no shell), no --allow-file-access-from-files, no innerHTML"
requirements-completed: [FND-04]
duration: ~35min
completed: 2026-10-12
---

# Phase 1 Plan 03: Font Fallback Metrics Summary

Metric-tuned fallback faces (Georgia Bold for Fraunces, Arial for Figtree) so the font swap causes no visible layout jump, proven by a headless measurement harness and threshold test. Human check: approved.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Font-metrics harness and threshold test (RED) | 7959555 |
| 2 | Tune fallback metrics (GREEN) | 439d046 |
| 3 | Human sign-off (checkpoint) | approved, no commit |
| - | REPLACE-ME tools/ removal note | 2875299 |

## Measured results

- Width delta: display -0.06%, heading 0.22%, body -0.42%
- Body line counts equal (5/5)
- At 320px: "restaurant" 205.9px in 288px box, single line; --fs-display 40px at 320, 72px at 1440
- Final fallbacks: Fraunces Fallback local("Georgia Bold") size-adjust 93.7%, ascent 104.5%, descent 27.7%; Figtree Fallback Arial size-adjust 99.6%, ascent 95.4%, descent 25.1%; line-gap 0%

## Verification

All guards re-run and passing: check-portability, check-contrast, check-design-system, font-metrics-test (FONT METRICS OK), smoke-test (index, contact, styleguide).

## Deviations from Plan

**1. [Rule 1 - Bug] Fraunces fallback synthetic bold**
- local("Georgia") without a weight descriptor produced synthetic-bold regular Georgia (~15% off). Fixed with font-weight 600 and local("Georgia Bold"), then Georgia-Bold, Georgia.
- Commit: 439d046

**2. [Rule 3 - Blocking] Headless Chrome minimum window ~500px**
- Harness uses a 320px-wide box with the real --fs-display clamp evaluated at 320px; real 320px fit confirmed by the human check.

**3. [Rule 3 - Blocking] ENOTEMPTY on temp-profile cleanup**
- Cleanup made best-effort with retries in smoke-test.js and font-metrics-test.js.

**4. Runner hardening**
- Test runner uses spawn (args array, no shell) instead of execFileSync; no --allow-file-access-from-files; no innerHTML.

## Known Stubs

None. tools/ is intentionally dev-only; removal listed in REPLACE-ME.md for Phase 5 (threat T-01-10).

## Threat Flags

None.

## Self-Check: PASSED

Commits 7959555, 439d046 and 2875299 present; created files exist.
