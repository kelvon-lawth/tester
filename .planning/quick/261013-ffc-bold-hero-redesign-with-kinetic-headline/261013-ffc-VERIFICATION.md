---
phase: quick-261013-ffc
verified: 2026-10-13T00:00:00Z
status: human_needed
score: 12/12 automated must-haves verified
human_verification:
  - test: "Open index.html at 1280 and 375 and compare the first view and a scroll-through against the ep2 result"
    expected: "Hero is clearly bolder (large headline, visible drifting colour fields, arch photo with frame and chips); each section has its own scroll entrance; feel is warm and local"
    why_human: "Visual boldness and motion feel are subjective and cannot be asserted by guards"
  - test: "Watch the cycling word for several cycles on a real phone or laptop GPU"
    expected: "Smooth masked per-letter rise in and out with no stutter"
    why_human: "Headless p95 (about 17ms) has no GPU, so real-device smoothness is unproven"
---

# Quick 261013-ffc Verification

**Goal:** bold hero, kinetic cycling headline (HERO-01..06), scroll choreography for every Home section, vendored GSAP 3.15.0 via classic scripts, contact.html unchanged, guards green, nothing hidden without JS, GSAP or with reduced motion.

## Guard runs (executed by the verifier, exit code 0 each)

| Guard | Result |
|-------|--------|
| check-portability | PORTABILITY OK |
| check-contrast (incl. HERO group) | CONTRAST OK |
| check-design-system | DESIGN SYSTEM OK |
| check-home (incl. vendor) | HOME OK |
| check-contact | CONTACT OK |
| font-metrics-test | FONT METRICS OK |
| smoke-test | pass (index has-motion) |
| home-browser-test | BROWSER OK (hero, nojs, sticky, layout, cycle) |
| contact-browser-test | CONTACT BROWSER OK |
| motion-browser-test | MOTION OK (vendor, choreo, choreo-jump, frames, fallback, nojs, reduced, overflow, header, contact, console) |

## HERO-01..06 verdicts

| Req | Verdict | Evidence |
|-----|---------|----------|
| HERO-01 cycling word, per-letter motion | VERIFIED | `data-words` on index.html with 7 words; cycle test: all 7 words at 1280, hold points checked, no clipped descenders; GSAP SplitText in main.js |
| HERO-02 no layout shift | VERIFIED | cycle test: edges <= 0.00px, layout-shift 0.0000, constant slot, underline never wider than active word |
| HERO-03 pause control | VERIFIED | toggle (aria-pressed, fixed label), mouse hover only, focus, hidden tab, off-screen, touch tap does not stick; all tested |
| HERO-04 static fallback | VERIFIED | reduced motion (375, 1280) and no-JS: static "bakery", no alts, toggle hidden |
| HERO-05 one SR sentence | VERIFIED | h1 holds visually-hidden sentence plus aria-hidden visual line; byte-checked by check-home |
| HERO-06 performance | VERIFIED (headless only) | style audit allows transform/opacity-class props only; p95 17.6ms at 375 over 381 frames; real-device smoothness is a human item |

## Other must-haves

- Vendored GSAP, ScrollTrigger and SplitText: banners are 3.15.0, tags are classic `defer` in the right order, `vendor` tests pass over file://, and no console errors on either page.
- contact.html: `git diff 4a7d1b2 HEAD -- contact.html` is empty (last touched in ep2); it loads no vendor files.
- Scroll choreography: the choreo, choreo-jump and frames groups pass at 1280 and 375. This covers pre-states at load, connector scrub, scroll-linked ticker, and every element settled after a full scroll or a single jump to the bottom.
- Nothing hidden: nojs, reduced and fallback (GSAP blocked) groups pass.
- main.js is clean: grep finds no innerHTML, fetch(, import or module scripts. No `filter: blur` on animated layers. The only blur is the pre-existing sticky header `backdrop-filter`.
- No horizontal overflow at 320, 375, 768 and 1280.

## Loosened or changed guard expectations

| Change | Judgement |
|--------|-----------|
| HERO_H1 string | Justified: the new SR sentence plus aria-hidden line is required for HERO-05 |
| `--fs-display` cap 80px to 116px in font-metrics-test | Justified: the user asked for a much bigger headline, and the test still enforces a cap and the one-line fit of "restaurant" (252px in 288px at 320) |
| Blue text not required on bare hero glow fields; blue checked on the glass pill | Acceptable: the only blue text in the hero is `.hero__actions .link-cta`, which has a `--surface-glass-solid` background, and it is checked at 5.01:1. Ink and ink-soft still pass on the stacked worst case |
| Console group ignores the file:// CORS font-preload error | Acceptable: narrow regex (woff2 font access under file:///) and documented as pre-existing. Real exceptions and console errors still fail |
| Home layout and hero measured under reduced motion | Acceptable: avoids measuring mid-animation. The cycle group tests the motion path separately |
| Style audit counts only inline properties whose value changed | Minor weakening, acceptable: SplitText leaves permanent wrapper display and position, and the audit still rejects width, top and left changes |
| Fallback waits 200ms before the pre-state check | Acceptable: timing allowance for the opacity transition's first frame |

No guard was removed. No BLUE_ALLOWED additions were made.

## Gaps

None found. The remaining items are human-only (visual boldness, real-device smoothness). The residual one-frame flash before first paint is documented as accepted in the SUMMARY.
