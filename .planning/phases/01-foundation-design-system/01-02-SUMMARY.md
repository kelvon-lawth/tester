---
phase: 01-foundation-design-system
plan: 02
subsystem: design-system
tags: [css, style-guide, wcag, contrast, components, testing]
requires: [01-01]
provides:
  - "tools/check-contrast.js: WCAG AA guard for 15 required and 2 forbidden token pairings"
  - "tools/check-design-system.js: tokens-only CSS, 2 accent types, style guide completeness"
  - "Component CSS: .divider-squiggle, .btn, links, .field__*, .media, .grid-12, .card, .section, .icon"
  - "styleguide.html with 10 sections and live contrast table (js/styleguide.js)"
  - "REPLACE-ME.md placeholder checklist"
affects: [01-03, phase-2, phase-3, phase-4]
tech-stack:
  added: []
  patterns: [CSS mask data-URI squiggle, state classes (.is-hover/.is-focus) for style guide, zero-dependency Node guards]
key-files:
  created:
    - tools/check-contrast.js
    - tools/check-design-system.js
    - styleguide.html
    - js/styleguide.js
    - REPLACE-ME.md
  modified:
    - css/styles.css
    - index.html
    - contact.html
key-decisions:
  - "Added --color-on-navy-hover token to :root so no raw rgba lives outside tokens"
  - "check-design-system ignores @font-face blocks and url(data:...) contents when scanning for raw values"
  - "Sample photo is Unsplash bread photo 1509440159596 (HTTP 200, visually checked); photographer name not confirmed, recorded as a gap in REPLACE-ME.md"
requirements-completed: [FND-02, FND-03, FND-05]
duration: ~20min
completed: 2026-10-12
---

# Phase 1 Plan 02: Style Guide and Component Kit Summary

Reviewable style guide (palette, live WCAG contrast table, type, spacing, both accents, hero words, buttons/fields, icons, photo, grid) rendered from shared tokens, with guard scripts proving AA contrast and tokens-only CSS.

## Tasks

| Task | Name | Commit |
|------|------|--------|
| 1 | Contrast and design-system guards | c8156c1 |
| 2 | Component CSS, style guide sections 1-6, styleguide.js | 2ca0179 |
| 3 | Sections 7-10, REPLACE-ME.md, dev footer links | see git log (feat(01-02) style guide view commit) |

## Verification

- check-contrast: 15 PASS, 2 FORBIDDEN, CONTRAST OK; a scratch CSS with a lightened blue exits 1 (scratch deleted)
- check-design-system: DESIGN SYSTEM OK; check-portability: PORTABILITY OK
- smoke-test: PASS for index, contact, styleguide (js fonts-loaded)
- Footer blocks byte-identical across the three pages

## Deviations from Plan

**1. [Rule 1 - Bug] @font-face font-weight tripped the tokens-only rule**
- Fix: guard strips @font-face blocks before scanning (they legitimately need literal weights).
- Commit: c8156c1

**2. [Rule 3 - Constraint] Photographer not confirmed**
- Plan checker allowed fallback only for failed URLs; URL returned 200 but no credit metadata is available offline. Credit recorded as photo id with a note to look up the name. Gap logged in REPLACE-ME.md.

## Known Stubs

None new. styleguide.html is intentionally dev-only (removed in Phase 5).

## Threat Flags

None. T-01-04/05/06 mitigations applied (referrerpolicy, textContent only, Unsplash licence recorded).

## Self-Check: PASSED

Created files exist; commits c8156c1, 2ca0179 and the Task 3 commit present.
