---
phase: quick-261022-bsb
plan: 01
subsystem: home-page
tags: [pricing, gsap, css, guards]
requirements: [PRICING-01]
key-files:
  modified: [index.html, css/styles.css, js/main.js, REPLACE-ME.md, tools/check-home.js, tools/home-browser-test.js, tools/motion-browser-test.js]
metrics:
  completed: 2026-10-22
---

# Quick 261022-bsb: Home Pricing Section Summary

Two-plan Pricing section (Local Basics £195, Growth £395 with "Most popular" badge) on Home between "Three easy steps" and the navy closing band, with GSAP entrance choreography, IO fallback and extended guards.

## Commits
- 0ef6de5 test: RED guards (check-home pricing/order/replace groups, browser layout asserts, motion TARGETS)
- cde76c1 feat: pricing markup, styles, REPLACE-ME.md ## Pricing
- Task 3 feat commit: pricing choreography and reveal fallback (js/main.js)

## Deviations from Plan
None. Plan executed as written.

## Known Stubs
Prices and plan copy are intentional placeholders, listed in REPLACE-ME.md under ## Pricing.

## Verification
All 10 tools/* guards PASS: check-contact, check-contrast, check-design-system, check-home, check-portability, smoke-test, font-metrics-test, home-browser-test, contact-browser-test, motion-browser-test.

## Self-Check: PASSED
