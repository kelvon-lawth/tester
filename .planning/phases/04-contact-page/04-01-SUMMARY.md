---
phase: 04-contact-page
plan: 01
subsystem: contact
tags: [svg, map, a11y, guards, requirements]
requires: [02 shared shell, quick 261013-eil contact form]
provides: [CON-07 area-served inline-SVG map, D-01 descope recorded]
affects: [contact.html, css/styles.css, js/main.js, REPLACE-ME.md, REQUIREMENTS.md, ROADMAP.md]
key-files:
  created: []
  modified: [contact.html, css/styles.css, js/main.js, tools/check-contact.js, tools/contact-browser-test.js, tools/motion-browser-test.js, REPLACE-ME.md, .planning/REQUIREMENTS.md, .planning/ROADMAP.md]
decisions:
  - Roads reuse the existing draw IIFE (selector list); dashed rings are never given .draw and fade/scale in with the details card instead
metrics:
  completed: 2026-10-22
  tasks: 3
---

# Phase 4 Plan 01: Contact area-served map Summary

Stylised hand-feel inline-SVG map (Elmhollow, Fenwick Cross, Thornby, roads, river, dashed coral radius rings) in the contact details aside, guarded by static and browser assertions written first, with CON-02/CON-03 recorded as descoped (D-01).

## Commits
- 09f171c test(04-01): failing CON-07 guards (check-contact map group, browser map group, motion selector additions)
- ab2adb3 feat(04-01): map markup, token-only CSS, road draw-in via existing IIFE
- docs(04-01): REPLACE-ME area-map row, REQUIREMENTS (CON-01 amended, CON-02/03 Descoped, CON-04..07 complete), ROADMAP SC1

## Verification
All 10 guards pass. Map labels are readable (>=11px) and inside the svg at 320/375/1280 and no-JS 320, with no overflow.

## Deviations from Plan
None. Note: one home-browser-test run hit its 600s internal timeout when run in the long sequential loop; a standalone re-run passed in about 73s (transient, unrelated to the change).

## Known Stubs
None (placeholder place names are intentional and listed in REPLACE-ME.md).

## Self-Check: PASSED
