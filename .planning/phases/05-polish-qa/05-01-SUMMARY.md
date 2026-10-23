---
phase: 05-polish-qa
plan: 01
subsystem: qa
tags: [qa, accessibility, performance, cdp, images]
requires: [phase-04]
provides:
  - tools/qa-browser-test.js (guard 11: overflow, tap, keyboard, shell, weight, hosting)
  - local photos in assets/img/
affects: [index.html, contact.html, REPLACE-ME.md, tools/check-home.js, tools/check-portability.js]
tech-stack:
  added: []
  patterns: [raw-CDP QA harness with persistent listeners, local node:http static server on 127.0.0.1:0]
key-files:
  created:
    - tools/qa-browser-test.js
    - assets/img/hero-shop-owner.webp
    - assets/img/about-portrait.webp
    - assets/img/avatar-priya-nair.webp
    - assets/img/avatar-marcus-bell.webp
    - assets/img/avatar-lena-fischer.webp
  modified:
    - index.html
    - contact.html
    - tools/check-home.js
    - tools/check-portability.js
    - REPLACE-ME.md
decisions:
  - Photos vendored as WebP (hero 75KB, About 41KB, avatars ~9KB each)
  - Inline data: favicon link in both heads instead of a favicon file
  - file:// crossorigin font preload failures tolerated by the hosting guard (real fonts verified loaded)
requirements-completed: [QA-01, QA-02, QA-03]
metrics:
  completed: 2026-10-22
  tasks: 3
---

# Phase 5 Plan 1: Polish and QA Summary

One automated QA suite (overflow, 44px tap targets, keyboard focus, shell parity, first-view weight + CLS, subfolder/file:// hosting) now passes. The hot-linked Unsplash photos are vendored locally, so Home makes no third-party requests.

## Commits
- d903616 test(05-01): add failing QA browser guard (RED)
- 1a32400 feat(05-01): vendor Unsplash photos locally (QA-03)
- 76e8c7a fix(05-01): settle reveals before tap/keyboard measurement, harden hosting nav (QA-01, QA-02)

## Results
- overflow: no sideways scroll at 320/375/768/1280 (JS) and 320 (no JS), both pages.
- tap: 29 targets at 375, all >= 44x44 (inline paragraph links exempt).
- keyboard: Tab reaches all 15 controls on each page at 1280 and 375, all with visible focus; Space toggles the hero pause button; Enter on empty contact form focuses the first invalid field.
- shell: header/footer identical in the rendered DOM; one aria-current per page.
- weight: first view 400KB at 1280 and 360KB at 375, same-origin only, CLS 0.000.
- hosting: copy in "sub dir/site" works over file:// and over an http subpath; nav links work.

## Deviations from Plan
1. [Rule 1 - Bug, tests] Initial tap and keyboard failures (41.4px targets, sticky CTA unreachable) were measurement artifacts from elements caught mid-reveal (about 0.94 scale, hidden sticky CTA). Fixed in the harness by letting reveals settle, not by changing CSS. No CSS changes were needed; the approved design is untouched.
2. [Rule 2 - Missing functionality] Added `<link rel="icon" href="data:,">` to the head of both pages. The browser's automatic /favicon.ico request 404s on static hosts and failed the weight and hosting guards.
3. [Rule 3 - Blocking] In no-JS mode `setTimeout` never fires inside Runtime.evaluate, so the overflow guard skips its settle sleep there. The hosting nav click is deferred with setTimeout to avoid evaluating across navigation.
4. [Scope note] The hosting guard tolerates failed `.woff2` requests on file:// only. Chrome treats file:// as cross-origin, so the `crossorigin` font preloads fail there, but all three @font-face fonts report `loaded`, which the guard requires. Fixing it would mean removing preloads that help http hosting.
5. A first all-guards run showed three browser suites timing out (home, motion, qa). A clean rerun passed all three with no code change, so this was transient Chrome/machine contention.

## human_needed
- Real-device animation smoothness (HERO-06) on a typical phone and laptop.
- A screen-reader pass (VoiceOver/NVDA) on both pages.
- Dev-only files (styleguide.html, js/styleguide.js, tools/) still present; removal is a pending user decision, listed in REPLACE-ME.md "remove before launch".

## Known Stubs
None. Placeholder content is intentional and tracked in REPLACE-ME.md.

## Self-Check: PASSED
All 11 guards pass in the final run (check-contact, check-contrast, check-design-system, check-home, check-portability, smoke-test, font-metrics-test, home-browser-test, contact-browser-test, motion-browser-test, qa-browser-test ending QA BROWSER OK).
