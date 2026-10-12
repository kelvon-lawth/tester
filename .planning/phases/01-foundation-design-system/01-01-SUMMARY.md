---
phase: 01-foundation-design-system
plan: 01
subsystem: foundation
tags: [html, css, design-tokens, fonts, file-protocol, testing]
requires: []
provides:
  - "css/styles.css with all UI-SPEC tokens, @font-face (real + fallback), base, stub shell, hero underline"
  - "js/main.js no-js to js swap and fonts-loaded/fonts-failed class"
  - "index.html and contact.html stubs with SHELL markers"
  - "tools/check-portability.js and tools/smoke-test.js"
affects: [01-02, 01-03, phase-2, phase-3, phase-4]
tech-stack:
  added: [Fraunces 5.3.0 (static 600), Figtree 5.3.0 (400, 600)]
  patterns: [tokens-first CSS, classic deferred scripts, relative paths only, zero-dependency Node tooling]
key-files:
  created:
    - tools/check-portability.js
    - tools/smoke-test.js
    - index.html
    - contact.html
    - css/styles.css
    - js/main.js
    - assets/fonts/Fraunces-SemiBold.woff2
    - assets/fonts/Figtree-Regular.woff2
    - assets/fonts/Figtree-SemiBold.woff2
    - assets/fonts/OFL-Fraunces.txt
    - assets/fonts/OFL-Figtree.txt
    - assets/fonts/SOURCES.md
  modified: []
key-decisions:
  - "Static Fraunces SemiBold (18KB) used instead of variable file to stay in the 120KB font budget; total fonts 41KB"
  - "smoke-test uses spawn and kills Chrome after </html> because headless Chrome here does not exit after --dump-dom"
duration: ~15min
completed: 2026-10-12
---

# Phase 1 Plan 01: Walking Skeleton Summary

Branded two-page static skeleton that opens over file:// with all UI-SPEC design tokens, self-hosted Fraunces/Figtree fonts, a blue hero word with coral hand-drawn underline, and headless-Chrome plus static-scan tests proving it.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Failing portability and smoke tests (RED) | 2253dfe |
| 2 | Tokens, fonts, stub pages, deferred JS (GREEN) | b73a412 |

## Verification

- `node tools/check-portability.js` prints PORTABILITY OK
- `node tools/smoke-test.js index.html contact.html` prints PASS for both with classes `js fonts-loaded`
- Fonts total 41,024 bytes, all start with wOF2; OFL texts present; footer markup identical across pages

## Deviations from Plan

**1. [Rule 1 - Bug] smoke-test hung with execFileSync**
- **Found during:** Task 2 verification
- **Issue:** Chrome printed the DOM but never exited, so execFileSync hit its 30s timeout and both pages failed.
- **Fix:** Switched to `spawn` (still array args, no shell, fresh profile, 30s timeout) and kill Chrome once the closing `</html>` is received. Plan acceptance greps for `execFileSync` in smoke-test.js therefore no longer match (count 0, plan asked at least 1); security intent (no shell string) preserved.
- **Files modified:** tools/smoke-test.js
- **Commit:** b73a412

**2. [Rule 1 - Bug] Header comment in js/main.js matched forbidden-pattern grep**
- **Issue:** Comment text contained "import" and "fetch(", tripping the acceptance grep. Reworded the comment.
- **Commit:** b73a412

## Known Stubs

- index.html h1 shows static "bakery" (Phase 3 adds cycling); contact.html h1 "Let's talk" is a placeholder (Phase 4). Both intentional per plan.
- Fallback font metrics are starting values; Plan 03 tunes them.

## Threat Flags

None.

## Self-Check: PASSED

All created files exist; commits 2253dfe and b73a412 present.
