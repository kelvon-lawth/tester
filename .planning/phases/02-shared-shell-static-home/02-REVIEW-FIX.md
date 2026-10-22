---
phase: 02-shared-shell-static-home
fixed_at: 2026-10-22T13:30:00Z
review_path: .planning/phases/02-shared-shell-static-home/02-REVIEW.md
iteration: 1
findings_in_scope: 13
fixed: 11
skipped: 2
status: partial
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-10-22T13:30:00Z
**Source review:** .planning/phases/02-shared-shell-static-home/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 13 (fix_scope: all)
- Fixed: 11
- Skipped: 2

All 10 guards pass at the final HEAD (check-contact, check-contrast, check-design-system, check-home, check-portability, smoke-test, font-metrics-test, home-browser-test, contact-browser-test, motion-browser-test). Guard changes are limited to the placeholder phone strings in check-contact.js and check-home.js (IN-08).

## Fixed Issues

### CR-01: No-JS form submission sends PII by GET into the URL and host logs

**Files modified:** `contact.html`, `css/styles.css`, `js/main.js`
**Commit:** 1fc1543
**Applied fix:** The form now has `method="post"`, and its submit button ships `disabled`. The contact-form IIFE turns the button on only after the `preventDefault` submit handler is attached. A disabled default button also blocks implicit (Enter-key) submission. `@media (scripting: none)` hides the submit, and a `<noscript>` note (`.contact__noscript`) points visitors to the email address and phone number. The JS path's validation and success state are unchanged, and contact-browser-test passes. If JS is on but main.js fails to load, the button stays disabled, so nothing is submitted. That case shows no note, but the direct details are in the card right next to the form.

### WR-01: One-shot registry and safety-net timers survive a matchMedia revert

**Files modified:** `js/main.js`
**Commit:** 0b62a3d
**Status:** fixed: requires human verification (lifecycle logic)
**Applied fix:** The global `oneShots` array is replaced by per-run registries. `track(fn)` registers the triggers created during a run and returns a function that drops them. The hero/choreography run and both step branches each drop their registry in their matchMedia cleanup, so `sweep()` only walks live runs. The choreography safety-net timers now go through `later()`, and cleanup clears them and removes the `load` listener. A scratch CDP check crossed 1024px four times and then switched on reduced motion: no errors, all content settled, zero ScrollTriggers left.

### WR-02: `refreshInit` listener leaks on every desktop matchMedia run

**Files modified:** `js/main.js`
**Commit:** 485f9eb
**Applied fix:** The handler is hoisted into the `mm.add` scope. Cleanup removes it and clears the inline `stroke-dasharray` on the connector path. In the same scratch check (four crossings of 1024px), the net refreshInit listener count is 0 after the fix and 4 before it. The leftover inline dasharray is "" after the fix and "746" before it.

### WR-03: Phone pattern accepts strings made only of punctuation or spaces

**Files modified:** `contact.html`, `js/main.js`
**Commit:** 9a35c5b
**Applied fix:** The pattern is now `[\s+\(\)\-.]*(?:[0-9][\s+\(\)\-.]*){7,}`, checked against the v-flag regex. `-------`, `+++++++`, `( ) - .` and `123456` are rejected. `(555) 555-0100`, `01632 960 123` and `+44 1632 960123` are accepted. The dead `v.tooShort` branch is removed.

### WR-04: `clip-path` animated on hero photo, About photo and CTA band

**Files modified:** `js/main.js`
**Commit:** 5e9a648
**Status:** fixed: requires human verification (visual check of the replacement reveals)
**Applied fix:** All three reveals now animate only transform and opacity.
- **Hero photo:** the arch frame fades in (0.8s), and the photo rises in from `yPercent: 100` inside the frame, which already has `overflow: hidden`, with the same 1.3s `expo.inOut` timing. The existing 1.22 to 1 zoom is kept.
- **About photo:** the frame scales from 0.76 to 1, which matches the size of the old 12% inset.
- **Closing band:** fades in from opacity 0 (0.9s). Its "grows in" motion still comes from the existing scrubbed 0.94 to 1 scale.

The header comment now says no clip-path is animated. The motion test passes (p95 frame time 17.5ms). One visible difference: the band's transient rounded 40px corners during its entrance are gone, because rounded corners cannot be reproduced with transform or opacity. Every other effect keeps its original intent.

### IN-01: Card hover lift has no transition on the GSAP path

**Files modified:** `css/styles.css`
**Commit:** df465d8
**Applied fix:** Added `transition: transform var(--dur-base) var(--ease-out)` to `.service-card`, `.pricing-card` and `.testimonial` inside the `(hover: hover) and (prefers-reduced-motion: no-preference)` block. `html.has-motion .is-animating { transition: none !important }` still switches it off during GSAP entrances.

### IN-02: `motion-pending` guard for alt words is dead

**Files modified:** `css/styles.css`
**Commit:** acd54cd
**Applied fix:** Removed the `html.motion-pending .hero-word__alt` rule.

### IN-04: Error live regions start as `display: none`

**Files modified:** `css/styles.css`
**Commit:** 8136a2c
**Applied fix:** `.field__error:empty` now sets `margin: 0` instead of `display: none`. The empty regions stay in the accessibility tree at zero height, so the layout does not change.

### IN-05: Dead and overridden CSS rules

**Files modified:** `css/styles.css`
**Commit:** 8dfb5e6
**Applied fix:**
- Removed the unused `.field__input--error` selector and `.span-12`.
- Merged the duplicate `.field__hint` rules.
- Folded `.about__media` (440px) and `.cta-band__inner` (56rem) into their original declarations and deleted the later overrides, including the duplicate `.about__media` 1024px media rule. Computed values are unchanged.
- Kept `.media--placeholder`: check-home.js accepts it as the documented image-failure fallback.
- Left the section padding rules at 1907-1932 as they are: they are scoped to Home (`main:not(.page-contact)`), while the base `.section` rules still apply on Contact, so they are not redundant.

### IN-07: REPLACE-ME misses several placeholder occurrences

**Files modified:** `REPLACE-ME.md`
**Commit:** acafc29
**Applied fix:**
- Freelancer name row: added the first-name "Sam" locations (hero lede, `#about-title`, two testimonial quotes, About alt text) and the Contact meta description.
- Email row: added `.cta-band__email` and the noscript note.
- Phone row: added the noscript note.
- Area served row: added Contact "Based in".
- About photo row: now quotes the full alt text.
- Added a note to grep for `Sam`, `Elmhollow`, `samwhitlock` and `01632`/`441632960123` before launch.

### IN-08: Placeholder locale inconsistent; Contact has no meta description

**Files modified:** `index.html`, `contact.html`, `css/styles.css`, `REPLACE-ME.md`, `tools/check-contact.js`, `tools/check-home.js`
**Commit:** cfeb029
**Applied fix:**
- **Phone:** now `01632 960 123` / `tel:+441632960123` (Ofcom drama range) in both footers, the Contact details card, the noscript note and REPLACE-ME.md.
- **Contact meta description:** added, with a matching REPLACE-ME row.
- **Footer clearance:** the phone sticky-CTA footer clearance is scoped to `main:not(.page-contact) ~ .site-footer`, so it applies only on Home.
- **Guard update:** check-contact.js and check-home.js asserted the old `tel:+15555550142` and `(555) 555-0142` strings. I changed only those strings to the new placeholder. The test input `(555) 555-0100` in contact-browser-test.js was left as it is, because it is only a valid sample value typed into the field.

## Skipped Issues

### IN-03: Reserved toggle padding is removed when motion does not start

**File:** `index.html:12`, `css/styles.css:781-784`
**Reason:** Accepted as a failure-path cost, one of the two options the review gives. The other option is to reserve the padding only under `.has-motion`. But `has-motion` is added by a deferred script after first paint, so that change would cause a layout shift on the normal (motion) path every time to save one on the rare failure path.
**Original issue:** If GSAP fails, removing `motion-pending` drops about 68px of reserved padding, and the content below the hero text jumps up.

### IN-06: Duplicate `lengthOf` implementations and duplicate font loading

**File:** `js/main.js:198-218, 728-748, 21-25, 220-228`
**Reason:** Deferred. Sharing one helper across the separate IIFEs would need a global, because the site uses classic scripts with no modules (a file:// requirement). Merging the two `lengthOf` functions would also change measured dash lengths on one path, since they use different step caps (prefix scaling capped at 36 steps versus up to 2000), and both paths are tuned and covered by the motion and stroke-draw tests. This is a behaviour-neutral refactor for a later cleanup pass. It is not a defect.
**Original issue:** Two `lengthOf` functions with different step caps, and the font loads are issued twice.

---

_Fixed: 2026-10-22T13:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
