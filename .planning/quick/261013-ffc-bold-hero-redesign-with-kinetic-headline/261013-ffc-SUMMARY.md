---
phase: quick-261013-ffc
plan: 01
subsystem: home-page-motion
tags: [gsap, splittext, scrolltrigger, hero, kinetic-typography, accessibility]
requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06]
key-files:
  created: [assets/js/vendor/gsap.min.js, assets/js/vendor/SplitText.min.js, assets/js/vendor/ScrollTrigger.min.js, assets/js/vendor/GSAP-VERSION.md]
  modified: [index.html, css/styles.css, js/main.js, REPLACE-ME.md, tools/check-home.js, tools/check-contrast.js, tools/home-browser-test.js, tools/motion-browser-test.js, tools/font-metrics-test.js, .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md]
commits: [5b9c3ff, 2333186, 3040c86]
---

# Quick 261013-ffc: Bold hero redesign with kinetic headline

Near full-viewport hero with a "Marketing for your [word]" SplitText cycle (bakery to restaurant), arch-masked photo with layered frame, chips and scroll cue, plus a distinct ScrollTrigger entrance for every Home section and a larger type and spacing scale. contact.html is unchanged.

## Commits
- 5b9c3ff test: vendor GSAP 3.15.0, RED guards
- 2333186 feat: bold hero and kinetic headline
- 3040c86 feat: section choreography and scale-up

## Evidence (all guards green at the end)

| Req | Group | Result |
|-----|-------|--------|
| HERO-01 cycle with masked per-letter motion | home cycle (hold-point truth, all 7 words at 1280, 3+ at 375/320, 2+ at 768; ink check on gym, shop, café) | PASS |
| HERO-02 no shift | cycle: lede/CTA/trust/h1 edges <= 0.00px, layout shift 0.0000, slot width constant, underline never wider than active word | PASS |
| HERO-03 pause | cycle: toggle, mouse hover, focus, hidden tab, off-screen, touch tap never sticks | PASS |
| HERO-04 static fallback | cycle (reduced motion 375/1280, no-JS), motion nojs, reduced | PASS |
| HERO-05 one SR sentence | cycle aria checks, check-home hero, home nojs | PASS |
| HERO-06 performance | cycle style audit (only translate/rotate/scale/transform written during cycling), p95 frames | PASS |

Measured p95 frame times (headless, no GPU; threshold 50ms): cycle at 375 = 17.1 to 18.5ms (several runs, about 380 frames); frames group (scrolling services to testimonials at 375) = 17.4 to 18.5ms over 155 frames.

Other groups: motion vendor, choreo, choreo-jump, frames, fallback, nojs, reduced, overflow (320/375/768/1280), header, contact, console; check-portability, check-contrast (incl. HERO), check-design-system, check-home (incl. vendor), check-contact, font-metrics, smoke, contact-browser-test.

## RED output (Task 1)
Saved in scratchpad `task1-red.txt`. Failures were: new h1, toggle, chips, scroll cue, vendor tags and inline script missing; "glow-hero token missing"; cycle/choreo/choreo-jump/vendor/frames "html lacks has-motion". Rewritten fallback, nojs, reduced, overflow, header, contact passed against the old page.

## GSAP licence
gsap@3.15.0 tarball shasum 7851baaffc77642f2db3b1749d3634f9b5a19d14 (equals `npm view`). Three dist files copied byte for byte. Headers say "Subject to the terms at https://gsap.com/standard-license"; package.json licence is "Standard 'no charge' license"; README says the whole toolset incl. SplitText is free, even commercially. Details in assets/js/vendor/GSAP-VERSION.md. Re-check before launch.

## Guard expectation changes (justified)
- HERO_H1: SR sentence plus aria-hidden visual line (HERO-05).
- home NOJS: visible headline read from `.hero-title__visual`; SR sentence and hidden toggle asserted.
- home hero and layout groups measured with reduced motion (static layout), because cycling, entrance transforms and the logo ticker would otherwise be measured mid-animation.
- font-metrics display cap 80px to 116px (user asked for a much bigger headline).
- motion `reveal` replaced by `fallback` (GSAP blocked) plus `choreo`; fallback waits 200ms before the pre-state check (opacity transition's first frame).
- console group ignores the pre-existing file:// CORS error on the font `<link rel=preload crossorigin>` hints (appears only over file://, both pages, not caused by this task).
- No BLUE_ALLOWED additions. No guard was loosened for the inline head script: no guard forbade it; check-home `vendor` pins its shape (one inline script before the stylesheet containing motion-pending, prefers-reduced-motion, 2500; no innerHTML/fetch/import).
- Style audit counts only inline properties whose value changed (SplitText leaves permanent display/position on wrappers).
- check-contrast: blue text is not required on the bare hero fields; instead the hero link-cta sits on a `--surface-glass-solid` pill and blue is checked on that over the stacked fields (5.01:1).

## Tokens and contrast
`--glow-hero-blue` rgba(59,91,253,.20), `--glow-hero-coral` rgba(255,107,107,.16). Stacked worst case over tint: ink 10.32, ink-soft 4.65; over white: ink 11.06, ink-soft 4.98; link-cta pill over stack: ink 16.33, blue 5.01. `--fs-display` clamp(3.25rem, 1.2rem + 6.4vw, 7.25rem) (52 to 116px); `--fs-heading` clamp(1.9rem, 1.1rem + 2.4vw, 2.9rem), Contact pinned at 1.75rem.

## Notes and discretion choices
- motion-pending prevents no flash by itself (accepted residual, at most one frame); from-states are applied synchronously when main.js runs.
- Steps use two separate matchMedia registrations (desktop/phones) so crossing 1024px does not rebuild the hero.
- Layout shift from revealing the toggle (0.029 at 375) was fixed by reserving its space from first paint.
- `lengthOf` was costing 1.6s of main thread; now sampled on a short prefix (about 100ms), dash lengths padded 5 to 8%.
- Hero photo is an arch with a coral arch and dashed navy outline behind it; chips "4.9 from local owners" (placeholder claim) and "Born and bred in Elmhollow"; giant outlined "Elmhollow" behind About. All listed in REPLACE-ME.md.
- Existing `backdrop-filter: blur` on the sticky header predates this task (not an animated element); the plan's no-blur rule was applied to animated layers.
- Remaining ideas: stronger colour fields (limited by 4.5:1 text contrast over the stack), per-word colour shifts, hero photo parallax.

## Screenshots (scratchpad `/private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad/`)
home-bold-before-1280.png, home-bold-before-375.png, home-bold-hero-1280.png, home-bold-hero-375.png, home-bold-full-1280.png, home-bold-full-375.png, home-bold-mid-1-1280.png, home-bold-mid-2-1280.png, home-bold-mid-3-1280.png (reference: home-sleek-1280.png).

## Deviations
Rule 3 fixes: shoot.js full-page capture (min-height 100svh made a resized viewport huge) switched to captureBeyondViewport; test timeouts raised (600s/900s) for longer suites. Otherwise as planned.

## Self-Check: PASSED
