---
phase: 02-shared-shell-static-home
plan: 05
subsystem: ui
tags: [html, css, js, how-it-works, cta-band, sticky-cta, intersection-observer]
requires:
  - phase: 02-shared-shell-static-home
    provides: logos, testimonials, shell, home-browser-test sticky/layout groups
provides:
  - Squiggle divider and Chat/Plan/Grow timeline with coral connector at 1024px+
  - Navy closing CTA band with on-navy button and mailto link
  - Phone sticky "Let's talk" button driven by IntersectionObserver
affects: [02-06]
tech-stack:
  added: []
  patterns: [second IIFE in main.js so fonts early return cannot skip it, no-JS default-visible sticky CTA]
key-files:
  created: []
  modified: [index.html, css/styles.css, js/main.js, REPLACE-ME.md]
key-decisions:
  - "Sticky CTA logic lives in a separate IIFE; falls back to always visible without IntersectionObserver"
requirements-completed: [HOME-06, HOME-07, SHL-03, SHL-04]
duration: 10min
completed: 2026-10-13
---

# Phase 2 Plan 05: How It Works, Closing Band and Sticky CTA Summary

**Three-step Chat/Plan/Grow timeline with a single coral squiggle connector, a navy closing "Let's get your business busy" band, and a phone-only sticky "Let's talk" button that hides over the hero CTA, band and footer.**

## Tasks

1. Divider and How it works timeline - commit b643e1c
2. Navy closing CTA band - commit e32f5f8
3. Sticky CTA, IntersectionObserver block, IN-01 comment in first IIFE - commit a6065a4

## Verification

- home-browser-test (hero, nojs, sticky, layout): BROWSER OK
- check-home all groups through sticky/order: HOME OK
- check-design-system, check-contrast, check-portability, font-metrics-test, smoke-test: pass
- main.js contains no innerHTML/fetch/import; contact.html has no sticky-cta

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None added (About photo placeholder from Plan 03 remains).

## Self-Check: PASSED
