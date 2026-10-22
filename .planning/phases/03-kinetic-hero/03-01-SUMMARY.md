---
phase: 03-kinetic-hero
plan: 01
subsystem: ui
tags: [hero, gsap, splittext, verification]
requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06]
key-decisions:
  - "Hero was built early in quick task 261013-ffc; this phase re-verifies it after the Phase 2 review fixes (WR-01 lifecycle, WR-04 transform/opacity entrance)"
completed: 2026-10-22
---

# Phase 3 Plan 01: Kinetic hero re-verification Summary

**All 10 guards pass at HEAD on 2026-10-22, so HERO-01..06 hold after the Phase 2 review fixes.**

- **cycle** (home-browser-test): 7 words at 320, 375, 768 and 1280, hold points correct, edges stable, no clipped descenders. The pause model, touch, aria, reduced-motion and lifecycle checks all pass.
- **hero / nojs**: no overflow, and the headline is complete without JavaScript.
- **motion-browser-test reduced / nojs**: the final state shows at load with no cycling.
- **frames**: p95 of 17.5ms at 375 (headless).

No code changes were needed. The real-device smoothness check is deferred to Phase 5 QA.
