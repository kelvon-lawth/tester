---
phase: 02-shared-shell-static-home
plan: 01
subsystem: ui
tags: [html, css, shell, guards, node]
requires:
  - phase: 01-foundation-design-system
    provides: tokens, base CSS, Phase 1 guards, stub pages
provides:
  - Finished header (text wordmark, Home/Contact nav) and navy footer, identical on index.html and contact.html
  - tools/check-home.js end-to-end Home contract test (11 groups)
  - Guards for SHELL parity, squiggle budget, blue allow-list, U+2019 apostrophes
  - Base CSS fixes (margin reset, no main padding, skip-link and footer hover)
  - Grouped REPLACE-ME.md swap checklist
affects: [02-02, 02-03, 02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: [zero-dependency node guards, byte-identical shell blocks between SHELL markers]
key-files:
  created: [tools/check-home.js]
  modified: [tools/check-design-system.js, tools/check-contrast.js, index.html, contact.html, css/styles.css, REPLACE-ME.md]
key-decisions:
  - "Footer base font-size is Body (18px) per UI-SPEC; fine print uses Label"
  - "Blue allow-list matched the existing Phase 1 selectors with no additions needed"
requirements-completed: [SHL-01, SHL-02, HOME-08]
duration: 15min
completed: 2026-10-12
---

# Phase 2 Plan 01: Shared Shell Summary

**Finished header and navy footer identical on both pages, a failing-by-design 11-group Home contract test (tools/check-home.js), extended design-system and contrast guards, and a grouped REPLACE-ME checklist.**

## Tasks

1. Task 1 (RED): check-home.js plus guard extensions - commit 9b50b4f
2. Task 2 (GREEN for shell): header/footer on both pages, base CSS, REPLACE-ME - commit 7a61ef9

## Verification

- check-home shell: PASS; other groups still fail by design (later plans)
- check-design-system, check-contrast (incl. blue/tint, blue/white, white/navy non-text rows), check-portability, font-metrics-test, smoke-test: all pass

## Deviations from Plan

None - plan executed as written. The sticky-clearance footer padding is applied with a `max-width: 639px` media query (equivalent to "below 640px").

## Known Stubs

index.html main still holds only the Phase 1 h1 and REPLACE-ME Testimonials/Logos sections say "Filled in by Plan 04"; both are intentional and resolved by Plans 02-04.

## Self-Check: PASSED
