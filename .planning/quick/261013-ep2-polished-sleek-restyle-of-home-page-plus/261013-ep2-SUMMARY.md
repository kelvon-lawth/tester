---
phase: quick-261013-ep2
plan: 01
tags: [css, motion, contact, restyle]
key-files:
  modified: [css/styles.css, js/main.js, contact.html, REPLACE-ME.md, tools/check-contrast.js, tools/contact-browser-test.js, tools/font-metrics-test.js, .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md]
  created: [tools/motion-browser-test.js]
completed: 2026-10-13
---

# Quick 261013-ep2: Sleek Home restyle, motion and balanced Contact

Home restyled with layered shadows, glows, a glassy sticky header, gradient buttons with shine and chevron, photo depth, scroll reveals and self-drawing SVGs. Contact now has a centred intro and aligned 7/5 card layout.

## Commits
- ba5cf85 test: RED guards (motion test, GLOW/GLASS contrast, contact layout)
- 08f541e feat: Home restyle, reveal/draw/header IIFEs, font-metrics cap
- 5d808c9 feat: Contact layout, note removal, UI-SPEC amendment

## RED output (Task 1)
- contrast: FAIL glow token missing; FAIL glass token missing (solid, top)
- contact layout: FAIL "1280px: intro not centred"
- motion: FAIL reveal "html lacks js-reveal"; FAIL header "position is static, expected sticky"

## Guard expectation changes
- tools/font-metrics-test.js: --fs-display cap at 1440 raised 72 to 80px (two lines). Justification: user asked for a bigger headline; max is now 5rem (80px).
- tools/contact-browser-test.js layout tightened (planned). No other guard changed; check-home untouched.

## Final alphas and worst-case ratios
--glow-blue .07, --glow-coral .10, --glow-navy .14 (coral on glow over navy 4.51:1, worst case), --surface-glass-solid .95 (blue over navy 4.66:1), --surface-glass-top .78 (blue over tint 5.03:1). Hero and section glows use opaque tint/white stops plus these tokens.

## Discretion choices and deviations
- No tilt; CSS idle float on imgs instead of parallax; divider drawn via scaleX.
- Stagger delay is set by main.js as inline --reveal-delay (runtime only, not in source HTML), and an is-settled class drops it so hover lifts are instant. Plan suggested nth-child CSS.
- Underline length is measured after fonts.ready (width changes on font swap) and starts via `.hero-word.is-revealed`; test proves it starts undrawn (via a fresh clone) and ends at dashoffset 0.
- Added `.steps__connector` to the reveal list so it draws when scrolled to.
- Hero underline offset raised 4px to 8px so the larger headline still clears descenders (home-browser-test).
- Rule 1 fix: `.about__media` needed position: relative or its accent shape stretched across the page.
- noJs overflow check uses a non-timer expression (timers do not run with scripts disabled).
- Form/details cards: lift and hover shadow applied only to service and testimonial cards, not the form card.

## UI-SPEC divergences
Listed in the Amendment section of 02-UI-SPEC.md.

## Screenshots (scratchpad)
Dir: /private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad/
- home-before-1280.png, home-before-375.png, contact-before-1280.png, contact-before-375.png
- home-sleek-1280.png, home-sleek-375.png, contact-sleek-1280.png, contact-sleek-375.png

## Verification
All ten guards exit 0 (portability, contrast, design-system, font-metrics, smoke, check-home, home-browser, check-contact, contact-browser, motion). index.html unchanged.

## Self-Check: PASSED
