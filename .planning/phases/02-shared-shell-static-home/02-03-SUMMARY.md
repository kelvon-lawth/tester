---
phase: 02-shared-shell-static-home
plan: 03
subsystem: ui
tags: [html, css, services, about, svg-icons]
requires:
  - phase: 02-shared-shell-static-home
    provides: hero, shell, check-home.js, base CSS
provides:
  - Services section (#services, 2x2 white cards, blue line icons)
  - About block (#about) with mid-page "Let's talk" CTA
affects: [02-04, 02-05, 02-06]
tech-stack:
  added: []
  patterns: [hand-authored inline SVG icons, media--placeholder fallback]
key-files:
  created: []
  modified: [index.html, css/styles.css, REPLACE-ME.md]
key-decisions:
  - "About photo uses the documented media--placeholder fallback (GAP row in REPLACE-ME.md) because no candidate matched the alt text"
requirements-completed: [HOME-02, HOME-03, SHL-03, HOME-08]
duration: 15min
completed: 2026-10-12
---

# Phase 2 Plan 03: Services and About Summary

**Tinted Services section with four white cards and hand-drawn blue line icons, followed by a first-person About block ending in the mid-page "Let's talk" button.**

## Tasks

1. Task 1: Services section, CSS, REPLACE-ME rows - commit 966c3c8
2. Task 2: About block, CSS, REPLACE-ME rows - commit dd09a2b

## Verification

- check-home shell hero services about: HOME OK
- home-browser-test hero (no overflow 320/768/1280) and nojs: pass
- check-design-system, check-contrast, check-portability, smoke-test: pass
- 2 "Let's talk" links to contact.html (hero, About); exactly 1 section--tint so far

## Deviations from Plan

**About photo fallback (planned fallback, not a bug).** Five Unsplash candidates returned 200 image/jpeg, but all were studio or posed portraits; none showed a person walking down a high street with a coffee, so using any would make the mandated alt text false. Used `media media--placeholder` role="img" with the same aria-label (check-home accepts it). A GAP row in REPLACE-ME.md Photos table asks for a real square photo plus matching alt. Threat T-02-08 is moot for now (no hotlink).

CSS was inserted before the dev-only style guide block so Phase 5 removal of that block does not drop it.

## Known Stubs

- About photo placeholder (index.html `.about__media`), intentional, tracked in REPLACE-ME.md as GAP.

## Self-Check: PASSED
