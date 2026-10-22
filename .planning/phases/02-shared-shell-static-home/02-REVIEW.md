---
phase: 02-shared-shell-static-home
reviewed: 2026-10-22T12:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - index.html
  - contact.html
  - css/styles.css
  - js/main.js
  - REPLACE-ME.md
findings:
  critical: 1
  warning: 4
  info: 8
  total: 13
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-22T12:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

I reviewed both pages, the single stylesheet, the shared script (seven IIFEs: fonts, sticky CTA, contact form, GSAP motion, IO reveal fallback, stroke draw, header shadow) and the placeholder checklist. Most of the progressive enhancement is careful. The `has-motion` / `js-reveal` gating is correct because `gsap.matchMedia().add` runs its callback synchronously. Fail paths clear inline styles, and the reduced-motion branches never hide content.

Main problems:
- **No-JS contact form (CR-01):** without JavaScript the form submits by GET to `#`. This puts the visitor's personal details (PII) in the URL and the host's access logs, and drops the message silently.
- **Motion lifecycle leaks (WR-01, WR-02):** the GSAP code leaks state across matchMedia revert and re-run: a stale one-shot registry, timers that are never cancelled, and a `refreshInit` listener that is never removed.
- **Weak phone validation (WR-03):** the phone pattern accepts strings made only of punctuation.
- **Animation constraint broken (WR-04):** the code animates `clip-path`, which goes against the project rule to animate only `transform` and `opacity`.

## Critical Issues

### CR-01: No-JS form submission sends PII by GET into the URL and host logs, and loses the message silently

**File:** `contact.html:38`
**Issue:** The form is `<form ... novalidate action="#">` with no `method`, so it defaults to GET. If `main.js` fails to load or run (JS disabled, script error, blocked file), clicking "Send message":
- skips all validation, because of `novalidate`;
- navigates to `contact.html?name=...&phone=...&email=...&message=...#`, which writes the visitor's name, phone, email and free-text message into the address bar, browser history and the static host's access logs (Netlify, GitHub Pages and Cloudflare all log query strings);
- reloads an empty form with no feedback, so the visitor reasonably thinks the message was sent, but it is gone.

The success copy shown in the JS path says "nothing was actually sent", but the no-JS path gives no such notice.
**Fix:** Make the form inert until JS enhances it, and give no-JS visitors the direct contact route:
```html
<form id="contact-form" class="contact-form" novalidate method="post" action="javascript:void(0)">
```
or, better, keep the markup but disable submission without JS:
```css
.no-js .contact-form button[type="submit"] { display: none; }
```
```html
<noscript><p class="contact__noscript">The form needs JavaScript. Please email
  <a href="mailto:hello@samwhitlock.example">hello@samwhitlock.example</a> or ring (555) 555-0142.</p></noscript>
```
In either case, never let the form fall back to a GET that serialises PII.

## Warnings

### WR-01: One-shot registry and safety-net timers survive a matchMedia revert

**File:** `js/main.js:238, 255-264, 395-419, 597-633`
**Issue:**
- `oneShots` is a closure-level array that is only ever pushed to. When the motion context reverts, it keeps every reverted, killed ScrollTrigger. This happens when the user switches to `prefers-reduced-motion: reduce` at runtime, and on every resize across 1024px for the step branches, where `stepOneShot` re-registers new triggers each time.
- The cleanup removes the `scroll` and `scrollEnd` listeners, but it does not cancel the `setTimeout(sweep("final"), 4000)` (line 398), the per-bottom-hit `setTimeout(sweep("final"), 1500)` (line 411), or the `load` listener (line 400). These can still fire after revert.

`sweep` then calls `a.progress(1)` or `a.play()` on stale timelines whose `from()` tweens and `onDone` callbacks (`split.revert()`, `clearProps`) were already reverted. That can re-run entrance tweens under reduced motion, and it can fight the replacement desktop or phone step timelines after a breakpoint change (two timelines driving the same `.step` transform). The registry also grows without limit across resizes.
**Fix:** Scope the registry and timers to the context and clear them in cleanup:
```js
var timers = [];
function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
// use later(...) instead of window.setTimeout(...) in onLoaded/onScroll
cleanups.push(function () {
  timers.forEach(clearTimeout); timers.length = 0;
  window.removeEventListener("load", onLoaded);
  oneShots.length = 0;
});
```
For the step branches, track their own triggers and filter them out of `oneShots` in the matchMedia cleanup, or have `sweep` skip `st.isReverted` / killed triggers (for example, `if (!st.animation || !st.trigger || !st.enabled) return;`).

### WR-02: `refreshInit` listener leaks on every desktop matchMedia run

**File:** `js/main.js:617`
**Issue:** `ScrollTrigger.addEventListener("refreshInit", ...)` is registered inside the `(min-width: 1024px)` matchMedia branch, and nothing ever removes it. Each time the viewport crosses 1024px (window resize, rotating a tablet, DevTools), another listener is added. All of them keep writing an inline `stroke-dasharray` onto the connector path on every refresh, including after the context reverted or under reduced motion. That leaves an inline dash length that no longer matches the current non-scaling-stroke length.
**Fix:**
```js
var onRefreshInit = function () { gsap.set(path, { strokeDasharray: lenOf() }); };
ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
// ...and return a cleanup from the mm.add callback:
return function () { live = false; ScrollTrigger.removeEventListener("refreshInit", onRefreshInit); };
```
`onRefreshInit` is created inside `ready.then`, so hoist a `var onRefreshInit` into the `mm.add` scope so the returned cleanup can see it.

### WR-03: Phone pattern accepts strings made only of punctuation or spaces

**File:** `contact.html:47`, `js/main.js:94-96`
**Issue:** `pattern="[0-9+\(\)\-. ]{7,}"` has no requirement for digits. I checked it with the `v`-flag regex the browser uses: `-------`, `+++++++` and `.......` all pass. `normalise()` only blanks whitespace-only values, so `"( ) - ."` padded to 7 characters also passes. The form then shows the success state for a phone number that cannot be called back, which is the one field the copy says is needed ("so I can call you back"). The `v.tooShort` branch in `messageFor` is dead code because the input has no `minlength`.
**Fix:** Require at least 7 digits:
```html
pattern="[\s+\(\)\-.]*(?:[0-9][\s+\(\)\-.]*){7,}"
```
or validate in JS with `input.value.replace(/\D/g, "").length >= 7` and `input.setCustomValidity(...)`. Remove the `tooShort` check, or add a `minlength`.

### WR-04: `clip-path` is animated on the hero photo, About photo and CTA band, against the project's transform/opacity-only rule

**File:** `js/main.js:317, 382, 460`
**Issue:** CLAUDE.md says "Animate only `transform` and `opacity` for smoothness on phones." Three timelines tween `clipPath`:
- the hero photo, a 1.3s `inset(100%…)` to `inset(0)` reveal that runs during the first-paint-critical hero entrance;
- the About photo, with `round 24px`;
- the full-width navy CTA band, with `round 40px`, at the same time as a scrubbed scale.

`clip-path` with rounded insets is not composited. Every frame repaints the clipped layer, and for the hero this overlaps the photo's own `scale` tween and the chip pops. The comment at line 158 documents this as a "one-shot" exception, but the constraint does not allow exceptions, and the hero is exactly where the core-value smoothness requirement applies.
**Fix:** Replace these reveals with transform/opacity equivalents. For example, use a mask wrapper with `overflow: hidden` and animate the inner photo's `yPercent` from 100 to 0 (or `scaleY` on a cover element with `transform-origin: top`). For the band, animate `scale` and `opacity` only. Alternatively, record a formal exception in CLAUDE.md and the UI spec with a measured frame budget on a mid-range phone.

## Info

### IN-01: Card hover lift has no transition on the main (GSAP) path

**File:** `css/styles.css:1472-1481`
**Issue:** The `translateY(-4px)` hover lift on `.service-card`, `.pricing-card` and `.testimonial` only animates when `.reveal.is-settled` (the IO fallback, line 1822) supplies a transform transition. Under `has-motion`, which is the default path on Home, `.card` has no `transition: transform`, so the lift jumps instantly while the shadow layer fades over 250ms.
**Fix:** Add `transition: transform var(--dur-base) var(--ease-out);` to those three selectors inside the `(hover: hover) and (prefers-reduced-motion: no-preference)` block.

### IN-02: `motion-pending` guard for alt words is dead

**File:** `css/styles.css:593-596`, `js/main.js:432, 532-553`
**Issue:** `pendingOff()` runs synchronously at line 432, before `ready.then` inserts the `.hero-word__alt` spans. So `html.motion-pending .hero-word__alt { opacity: 0 }` can never match the spans it was written to guard. It is harmless only because the split and the `yPercent: 140` set happen in the same task, before any paint.
**Fix:** Remove the rule, or keep `motion-pending` until the cycle is built.

### IN-03: Reserved toggle padding is removed when motion does not start, which shifts the layout

**File:** `index.html:12`, `css/styles.css:781-784`
**Issue:** `motion-pending` adds about 68px of bottom padding to `.hero__text`. If GSAP fails to load, or the hero branch fails, the inline 2.5s timer or `pendingOff()` removes it and everything below the hero text jumps up.
**Fix:** Accept the shift as a failure-path cost, or only reserve the padding under `.has-motion`.

### IN-04: Error live regions start as `display: none`

**File:** `css/styles.css:1345-1347`, `contact.html:42,48,54`
**Issue:** `.field__error:empty { display: none }` takes the `aria-live` regions out of the accessibility tree until they get text. Several screen-reader and browser combinations do not announce a live region that appears together with its first content. Focus on the first invalid field plus `aria-describedby` covers the first error, but errors on later fields, or a repeated identical message, may not be announced.
**Fix:** Keep the element rendered and collapse it visually (for example `min-block-size: 0; margin: 0` when empty), or use a single form-level `aria-live` summary.

### IN-05: Dead and overridden CSS rules

**File:** `css/styles.css`
**Issue:**
- `.media--placeholder` (1017), `.field__input--error` (1247) and `.span-12` (1437) are not used by any page or by `styleguide.html`.
- `.field__hint` is declared twice in a row (1332, 1337).
- `.about__media { max-inline-size: 320px }` (1543) is always overridden by `440px` at 1975.
- `.cta-band__inner { max-inline-size: 36ch }` (1760) is overridden by `56rem` at 2040.
- `.section`, `.section--tight` and `.section--joined` padding is redefined at 1907-1932.

These make it unclear which value is real.
**Fix:** Delete the dead selectors and fold the later overrides into the original declarations.

### IN-06: Duplicate `lengthOf` implementations and duplicate font loading

**File:** `js/main.js:198-218, 728-748, 21-25, 220-228`
**Issue:**
- Two different `lengthOf` functions measure non-scaling strokes with different step caps (36 with prefix scaling, versus up to 2000), so the same path can get different dash lengths depending on which path runs.
- The three `document.fonts.load` calls are issued twice.

**Fix:** Hoist one shared `lengthOf` and one shared fonts promise into a small top-level helper that the IIFEs reuse.

### IN-07: REPLACE-ME misses several placeholder occurrences

**File:** `REPLACE-ME.md:9, 18, 20, 39`
**Issue:**
- The Freelancer name row does not mention "I'm Sam" (`.hero__lede`), "Hi, I'm Sam" (`#about-title`), "Sam" inside two testimonial quotes, or "stand-in portrait for Sam" in the About image alt.
- The Email row omits the `mailto:` href in `index.html` `.cta-band__email`.
- The Area served row omits `contact.html` `.contact__list` "Based in".
- The About photo row's quoted alt text leaves out "a stand-in portrait for Sam".

A find-and-replace driven by this checklist would leave the old name and links behind.
**Fix:** Add these locations to the matching rows, or add a note to grep for `Sam`, `Elmhollow`, `samwhitlock` and `5555550142` across all files.

### IN-08: Placeholder locale is inconsistent; contact page has no meta description

**File:** `index.html:222,237,276`, `contact.html:4-6,77`
**Issue:**
- The site uses British spelling and £ prices, but the phone is a US `(555)` / `+1` number. When it is swapped for a real UK number, the format and `tel:` href will need different handling than the checklist implies.
- `contact.html` has no `<meta name="description">`, while `index.html` does.
- The sticky-CTA footer clearance (`styles.css:499-501`) also adds 80px of empty space to the Contact footer on phones, but Contact has no sticky CTA.

**Fix:**
- Use a UK-format placeholder, for example `01632 960 123` (an Ofcom drama-range number) with `tel:+441632960123`.
- Add a meta description to Contact.
- Scope the footer clearance to pages that have the sticky CTA (`body:has(.sticky-cta)`, or a page class).

---

_Reviewed: 2026-10-22T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
