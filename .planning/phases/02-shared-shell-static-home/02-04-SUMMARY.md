---
phase: 02-shared-shell-static-home
plan: 04
subsystem: ui
tags: [html, css, testimonials, inline-svg, logos]
requires:
  - phase: 02-shared-shell-static-home
    provides: services, about, check-home.js, base CSS
provides:
  - Testimonials section (#kind-words, 3 white cards, real hotlinked headshots)
  - Logo strip (6 inline-SVG monochrome wordmarks)
affects: [02-05, 02-06]
tech-stack:
  added: []
  patterns: [inline SVG wordmarks via currentColor, hotlinked Unsplash avatars with referrerpolicy no-referrer]
key-files:
  created: []
  modified: [index.html, css/styles.css, REPLACE-ME.md, tools/check-home.js]
key-decisions:
  - "Real headshots chosen and viewed; alt text describes what is visible; check-home alt check loosened to non-empty alt containing the person's name"
  - "Logo text at 17 viewBox units (12.8px rendered at 320px)"
requirements-completed: [HOME-04, HOME-05, HOME-08]
duration: 12min
completed: 2026-10-12
---

# Phase 2 Plan 04: Testimonials and Logo Strip Summary

**Three fictional testimonial cards with verified Unsplash headshots on the second tint section, followed by a strip of six invented monochrome inline-SVG wordmarks with zero network requests.**

## Tasks

1. Task 1: Testimonials, CSS, REPLACE-ME rows, check-home alt loosening - commit d005711
2. Task 2: Logo strip, CSS, REPLACE-ME rows - commit 2c293a6

## Headshots (all curl 200, image/jpeg, viewed)

- Priya Nair: Unsplash photo-1494790108377-be9c29b29330 (smiling woman, dark wavy hair, red top)
- Marcus Bell: photo-1507003211169-0a1dd7228f2d (smiling man, white t-shirt)
- Lena Fischer: photo-1438761681033-6461ffad8d80 (woman with short auburn hair by a lake)

Photographer unknown for all; recorded in REPLACE-ME.md Photos table.

## Verification

- check-home shell hero services about testimonials logos: HOME OK
- check-design-system, check-portability, check-contrast, smoke-test: pass
- home-browser-test hero, nojs: pass
- home-browser-test layout: currently FAILS at "1280px: 3 steps should share a top" (steps section is Plan 05). All logo assertions pass: each svg 136px wide at 320px, text 12.8px, every text bbox inside the viewBox. Earlier layout assertions (no overflow at 320/768/1280, 2-column service cards, 3 testimonials sharing a top at 1280) also pass. Verified by running a temporary copy of the test with the steps assertions removed (copy deleted).
- Exactly 2 section--tint; no font-style/uppercase added (the 3 font-style hits are the existing @font-face normal declarations).

## Deviations from Plan

**1. [Orchestrator adjustment] Alt text and check-home.** Alt text describes the visible photo (for example "Portrait of Priya Nair, smiling, with dark wavy hair and a red top") instead of the bare "Portrait of {Name}". `mediaWith` in tools/check-home.js gained an `altLoose` option (non-empty alt containing the name), used only by the testimonials group. Files: tools/check-home.js. Commit d005711.

**2. [Orchestrator adjustment] Logo font-size 17 not 15** so rendered text is at least 12px at 320px.

## Known Stubs

None added. (The About photo placeholder from Plan 03 remains.)

## Self-Check: PASSED
