---
phase: 02-shared-shell-static-home
plan: 02
subsystem: ui
tags: [html, css, hero, cdp, headless-chrome]
requires:
  - phase: 02-shared-shell-static-home
    provides: shell, check-home.js, base CSS
provides:
  - Split hero (h1, lede, Let's talk button, See how I help link, trust cue, photo)
  - Descender-safe hand-drawn underline with non-scaling stroke
  - tools/home-browser-test.js CDP test (groups hero, nojs, sticky, layout)
affects: [02-03, 02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: [zero-dependency CDP test using Node 24 WebSocket, Emulation.setDeviceMetricsOverride for 320px]
key-files:
  created: [tools/home-browser-test.js]
  modified: [index.html, css/styles.css, REPLACE-ME.md]
key-decisions:
  - "Hero photo is Unsplash photo-1556740738-b6a63e27c4df (woman at a shop counter), chosen to match the mandated 'at the counter' alt text"
requirements-completed: [HOME-01, SHL-03, HOME-08]
duration: 20min
completed: 2026-10-12
---

# Phase 2 Plan 02: Hero Summary

**Split hero with first-person lede, blue Let's talk button, trust cue and hotlinked photo, a descender-safe coral underline, and a reusable headless-Chrome CDP layout test.**

## Tasks

1. Task 1 (RED): tools/home-browser-test.js - commit 8ffbbd8
2. Task 2 (GREEN): hero markup, CSS, photo, REPLACE-ME - commit 2aa0dd8

## Verification

- `home-browser-test.js hero nojs`: PASS (320/768/1280 no overflow, stacked and side-by-side order, "restaurant" on one line at 1024/1280, underline clears descenders for bakery/gym/shop at 40px and 72px, stroke 4)
- check-home shell hero, check-design-system, check-portability, check-contrast, font-metrics-test, smoke-test: all pass
- sticky and layout groups fail by design until Plans 03-05

## Deviations from Plan

None in behaviour. Notes:
- Hero photo is q=55 (about 114KB), above the 90KB aim; Unsplash resizing params cannot go much lower without visible artefacts. Candidate URL verified 200 image/jpeg and viewed.
- The photo does not look at camera and shows a shop, not a café; the alt text mandated by check-home is a placeholder and REPLACE-ME.md says to replace photo and alt together. Photographer name not confirmed (Unsplash page lookup returned not found).

## Known Stubs

None new. #services link target is created in Plan 03.

## Self-Check: PASSED
