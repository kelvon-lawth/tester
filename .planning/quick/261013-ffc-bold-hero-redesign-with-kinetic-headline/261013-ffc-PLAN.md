---
phase: quick-261013-ffc
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - assets/js/vendor/gsap.min.js
  - assets/js/vendor/SplitText.min.js
  - assets/js/vendor/ScrollTrigger.min.js
  - assets/js/vendor/GSAP-VERSION.md
  - index.html
  - css/styles.css
  - js/main.js
  - REPLACE-ME.md
  - tools/check-home.js
  - tools/check-contrast.js
  - tools/home-browser-test.js
  - tools/motion-browser-test.js
  - tools/font-metrics-test.js
  - .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md
autonomous: true
requirements: [QUICK-261013-ffc, HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06]

must_haves:
  truths:
    - "The first view at 1280 and 375 is clearly bolder than home-sleek-1280.png: the hero fills roughly the viewport (min-height about calc(100svh - header) on desktop), the headline is much larger, the background has slowly drifting blue and coral colour fields over a tint base with a subtle dot grid, and the photo is large and masked with a layered offset accent frame, two floating proof chips and a scroll cue"
    - "The headline reads 'Marketing for your [word]'. The word cycles through bakery, café, salon, gym, florist, shop and restaurant with a per-letter masked rise-in and rise-out (HERO-01)"
    - "While the word cycles, h1, .hero__lede, #hero-cta and .trust-cue keep their positions within 1px at 320, 375, 768 and 1280, and the layout-shift PerformanceObserver records 0 shift (HERO-02, HERO-06)"
    - "At each hold point the visible word equals data-words[current] at full opacity with no clipped descenders or accents, and p95 frame time at 375 stays <= 50ms in headless during cycling and scrolling (HERO-01, HERO-06)"
    - "No flash of pre-animation content: an inline head script sets html.motion-pending (never hides content by itself), and main.js swaps it for has-motion or removes it. A 2.5s failsafe clears it if main.js never runs"
    - "A visible 'Pause animation' toggle (fixed label, aria-pressed is the single state signal) pauses and resumes the cycle and the hero ambient motion. The cycle also pauses on mouse hover over the headline (never on touch taps), on focus inside the hero, when the tab is hidden, and when the hero is scrolled off-screen, then resumes when the cause clears unless the user paused it (HERO-03)"
    - "With prefers-reduced-motion: reduce, or with JS disabled, the headline is a complete static 'Marketing for your bakery', there is no cycling and no hidden content, and the toggle stays hidden (HERO-04)"
    - "Screen readers get exactly one complete headline from a visually-hidden sentence inside the h1. The animated visual line is aria-hidden, so word changes are never announced (HERO-05)"
    - "Every Home section has its own scroll choreography. Service cards cascade in with icon draws. The About photo un-masks and settles from a slight scale while the text slides in. Testimonials enter from alternating sides. Logos run as a scroll-linked ticker. The steps connector draws in proportion to scroll and the badges pop. The navy band grows from a clipped inset with a glowing sweep. Large decorative shapes and type drift with gentle parallax. Native scrolling is never hijacked"
    - "Section headings, cards, photos, step numbers and section spacing are visibly larger than in the ep2 pass"
    - "After scrolling to the bottom and letting motion settle, every content element on Home has opacity 1, transform offset under 1px and no clip. With JS disabled, with reduced motion, or with the GSAP vendor files blocked, nothing is hidden. The fallback path uses the existing IntersectionObserver reveals"
    - "GSAP 3.15.0, SplitText and ScrollTrigger are vendored locally, load over file:// with classic defer scripts before main.js, and produce no console errors or page exceptions on index.html or contact.html"
    - "No horizontal overflow at 320, 375, 768 and 1280. Every existing guard stays green, and any guard expectation that changed is justified in the SUMMARY"
  artifacts:
    - path: "assets/js/vendor/gsap.min.js"
      provides: "GSAP core 3.15.0 (verbatim from npm gsap@3.15.0 package/dist)"
      contains: "GSAP 3.15.0"
    - path: "assets/js/vendor/SplitText.min.js"
      provides: "SplitText 3.15.0"
      contains: "SplitText 3.15.0"
    - path: "assets/js/vendor/ScrollTrigger.min.js"
      provides: "ScrollTrigger 3.15.0"
      contains: "ScrollTrigger 3.15.0"
    - path: "index.html"
      provides: "New hero markup (SR sentence plus aria-hidden visual line, data-words slot, toggle button, proof chips, scroll cue, decor layers), inline motion-pending head script, vendor script tags, decorative parallax elements"
      contains: "assets/js/vendor/gsap.min.js"
    - path: "js/main.js"
      provides: "Motion IIFE: gsap.matchMedia branches, kinetic cycle with pause reasons, hero entrance, per-section ScrollTrigger choreography, logo ticker, safety net; IO fallback IIFE bails when html.has-motion"
      contains: "gsap.matchMedia"
    - path: "css/styles.css"
      provides: "Bold hero (fields, dot grid, masked photo, frame, chips, scroll cue, toggle), larger section scale, html.has-motion gated pre-states, :root tokens for the new surfaces"
      contains: "has-motion"
    - path: "tools/home-browser-test.js"
      provides: "cycle group (cycling, layout stability, pause/hover/focus/hidden/off-screen, aria, reduced, no-JS)"
      contains: "cycle"
    - path: "tools/motion-browser-test.js"
      provides: "choreo, fallback, vendor and console groups, plus extended nojs and reduced groups"
      contains: "choreo"
  key_links:
    - from: "index.html <script defer> tags"
      to: "assets/js/vendor/*.min.js then js/main.js"
      via: "classic deferred scripts in order gsap, ScrollTrigger, SplitText, main"
      pattern: "vendor/gsap\\.min\\.js[\\s\\S]*vendor/ScrollTrigger\\.min\\.js[\\s\\S]*vendor/SplitText\\.min\\.js[\\s\\S]*js/main\\.js"
    - from: "js/main.js motion IIFE"
      to: "css/styles.css html.has-motion rules"
      via: "html.has-motion added inside the gsap.matchMedia no-preference branch and removed on revert"
      pattern: "has-motion"
    - from: "js/main.js IO reveal IIFE"
      to: "fallback path"
      via: "returns early when html.has-motion is set; otherwise behaves exactly as in ep2 (js-reveal)"
      pattern: "has-motion"
    - from: ".hero-word[data-words]"
      to: "cycle timeline"
      via: "main.js reads data-words, builds stacked .hero-word__alt spans with textContent, SplitText chars with mask, one repeat:-1 timeline"
      pattern: "data-words"
    - from: "css/styles.css :root --glow-hero-* tokens"
      to: "tools/check-contrast.js HERO group"
      via: "stacked worst-case composite over the hero base, text pairs checked at 4.5:1"
      pattern: "glow-hero"
---

<objective>
Make Home impressive at first look and while scrolling, and keep it warm and local. Three parts:
1. Redesign the hero: near full-viewport height, a much bigger headline, drifting colour fields, a masked photo with a frame and proof chips, and a scroll cue. Implement the Phase 3 kinetic headline "Marketing for your [word]" with GSAP SplitText. It must meet HERO-01..HERO-06 in full.
2. Give every Home section its own scroll-linked entrance with ScrollTrigger, and scale everything up.
3. Prove it with extended guards and before/after screenshots.

Purpose: The user said the ep2 pass was too subtle. They want the page to "impress upon a look" and the hero to change. Pulling Phase 3 forward lets this task close HERO-01..HERO-06.

Output: Vendored GSAP 3.15.0 with SplitText and ScrollTrigger; a redesigned hero and section motion in index.html, css/styles.css and js/main.js; new and updated guards; REPLACE-ME rows; a UI-SPEC amendment; and a SUMMARY with `requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06]` and evidence for each.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/quick/261013-ep2-polished-sleek-restyle-of-home-page-plus/261013-ep2-SUMMARY.md
@index.html
@css/styles.css
@js/main.js
@tools/check-home.js
@tools/check-design-system.js
@tools/home-browser-test.js
@tools/motion-browser-test.js
@tools/check-contrast.js

<scratchpad>
SCRATCH=/private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad
Reference for "bolder than": $SCRATCH/home-sleek-1280.png and $SCRATCH/home-sleek-375.png (ep2 result).
The planner already ran `npm pack gsap@3.15.0` in $SCRATCH/gsap-probe/ and extracted it to $SCRATCH/gsap-probe/x/package/.
- Tarball shasum: 7851baaffc77642f2db3b1749d3634f9b5a19d14. This matches `npm view gsap@3.15.0 dist.shasum`.
- dist sizes: gsap.min.js 72,927 B; ScrollTrigger.min.js 44,575 B; SplitText.min.js 7,732 B.
- Each file has a `/*! GSAP|ScrollTrigger|SplitText 3.15.0 ... Subject to the terms at https://gsap.com/standard-license */` header.
- There is no LICENSE file. package.json has license "Standard 'no charge' license: https://gsap.com/standard-license."
- README section "GSAP is FREE!" says: "the entire GSAP toolset is FREE, even for commercial use", including SplitText.
- The planner checked all three files against tools/check-portability.js. They contain no fetch(, import(, XMLHttpRequest or blocked hosts. SplitText.min.js contains `innerHTML` internally. That is fine: the "no innerHTML" rule applies to OUR code (js/main.js), not vendored code.
</scratchpad>

<interfaces>
Current hero h1 (check-home HERO_H1 enforces it byte for byte today):
  <h1 class="hero-title">Marketing for your <span class="hero-word accent-underline"><span class="hero-word__text">bakery</span><svg class="accent-underline__svg" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M2 7 C 22 3, 40 10, 62 6 S 104 4, 126 8 S 170 4, 198 6"/></svg></span></h1>

NEW hero h1. Use this exact string. It becomes the new HERO_H1 in tools/check-home.js:
  <h1 class="hero-title"><span class="visually-hidden">Marketing for your bakery, café, salon, gym, florist, shop or restaurant</span><span class="hero-title__visual" aria-hidden="true"><span class="hero-title__lead">Marketing for your</span> <span class="hero-word accent-underline" data-words="bakery,café,salon,gym,florist,shop,restaurant"><span class="hero-word__text">bakery</span><svg class="accent-underline__svg" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M2 7 C 22 3, 40 10, 62 6 S 104 4, 126 8 S 170 4, 198 6"/></svg></span></span></h1>
Why this shape:
- The visually-hidden sentence is the single headline screen readers hear (HERO-05).
- `.hero-title__visual` is aria-hidden, so cycling is never announced.
- `.hero-title__lead` lets SplitText split the lead words without touching the word slot.
- `.hero-word__text` stays the first child, as check-design-system requires. The svg is unchanged, as home-browser-test UNDERLINE requires.
- The word order matches styleguide.html data-words, which check-design-system enforces.

Pause control. Put it in the hero, outside `#hero-cta` and outside the h1, e.g. at the end of `.hero__text` or anchored to the hero bottom:
  <button class="hero-toggle" type="button" aria-pressed="false" hidden><svg class="icon" ... aria-hidden="true" focusable="false">pause/play glyph</svg><span class="hero-toggle__label">Pause animation</span></button>
- JS removes `hidden` only when cycling actually starts.
- ONE state signal (revision 1, item 4): the label text stays fixed as "Pause animation" and only aria-pressed toggles ("true" = paused). The pause/play glyph swap is purely visual, done in CSS via `[aria-pressed="true"]` (two aria-hidden paths toggled with display). Do not swap the label text.
- No-JS and reduced motion leave it hidden.

Test hooks main.js must maintain on `.hero-word` (read by the tests; never shown to users):
- data-state="playing" or "paused"
- data-current="<index of visible word>"
- data-paused-by="user hover focus hidden offscreen" (space-separated active reasons, empty when playing)

Existing guard constraints that still bind (read from the tools):
- check-design-system:
  - No colour literals outside :root.
  - Forbidden words anywhere in CSS: blob, noise, grain, feTurbulence, italic.
  - font-size and font-weight only via var(--fs-*) and var(--fw-*); no font shorthand.
  - var(--color-blue) is allowed only in the whitelisted selectors. New selectors use :root tokens defined from the palette instead. Extend BLUE_ALLOWED only deliberately, with a one-line comment and a SUMMARY note.
  - No style= in HTML source. Runtime element.style is fine.
  - SHELL:HEADER and SHELL:FOOTER stay identical across both pages. Do not edit them.
  - No straight apostrophes in visible text.
  - Exactly one .accent-underline on index.html.
  - Squiggle budget is 2 (divider-squiggle plus steps__connector). Do not add squiggle-class elements.
- check-home exact strings that must stay:
  - Lede `<p class="hero__lede">I’m Sam, ...</p>`
  - `#hero-cta` with `class="btn btn--primary" href="contact.html">Let’s talk</a>` and the link-cta
  - The trust-cue text
  - hero__media img with width=800, height=1000, decoding=async, referrerpolicy, no loading attribute, and alt containing "A smiling shop owner at a counter"
  - `<figure class="card card--white testimonial"` (wrapping the figure in a div is allowed)
  - `<ul class="logo-strip">` with exactly 6 li in source
  - `<p id="logos-title" class="logo-strip__caption">`
  - Section order, exactly 2 section--tint (#services, #kind-words), cta-band once, exactly 4 "Let’s talk" links, and sticky-cta as the last element before </body>
- check-portability: every `<script src>` needs defer; no type=module, fetch(, import( or XMLHttpRequest in js/ or assets/js/; no CDN hosts.
- home-browser-test:
  - At 320, h1 < lede < CTA < trust-cue top order, and the photo below the trust cue.
  - At 1024 and 1280, the photo sits beside the text (mediaLeft >= textRight) and "restaurant" fits the text column on one line.
  - Underline stroke-width 4, non-scaling-stroke, and the underline clears descenders.
  - Steps connector display:none below 1024.
  - 768: 2 card columns. 1280: 3 testimonials and 3 steps share a top.
  - 320: logo svg at least 120px wide with text at least 12px effective.
- motion-browser-test TARGETS list mirrors main.js REVEAL_TARGETS. settled() means opacity 1, translation under 0.5px and scale 1.
- font-metrics-test caps --fs-display at 80px at 1440 (two places, lines ~120 and ~138).
- check-contrast parses `--glow-*` and `--surface-glass*` rgba tokens in :root (regex trRe) and composites them over navy, white and tint.
</interfaces>

<design_direction>
Applies to all tasks. Specific values are the executor's call. Iterate on screenshots.
- Keep the palette (blue #3B5BFD, coral #FF6B6B, navy, tint, ink) and the fonts (Fraunces 600, Figtree 400/600). Use them boldly. The mood is "a confident, warm local person", not a neon tech startup. Use generous radii, warm coral accents and soft depth.
- Size scale-up through tokens only:
  - Raise --fs-display substantially, about clamp(3rem, 1.6rem + 6.2vw, 7.25rem) as a starting point. The cap is ~116px.
  - Raise --fs-heading, about clamp(2rem, 1.2rem + 2.6vw, 3.25rem).
  - Raise section padding (--space-3xl or section tokens), card padding, icon tiles, step badge size and photo sizes.
  - Constraints: "restaurant" must fit its slot on one line at 320 (about 288px usable), 1024 and 1280. Exactly 4 font-size tokens stay. Decorative giant type uses --fs-display plus transform: scale, not a new size token.
- Motion feel:
  - Distances 24 to 80px, rotations of 6 degrees or less, scales 0.9 to 1.12.
  - Eases: expo.out or power3.out for entrances, back.out(1.6) for pops.
  - Scrub uses `scrub: 0.6` (smoothed, not 1:1 jitter).
  - No pinning, no scroll-snap, no ScrollSmoother, no wheel or touch listeners, no scrollTo.
  - Animate only transform, opacity, clip-path (one-shot only, never scrubbed) and stroke-dashoffset. No background-position animation and no `filter` (blur or otherwise) on any animated element (revision 1, item 3). Decor drift and sweeps are transforms of pre-painted gradient layers.
- Never let CSS transitions or animations and GSAP drive transform on the same element. Either:
  - GSAP animates a wrapper, or
  - one-shot entrances end with clearProps:"transform,opacity" so CSS hover lifts work afterwards (add an `.is-animating` class that sets transition:none while the entrance runs).
  The ep2 CSS idle float on `.hero__media .media` and `.about__media .media` must not run on an element GSAP transforms. Drop the float under html.has-motion, or move it to a wrapper.
- Any section with a horizontal entrance (testimonials from the sides, marquee) gets `overflow-x: clip` on the section (clip, not hidden, so sticky still works). No horizontal overflow at 320 while scrolling.
- Moving content that lasts more than 5s (WCAG 2.2.2) must be pausable:
  - The hero colour-field drift, chip bob and scroll-cue bounce all stop with the same hero toggle (class `.hero.is-paused` sets animation-play-state: paused, and GSAP tweens pause).
  - The logo ticker is scroll-linked (moves only while the user scrolls), so it never auto-moves.
</design_direction>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Vendor GSAP 3.15.0, write the RED guards for the hero and choreography, capture before shots</name>
  <files>assets/js/vendor/gsap.min.js, assets/js/vendor/SplitText.min.js, assets/js/vendor/ScrollTrigger.min.js, assets/js/vendor/GSAP-VERSION.md, tools/check-home.js, tools/check-contrast.js, tools/home-browser-test.js, tools/motion-browser-test.js</files>
  <action>
**A. Vendor.**
- In a NEW empty dir $SCRATCH/gsap-vendor, run `npm pack gsap@3.15.0` (or reuse $SCRATCH/gsap-probe/gsap-3.15.0.tgz).
- Confirm `shasum` equals `npm view gsap@3.15.0 dist.shasum` (7851baaffc77642f2db3b1749d3634f9b5a19d14).
- Extract with tar into its own subdir. Copy package/dist/gsap.min.js, SplitText.min.js and ScrollTrigger.min.js byte for byte into assets/js/vendor/. Do not run anything from inside the extracted folder.
- Write assets/js/vendor/GSAP-VERSION.md with:
  - package gsap@3.15.0, tarball shasum, source path, date
  - the license summary: the `/*! ... Subject to the terms at https://gsap.com/standard-license */` header, the package.json license string, and the README "GSAP is FREE ... even for commercial use" sentence quoted verbatim
- Do NOT edit index.html yet. Task 2 adds the script tags.

**B. RED static guards in tools/check-home.js.**
1. Replace the HERO_H1 constant with the NEW h1 string from <interfaces>. Add a comment saying it changed in quick 261013-ffc for HERO-05 (SR sentence plus aria-hidden visual line).
2. Add a `vendor` group (included in the default run). It asserts:
   - the three vendor files exist, and each starts with its `3.15.0` banner;
   - assets/js/vendor/GSAP-VERSION.md exists and mentions 3.15.0 and standard-license;
   - index.html has `<script defer src="assets/js/vendor/gsap.min.js"></script>`, then ScrollTrigger, then SplitText, then `js/main.js`, in that order, all inside head;
   - index.html has an HTML comment pinning "GSAP 3.15.0";
   - contact.html does NOT load the vendor files. Contact keeps the IO fallback, so its form and tests are untouched.
   - index.html head contains exactly one inline classic `<script>` (no src) BEFORE the stylesheet link. It must contain `motion-pending`, `prefers-reduced-motion` and `2500`, and must not contain `innerHTML`, `fetch` or `import`.
   - Guard decision (revision 1, item 7): no current guard forbids inline scripts. check-portability only inspects `<script src>`, and check-design-system strips `<script>` blocks before its apostrophe scan. So no guard is loosened. This check-home assertion pins the inline script's shape instead. Note this in the SUMMARY.
3. Extend the `hero` group:
   - exactly one `<button class="hero-toggle" type="button" aria-pressed="false" hidden>` exists in section.hero, outside #hero-cta;
   - `.hero-word` has the data-words list `bakery,café,salon,gym,florist,shop,restaurant`;
   - at least two `.hero-chip` proof chips exist in hero__media;
   - a `.hero-scroll-cue` element exists with aria-hidden="true".
4. Extend the `replace` group so REPLACE-ME.md must list each proof-chip text. Read the chip texts from index.html at runtime, i.e. textOf each .hero-chip, so the copy stays the executor's choice.

**C. RED contrast in tools/check-contrast.js.** Add a HERO group:
- Require at least two `--glow-hero-*` rgba tokens in :root. The existing trRe already parses `--glow*`, so they are also checked over navy, white and tint by the existing loop. Confirm the existing glow loop's fg lists fit these tokens.
- Composite ALL `--glow-hero-*` tokens stacked (worst-case overlap) over --color-tint AND over --color-bg.
- Check ink, ink-soft and blue at >= 4.5 against both composites. These are the hero headline, lede and link-cta.
- If the hero uses a chip surface token (`--surface-glass*` or `--surface-chip`), check ink on the chip surface composited over the worst-case field.
- Print PASS lines. Today this must FAIL with "glow-hero token missing".

**D. RED browser tests in tools/home-browser-test.js.**
- Change scenario() to accept an opts object `{ noJs, reducedMotion }`, keeping boolean compatibility. reducedMotion uses `Emulation.setEmulatedMedia` features prefers-reduced-motion=reduce.
- Run HERO_WIDE and UNDERLINE under reducedMotion so the static word is measured, not a mid-cycle slot. Note why in a comment.
- Update NOJS:
  - the visible headline = textContent of `.hero-title__visual` normalised, === "Marketing for your bakery";
  - the `.hero-title .visually-hidden` text === "Marketing for your bakery, café, salon, gym, florist, shop or restaurant";
  - `.hero-toggle` has the hidden attribute.
- Add a `cycle` group (in ALL):
  - (a) At 1280x900, 375x740 AND 320x700 with JS: the html has `has-motion`, `.hero-toggle` is visible (not hidden), and `document.documentElement.scrollWidth - innerWidth` is 0 at every sample (no overflow in motion mode at 320).
    - Observe `.hero-word` data-current over up to 9s and see at least 3 distinct indexes.
    - Sample getBoundingClientRect of h1, .hero__lede, #hero-cta and .trust-cue every 100ms across those changes. Max delta per edge must be <= 1px (HERO-02).
    - Also at 768x900, require 2 distinct words with the same <= 1px rule.
    - Install `new PerformanceObserver(...).observe({type:'layout-shift', buffered:false})` before sampling. The summed value of entries without hadRecentInput must be < 0.001 (HERO-02/06).
    - The `.hero-word` box right edge must be <= the `.hero__text` right edge + 0.5 (at 320 also <= innerWidth), and its width must stay constant (slot reserved).
    - Underline never flashes wide: from the first frame after `.hero-word__alt` elements exist, the underline svg's rendered width (getBoundingClientRect) must be <= the active word's width + 2px. Poll each rAF for the first 1s after has-motion appears.
    - Hold-point truth (revision 1, item 5). Do not trust data-current alone. At each hold point (about 900ms after data-current changes), the active word element is `.hero-word__text` for index 0 and the (i-1)th `.hero-word__alt` otherwise, and:
      - its text, ignoring split wrappers, equals data-words[current];
      - its rect is non-zero;
      - every char has computed opacity >= 0.99 and translateY within 1px of 0;
      - every other word has opacity 0 or all its chars translated fully outside their mask box.
    - Descenders and accents are not clipped. For "gym", "shop" and "café", while each is the active word, measure ink with canvas measureText (actualBoundingBoxDescent and actualBoundingBoxAscent, baseline derived as in the UNDERLINE snippet). Each SplitText mask wrapper's rect bottom must be >= ink bottom - 0.5, and its top <= ink top + 0.5. The CSS fixes this with padding-block on the mask wrappers offset by a negative margin, so line height does not change.
    - Frame time (HERO-06, revision 1, item 3). At 375 only, record requestAnimationFrame deltas for about 2s while the cycle runs. p95 must be <= 50ms. The threshold is deliberately lenient because headless Chrome without a GPU is noisy; it catches gross jank (layout thrash, blur repaint), not 60fps. Document this in a comment and report the measured p95 in the SUMMARY.
  - (b) Style audit for HERO-06: attach a MutationObserver on attribute `style` of all elements inside `.hero-word` during 4s of cycling. Collect every inline property name set. Allowed set: transform, translate, rotate, scale, opacity, visibility, will-change, transform-origin, and any `--*` custom property. Anything else fails, e.g. width, top or left.
  - (c) Pause:
    - click `.hero-toggle`: aria-pressed becomes "true", data-state becomes "paused", and the label text is still exactly "Pause animation" (fixed label, revision 1, item 4);
    - data-current is unchanged over 3s;
    - click again and data-current changes within 4s.
    - Then dispatch `new PointerEvent('pointerenter',{pointerType:'mouse'})` on `.hero-title` and expect data-state paused with paused-by containing hover. Dispatch pointerleave (mouse) and expect playing. Run this sub-check at 1280 only, where (hover: hover) matches in headless.
    - Touch tap (revision 1, item 2). Run a separate 375x740 scenario with `mobile: true` and `Emulation.setTouchEmulationEnabled({enabled:true, maxTouchPoints:5})`. Extend scenario() with an optional `between` hook: node-side CDP steps that run between two in-page evaluations. The first evaluation returns the h1 centre. Then send `Input.dispatchTouchEvent` touchStart and touchEnd at that point. Wait 800ms, then evaluate again. Expect: paused-by does not contain hover, data-state is "playing", aria-pressed is "false" and the label still reads "Pause animation". A tap must never leave the cycle stuck paused while the button says Pause.
    - Focus the hero primary CTA, expect paused (focus); blur, expect playing.
    - Override document.hidden and visibilityState to hidden via Object.defineProperty, dispatch visibilitychange, expect paused (hidden); restore and dispatch again, expect playing.
    - scrollTo past the hero bottom + 200, wait 400ms, expect paused (offscreen); scroll back to 0, expect playing.
  - (d) aria: `.hero-title__visual` has aria-hidden="true". Every `.hero-word__alt` is inside it. The h1 has exactly one `.visually-hidden` child.
  - (e) reducedMotion at 375 and 1280: no has-motion, no motion-pending, the toggle stays hidden, no `.hero-word__alt` elements, and the word stays "bakery" over 4s.
  - (f) motion-pending lifecycle (revision 1, item 7):
    - With JS at 1280: once has-motion is present, motion-pending is gone.
    - With blockGsap (add the same opts.blockGsap support used in motion-browser-test): motion-pending is removed and has-motion is absent within 3s.
    - With JS disabled: the inline script does not run, so neither class is present and the html keeps no-js.
- The cycle group is RED now.

**E. RED in tools/motion-browser-test.js.**
- Extend scenario opts:
  - `blockGsap`: before navigate, use Page.addScriptToEvaluateOnNewDocument with source `Object.defineProperty(window,'gsap',{configurable:false,get:function(){return undefined},set:function(){}})`. This makes the vendor file unable to publish window.gsap. If the GSAP UMD throws in strict mode, that is expected in this scenario only.
  - `captureErrors`: Runtime.enable plus Log.enable on the session. Collect Runtime.exceptionThrown, console errors (Runtime.consoleAPICalled type error) and Log.entryAdded level error, but IGNORE network entries for remote https images (source "network"). Unsplash can be offline.
  - Route session events through onMessage. It currently handles responses only, so add an events map keyed by sessionId.
- Add the TARGETS hidden-check list `CONTENT` for the bold page: TARGETS plus `.hero-title__lead`, `.hero__lede`, `#hero-cta`, `.trust-cue`, `.hero-chip`, `.section-head h2`, `.about__media .media`, `.cta-band`. Add a helper `clipClear(el)`: computed clipPath is 'none', or an inset() whose lengths are all 0.
- New groups (run by default):
  - `vendor`: on index.html over file://, `gsap.version==='3.15.0'`, typeof ScrollTrigger and SplitText are 'function' or 'object', and html.has-motion is set at 1280.
  - `choreo` at 1280x900 and 375x740:
    - html has has-motion and NOT js-reveal.
    - At load, at least 3 CONTENT elements below the fold are not settled (pre-states active).
    - Step-scroll from 0 to scrollHeight in 0.4*innerHeight steps with 120ms waits.
    - Mid-way, when `.steps__connector` is shown (1280 only) and its top is in the viewport middle, its stroke-dashoffset is strictly between 0 and the full length. This proves scrub.
    - The ticker track transform differs between two scroll positions inside the logos section.
    - At the bottom (finish with a programmatic `scrollTo(0, document.documentElement.scrollHeight)`), wait 1500ms. Every shown CONTENT element must be settled with clipClear, every draw path drawn, and the layout-shift sum during the run < 0.001.
  - `choreo-jump` at 1280x900 and 375x740 (revision 1, item 1). Load, wait for has-motion, then jump straight to the bottom with one programmatic `scrollTo(0, scrollHeight)` and no stepping. Wait 2000ms. Every shown CONTENT element on the page, above and in the viewport, must be settled with clipClear. This proves one-shot triggers that were skipped over, or that sit near the page end, still fire, and that the scrollEnd and bottom safety nets work.
  - `frames` at 375x740 (revision 1, item 3). With has-motion, record rAF deltas for about 2s while a rAF loop scrolls the page 24px per frame through the services, about and testimonials region. p95 must be <= 50ms. Use the same lenient headless threshold and comment as the cycle frame check, and report the measured p95 in the SUMMARY.
  - `fallback` with blockGsap at 1280 and 375 (also assert motion-pending is removed and nothing stays hidden): the old reveal assertions (js-reveal present, no has-motion, targets reveal and settle when scrolled in, strokes drawn, underline gate). Move the existing reveal body here, and drop `reveal` from the default list, or alias it to fallback.
  - `console`: captureErrors on index.html at 1280 and 375 with a full scroll-through, and on contact.html at 1280. Zero errors.
- Extend `nojs` and `reduced`:
  - all CONTENT settled and clipClear;
  - no has-motion;
  - no element with class `logo-strip--clone`;
  - hero word "bakery" and no `.hero-word__alt`.
- Keep `overflow`, but add 768x900 to its widths.

**F. Before shots.** Write a reusable screenshot script at $SCRATCH/shoot.js (NOT in the repo). Reuse the CDP spawn+kill pattern from tools/motion-browser-test.js.
- Arguments: page, width, height, out path, and a mode of `first`, `full` or `mid:<fraction>`.
- `full` steps through the page to the bottom, waits 1.5s, then sets the device metrics height to scrollHeight and captures.
- `mid` scrolls to fraction*scrollHeight and waits 700ms.
- Capture index.html before any change: $SCRATCH/home-bold-before-1280.png and $SCRATCH/home-bold-before-375.png (first view).

Run everything once and record the RED output for the SUMMARY.
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && head -c 200 assets/js/vendor/gsap.min.js | grep -q "GSAP 3.15.0" && head -c 200 assets/js/vendor/ScrollTrigger.min.js | grep -q "ScrollTrigger 3.15.0" && head -c 200 assets/js/vendor/SplitText.min.js | grep -q "SplitText 3.15.0" && grep -q "standard-license" assets/js/vendor/GSAP-VERSION.md && node tools/check-portability.js && for f in tools/check-home.js tools/check-contrast.js tools/home-browser-test.js tools/motion-browser-test.js; do node --check $f || exit 1; done && (node tools/check-home.js hero vendor; test $? -ne 0) && (node tools/check-contrast.js; test $? -ne 0) && (node tools/home-browser-test.js cycle; test $? -ne 0) && (node tools/motion-browser-test.js choreo choreo-jump vendor; test $? -ne 0) && node tools/motion-browser-test.js fallback nojs reduced overflow header contact && ls /private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad/home-bold-before-1280.png /private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad/home-bold-before-375.png</automated>
  </verify>
  <done>
- The three vendor files are byte-identical to the npm 3.15.0 dist, and portability still passes.
- The new guards fail for the right reasons: new HERO_H1 and vendor tags missing, glow-hero tokens missing, no has-motion or cycling, no choreo.
- The rewritten `fallback` group and the unchanged-behaviour groups (nojs, reduced, overflow, header, contact) pass against today's page, proving the harness changes are sound.
- Before shots exist and the RED output is recorded.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Bold hero redesign and accessible kinetic headline (HERO-01..HERO-06)</name>
  <files>index.html, css/styles.css, js/main.js, REPLACE-ME.md, tools/font-metrics-test.js, .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md</files>
  <behavior>
    - check-home hero, vendor and replace pass with the new h1, toggle, chips, scroll cue and vendor tags
    - home-browser-test cycle passes: at least 3 words cycle at 320/375/768/1280, edges stay within 1px, layout-shift < 0.001, hold-point truth and descender checks pass, underline never flashes wide, style audit is transform/opacity only, p95 frame <= 50ms at 375, pause/mouse-hover/focus/hidden/off-screen all pause and resume, a touch tap does not stick, aria correct, reduced motion is static, motion-pending lifecycle correct
    - home-browser-test hero/nojs pass: 320 stacked order, photo beside text at 1024/1280, restaurant fits, underline clears descenders, no-JS headline "Marketing for your bakery"
    - motion-browser-test vendor passes, and check-contrast HERO passes
  </behavior>
  <action>
**index.html (hero only, plus head).**

Head:
- After the stylesheet link, add the HTML comment `<!-- GSAP 3.15.0 (+ScrollTrigger, SplitText) vendored from npm gsap@3.15.0 dist, see assets/js/vendor/GSAP-VERSION.md -->`.
- Then add `<script defer src="assets/js/vendor/gsap.min.js"></script>`, ScrollTrigger.min.js and SplitText.min.js, in that order, BEFORE the existing `<script defer src="js/main.js"></script>`. Move main.js after them if needed; portability requires that exact main.js tag string.
- Anti-flash inline script (revision 1, item 7). Place a tiny classic inline `<script>` in head BEFORE the stylesheet link, about 4 lines:
  - if `window.matchMedia` exists and `(prefers-reduced-motion: reduce)` does NOT match, add `motion-pending` to document.documentElement;
  - `setTimeout` 2500ms removes `motion-pending` (failsafe if main.js never runs).
  - No other logic. Use straight ASCII quotes inside the script only; check-design-system strips script blocks before its apostrophe scan.
- CSS contract for motion-pending: it must NEVER hide content on its own. The only rule keyed on it is `html.motion-pending .hero-word__alt { opacity: 0 }`, which is effectively a no-op guard for alts during their insertion frame. All real pre-states key off `html.has-motion` only.
- main.js: when GSAP is confirmed and the motion branch runs, swap motion-pending for has-motion in the same statement. On the reduce branch, missing GSAP, or the catch path, remove motion-pending.
- Residual flash risk: deferred main.js normally runs before first paint on this small page, and the hero entrance from-states are applied synchronously (see below), so any flash is at most one frame. Document this as accepted in the SUMMARY.

Hero:
- Replace the h1 with the NEW h1 from <interfaces>, character for character.
- Add the `.hero-toggle` button from <interfaces> with a small inline pause glyph. The play glyph is swapped by CSS via `[aria-pressed="true"]`, two paths toggled with display, no innerHTML.
- Add aria-hidden decor layers as the first children of section.hero: e.g. `<div class="hero__fields" aria-hidden="true"><span class="hero__field hero__field--blue"></span><span class="hero__field hero__field--coral"></span><span class="hero__field hero__field--navy"></span></div>`, plus a dot-grid layer. Never name anything "blob".
- In `.hero__media`, keep the existing img tag unchanged and wrap it as needed, e.g. `<div class="hero__frame">`. Add an aria-hidden accent frame or shape element, and two `.hero-chip` proof chips as real text with an aria-hidden star or pin svg icon. Suggested copy: "4.9 from local owners" with a star icon, and "Born and bred in Elmhollow" with a pin icon (consistent with the About copy). Use NO fabricated year, date or new number beyond the rating. The rating is a placeholder claim and must be listed in REPLACE-ME.md. Use curly apostrophes, and do not duplicate the trust-cue "40+" claim word for word.
- Add a `.hero-scroll-cue` (aria-hidden="true", a short line or mouse glyph plus the visible word "Scroll") at the bottom of the hero.
- Keep #hero-cta, the lede and the trust cue byte-identical. Do not touch the SHELL blocks.

**css/styles.css (hero).**
- Add :root tokens (literals only inside :root):
  - --glow-hero-blue, --glow-hero-coral and optionally --glow-hero-navy as rgba fields. Tune the alphas so the check-contrast HERO group passes with stacked fields. Saturated but translucent; start around .22 to .28 for blue and coral and lower if the check fails.
  - A dot colour token, chip surface/edge/shadow tokens, --hero-min-h, and drift durations.
  - Raise --fs-display (see design_direction).
- `.hero`:
  - min-height: var(--hero-min-h) with the svh value plus a vh fallback declared first, about calc(100svh - var(--header-h)) at >=1024 and auto or about 88svh below;
  - display grid with content centred vertically;
  - overflow-x: clip;
  - tint-to-white base gradient via a :root gradient token;
  - fields are large (40 to 70vmax) absolutely-positioned elements painted with soft radial-gradient(closest-side, field token, transparent-token) so the softness comes from the gradient itself. NO `filter: blur` (revision 1, item 3: blur on moving layers forces expensive repaints on phones). Add `will-change: transform` only on the drifting field layers;
  - dot grid via radial-gradient background-size on a pseudo-element, masked to fade out with mask-image linear-gradient.
- Drift keyframes animate ONLY transform (translate/scale/rotate) over 18 to 30s, alternate. They apply only under `html.has-motion` and `@media (prefers-reduced-motion: no-preference)`, and are paused by `.hero.is-paused`. Without has-motion the fields sit static, so no-JS still looks bold.
- `.hero-title`:
  - `.hero-title__visual` display block;
  - `.hero-title__lead` display block (the word gets its own line);
  - `.hero-word` display inline-grid, justify-items start, with `.hero-word__text` and `.hero-word__alt` all at grid-area 1/1. The slot width is the longest word's;
  - `.hero-word__alt` invisible without has-motion (they only exist with JS anyway);
  - keep the underline rules;
  - letter-spacing tighter for display.
- Photo:
  - large, rounded or arched mask (border-radius or clip-path token), aspect from width/height attrs;
  - accent frame offset behind (coral or blue tint, rotated about 3 degrees);
  - shadow token;
  - chips absolutely positioned overlapping the photo edges on >=640, and inside the media box on phones so there is no overflow at 320;
  - chips get a white or glass surface, ink text, --fs-label, and a shadow;
  - keep the photo column beside the text at >=1024 (span-5/span-7 or equivalent) so home-browser-test side-by-side still holds.
- `.hero-scroll-cue` bounce keyframe (transform only), gated the same as the drift.
- `.hero-toggle`:
  - a pill button, ink on white or chip surface, >=44px target, clear :focus-visible (focus ring tokens);
  - `[hidden]` must win (`.hero-toggle[hidden]{display:none}`);
  - do NOT use var(--color-blue) in it, or the whitelist fails.
- Under has-motion, remove the ep2 float animation from `.hero__media .media` (GSAP owns entrance transforms there).

**js/main.js: new Motion IIFE**, placed BEFORE the IO reveal IIFE.
- Guard: `if (!window.gsap || !window.ScrollTrigger || !window.SplitText) return;` then `gsap.registerPlugin(ScrollTrigger, SplitText)`.
- Define one `fail(err)` function: mm.revert(), remove has-motion and motion-pending, gsap.set on all touched elements with clearProps "all", leave everything visible, and call `console.warn` once (warn, not error, so the console test stays clean).
- Wrap the synchronous setup in try/catch calling fail. The async continuation after `document.fonts.ready` (the hero build, cycle and choreography that need measurements) MUST have its own try/catch calling the same fail, and the promise gets `.catch(fail)` too. A late exception must never leave pre-states applied.
- Use `var mm = gsap.matchMedia()` with conditions `{ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)", desktop: "(min-width: 1024px)" }`.
- Motion branch:
  - swap motion-pending for has-motion and return a cleanup that removes has-motion, removes the alt spans and hides the toggle again;
  - apply the hero entrance from-states synchronously, right here before any await, so the first paint after main.js already shows the pre-state and not a flash of the final layout. Text-only from-states that do not depend on font metrics can be set now; the underline starts with scaleX 0 until its length is measured;
  - after `document.fonts.ready` (with a 1500ms timeout race), build the hero.
- Hero entrance (one timeline, about 1.2s total):
  - SplitText `.hero-title__lead` by words with mask "words" rising (yPercent 110 to 0, stagger 0.06);
  - the word slot rises;
  - underline draws (stroke-dashoffset from the measured screen length; reuse the ep2 lengthOf logic, moving it into a shared helper inside main.js if needed; non-scaling stroke);
  - lede, CTA and trust cue fade up 24px;
  - photo un-masks (clip-path inset to 0 on the frame wrapper, scale 1.08 to 1 on the img wrapper);
  - chips pop with back.out;
  - the cycle starts at the end.
- Kinetic cycle (HERO-01/02):
  - Read data-words.
  - For each word after the first, create `span.hero-word__alt` with textContent and append it inside `.hero-word` before the svg. No innerHTML. Build the alts off-screen in a DocumentFragment, measure the word widths, and in the SAME synchronous block insert them, gsap.set their chars to the hidden state, and gsap.set the underline scaleX to width_0 / slotWidth. That way no frame ever paints the underline at "restaurant" width (revision 1, item 6).
  - SplitText every word span with `{ type: "chars", mask: "chars", aria: "none" }` (the parent is aria-hidden; aria:"none" prevents SplitText adding labels).
  - Build ONE `gsap.timeline({ repeat: -1 })`. For each word i:
    - chars in: yPercent 120 to 0 and rotate 8 to 0, stagger 0.03, 0.6s expo.out;
    - the underline scaleX to (width_i / slotWidth), transform-origin left, measured once after fonts.ready (the ratio is font-size independent), 0.5s;
    - hold 1.8s;
    - chars out: yPercent 0 to -120, stagger 0.02, 0.4s power2.in;
    - set data-current at the swap point via tl.call.
  - The first word starts visible. Only transform and opacity ever change.
  - On resize, ScrollTrigger refresh or a debounced re-measure keeps the underline ratios correct.
- Pause model (HERO-03):
  - `var reasons = {}`, with setReason(name, on). The cycle timeline AND any hero ambient tweens pause when any reason is active.
  - Toggle `.hero.is-paused` for the CSS drift, chip bob and cue.
  - Update data-state and data-paused-by.
  - Reasons:
    - user: toggle button click flips it. Only aria-pressed changes; the label text stays "Pause animation" (revision 1, item 4);
    - hover: pointerenter/pointerleave on `.hero-title`, honoured ONLY when `event.pointerType === "mouse"` AND `matchMedia("(hover: hover)").matches`. Touch and pen taps never set the hover reason, so a tap cannot leave the cycle stuck paused (revision 1, item 2). Also clear the hover reason on pointercancel;
    - focus: focusin/focusout on section.hero, checking relatedTarget containment, but NOT when the focused element is the toggle itself, so keyboard users can press it;
    - hidden: document visibilitychange reading document.hidden;
    - offscreen: `ScrollTrigger.create({ trigger: ".hero", start: "top top-=1", end: "bottom top", onToggle })`, or an IntersectionObserver on the hero with threshold 0. Paused when not intersecting.
  - Remove `hidden` from `.hero-toggle` only once the cycle starts.
- Reduce branch: do nothing. The page stays static, the toggle stays hidden and no alts exist (HERO-04).
- No-JS: markup already shows "Marketing for your bakery" (HERO-04).

**js/main.js IO reveal IIFE:**
- First line after "use strict": `if (document.documentElement.classList.contains("has-motion")) return;`
- The draw IIFE already bails without js-reveal. Leave the header and sticky IIFEs unchanged.
- No fetch, import, innerHTML or modules.

**tools/font-metrics-test.js:** raise both 80px caps (lines ~120 and ~138) to the new --fs-display maximum in px, rounded up. Add a comment citing quick 261013-ffc ("user asked for a much bigger hero headline").

**REPLACE-ME.md:** under "## Numbers and claims", add one row per proof-chip text with location `index.html .hero-chip`; mark the rating as a placeholder claim to verify. Under "## Copy blocks", add rows for the SR headline sentence and the toggle label.

**UI-SPEC amendment (moved here from Task 3, revision 1, item 8).** Append `## Amendment: quick task 261013-ffc (2026-10-13)` to .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md. Cover:
- the hero layout: fields (soft gradients, no blur), dot grid, masked photo, frame, chips, scroll cue, toggle;
- the kinetic headline contract: word list, grid-stack slot, timings, pause reasons including the mouse-only hover rule, the fixed-label toggle with aria-pressed, the SR sentence;
- the new tokens;
- the motion system rules as written in this plan:
  - the motion-pending to has-motion gate and the inline head script;
  - the matchMedia branches;
  - one-shot entrances using a clamp() start, versus scrub for transforms only;
  - clip-path reveals one-shot only;
  - the clamp end rule;
  - parallax only on decor;
  - the ticker scroll-linked for WCAG 2.2.2;
  - the safety nets (load, scrollEnd, bottom, 4s);
  - the fallback order: GSAP, then IO reveals, then static;
- the size scale-up;
- divergences from the Phase 2 spec. The photo frame, shadow and chips intentionally supersede "photo is supportive, no frame"; the user asked for a dramatic presentation.
Task 3 only appends a short "Final values" list if its tuning changed anything stated here.

**Iterate (budget: at most 2 screenshot-and-adjust rounds in this task).**
- Run `node $SCRATCH/shoot.js index.html 1280 900 $SCRATCH/home-bold-hero-1280.png first`, and the same at 375x740. VIEW both PNGs with the Read tool.
- Compare against home-sleek-1280.png and home-bold-before-1280.png. If the hero is not clearly bolder (bigger type, a visible colour-field presence, a dramatic photo), adjust and reshoot. Fields that are too faint or a headline that is too small are the usual failures.
- Also confirm in a mid-cycle shot (mode `first` after 2.5s) that the swapped word renders crisply in its slot.
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/check-portability.js && node tools/check-design-system.js && node tools/check-contrast.js && node tools/check-home.js && node tools/font-metrics-test.js && node tools/smoke-test.js && node tools/home-browser-test.js && node tools/motion-browser-test.js vendor fallback nojs reduced overflow header contact console && ! grep -nE "innerHTML|fetch\(|^\s*import |type=.module" js/main.js && ! grep -nE "filter: *blur" css/styles.css && grep -q "Amendment: quick task 261013-ffc" .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md && ls /private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad/home-bold-hero-1280.png /private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad/home-bold-hero-375.png</automated>
  </verify>
  <done>
- The hero is visibly bold at 1280 and 375 (shots viewed and iterated).
- The headline cycles all seven words with a masked per-letter transition, keeping a reserved slot and zero layout shift.
- The pause toggle, hover, focus, hidden and off-screen pauses all work and are tested.
- Reduced motion and no-JS give a static complete headline. Screen readers get one sentence.
- All guards listed in verify are green. (choreo may still be RED until Task 3; it is not in this verify list.)
  </done>
</task>

<task type="auto">
  <name>Task 3: Scroll choreography for every section, bigger scale, after shots and docs</name>
  <files>index.html, css/styles.css, js/main.js, tools/motion-browser-test.js, REPLACE-ME.md, .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md</files>
  <action>
**Scale-up (CSS, tokens only).**
- Raise --fs-heading and section padding.
- Make service cards larger, with bigger icon tiles (about 64 to 72px) and more padding. Keep 2 columns at 768 and 4 or 2x2 at 1280; home-browser-test only checks 2 columns at 768.
- Enlarge the About photo (span-6 or a larger aspect), the step badges (about 72 to 88px), testimonial cards (bigger quote type is allowed only via existing tokens, e.g. --fs-heading for the quote mark decor) and band padding.
- The navy band gets a big headline. The h2 there may use --fs-display. Coral "busy" must keep 4.5:1, which already holds (coral/navy 5.12).
- index.html may gain aria-hidden decor elements only: e.g. a `.deco` giant "Elmhollow" word behind #about, rings or shapes in #services and #kind-words, and a ticker track wrapper. Keep every check-home exact string, the section order, the 6 source logo li and the 2 tint sections. Contact.html stays unedited.

**js/main.js choreography**, inside the same motion matchMedia branch, after the hero. All sections share these rules:
- One-shot entrances use `scrollTrigger: { trigger, start: "clamp(top 82%)", once: true }` (revision 1, item 1: clamp() keeps the start reachable for elements near the page end) and `clearProps:"transform,opacity"` on complete, with `.is-animating` set for the duration. Keep every one-shot ScrollTrigger in an array for the safety net.
- Scrubbed content tweens animate transforms only (never clip-path) and use `scrub: 0.6` with `end: "clamp(top 60%)"`. The clamp() syntax keeps the end reachable at page bottom, and progress is 1 whenever the element is centred. Content must reach identity at progress 1.
- Parallax is ONLY on aria-hidden `.deco` or field elements (yPercent or y within ±60px, `scrub: true`). Never on content.

Per section:
- **Section heads:** the h2 splits by words with mask "words" and rises with stagger 0.05. Revert the SplitText on complete (split.revert()) so the text returns to plain DOM.
- **Services:** the li wrappers cascade (y 64 to 0, rotate 2 to 0, opacity, stagger 0.1, expo.out). Each icon path draws with stroke-dashoffset from its measured length, staggered after its card. The tile pops (scale 0.6 to 1, back.out). Hover lift stays CSS on `.service-card`, so the li is animated, not the card.
- **About:** the media wrapper un-masks ONE-SHOT, from clip-path inset(12% 12% 12% 12% round radius) to inset(0 round radius), 1.1s expo.out, with clearProps "clipPath" after. The img wrapper scale goes 1.15 to 1 (scrubbed, transform only). Text children slide x 48 to 0 with stagger (one-shot). The `.deco` giant word parallaxes.
- **Testimonials:** wrap each figure in a div if needed (check-home allows it; the layout test reads `.testimonial` tops). Odd cards come from x -64 and even from +64, with rotate ∓3 to 0 and opacity (one-shot, stagger 0.12), and clearProps after. The section has overflow-x: clip.
- **Logos ticker (motion branch only):**
  - JS wraps `ul.logo-strip` in a `.logo-ticker` track div.
  - It clones the ul (cloneNode(true)), sets aria-hidden="true" plus class `logo-strip--clone` on the clone, removes role and aria-label from the clone's svgs, and strips every `id` attribute inside the clone (`querySelectorAll("[id]")` then removeAttribute), so there are never duplicate ids.
  - Track CSS: display flex, no wrap, width max-content. `.logo-strip` becomes a row under `html.has-motion` only; logo svgs keep >=120px width and the 180 viewBox.
  - Track xPercent moves with ScrollTrigger scrub over the section's pass (e.g. 0 to -35, so it never runs out of logos). The direction is tied to scroll; it never auto-moves.
  - Edge fade via mask-image on the wrapper. The section has overflow-x: clip.
  - The cleanup in the mm branch removes the clone and unwraps. Without has-motion, the ep2 grid stays.
- **Steps (desktop condition):**
  - The `.steps__connector` path stroke-dashoffset goes from length to 0, scrubbed from the steps-wrap "top 75%" to "clamp(bottom 55%)".
  - Badges pop (scale 0.3 to 1, back.out(2)) one-shot as each step enters. Step text rises.
  - Mobile condition: no connector (it is display:none); steps rise one-shot.
- **Navy band:** the section's inner surface goes from clip-path inset(6% 4% round 40px) to inset(0 round 0) ONE-SHOT (start "clamp(top 85%)", 1.1s expo.out, clearProps "clipPath" after), while its scale goes 0.94 to 1 scrubbed to "clamp(top 50%)" (transform only). A `.cta-band__sweep` aria-hidden pseudo or element runs a glow sweep: an xPercent -100 to 200 translate of a soft gradient token, one-shot when the band enters. The big headline splits by words and rises. The coral "busy" gets a small scale pop.
- **Decor parallax:** `.deco` elements and section field shapes use yPercent drift on scrub. Keep them aria-hidden, pointer-events none and inside sections with overflow clip.
- **Safety net (revision 1, item 1):** define `sweep()`: every one-shot ScrollTrigger whose trigger top is above the viewport bottom and whose animation has not completed gets `animation.progress(1)`. Run sweep:
  - on window load, after ScrollTrigger.refresh();
  - 4000ms after load;
  - on every `ScrollTrigger.addEventListener("scrollEnd", sweep)`;
  - whenever a passive scroll listener (rAF-throttled) sees `scrollY + innerHeight >= scrollHeight - 2` (page bottom).
  Under mm revert, everything returns to natural styles.

**Guards.**
- Keep motion-browser-test CONTENT in sync with any new content selectors.
- Update the TARGETS comment if REVEAL_TARGETS changed.
- Run the full suite. Fix the implementation, not the tests, unless an expectation legitimately changed. Record every guard expectation change with its justification for the SUMMARY:
  - HERO_H1 constant: SR sentence (HERO-05)
  - home-browser NOJS text source: visual line versus SR sentence
  - HERO_WIDE and UNDERLINE under reduced motion: measure the static word
  - font-metrics cap: user asked for a bigger headline
  - motion reveal replaced by fallback plus choreo: GSAP path supersedes IO when loaded
  - any BLUE_ALLOWED addition

**After shots and iteration (budget: at most 2 screenshot-and-adjust rounds; after round 2, ship and list remaining ideas in the SUMMARY).** With $SCRATCH/shoot.js capture:
- home-bold-hero-1280.png and home-bold-hero-375.png (re-shoot)
- home-bold-full-1280.png and home-bold-full-375.png (full)
- home-bold-mid-1-1280.png, home-bold-mid-2-1280.png and home-bold-mid-3-1280.png at fractions about 0.22, 0.5 and 0.78. These capture choreography mid-flight; take them right after a scroll without waiting for settle, i.e. 250ms.

VIEW every PNG with the Read tool. Compare with home-sleek-1280.png. Iterate (adjust sizes, alphas, distances) until it is clearly bolder and more impressive while still warm. Check specifically:
- nothing is clipped or overlapping in the full shots;
- the chips do not cover the face in the photo;
- the ticker shows legible logos;
- the band headline is big.

**Docs (slimmed, revision 1, item 8).** Task 2 already wrote the amendment. Here, only append a "Final values" sub-list to it if tuning changed any token, timing or rule, and update REPLACE-ME for decor copy. For reference, the amendment covers:
  - the hero layout (fields, dot grid, masked photo, frame, chips, scroll cue, toggle);
  - the kinetic headline contract (word list, slot, timings, pause reasons, SR sentence);
  - the new tokens;
  - the motion system: has-motion gate, matchMedia branches, one-shot versus scrub rules, the clamp end rule, parallax only on decor, the ticker scroll-linked for 2.2.2, and the fallback order (GSAP, then IO reveals, then static);
  - the size scale-up;
  - divergences from the Phase 2 spec. The photo frame, shadow and chips intentionally supersede "photo is supportive, no frame"; the user asked for a dramatic presentation.
- Update REPLACE-ME.md for any decor copy (e.g. the giant "Elmhollow" word is the town name and must follow the Town row).
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/check-portability.js && node tools/check-contrast.js && node tools/check-design-system.js && node tools/font-metrics-test.js && node tools/smoke-test.js && node tools/check-home.js && node tools/home-browser-test.js && node tools/check-contact.js && node tools/contact-browser-test.js && node tools/motion-browser-test.js && ! grep -nE "innerHTML|fetch\(|^\s*import |type=.module|ScrollSmoother|pin:|backgroundPosition" js/main.js && ! grep -nE "filter: *blur" css/styles.css && grep -c "clamp(top" js/main.js | grep -qv "^0$" && grep -q "Amendment: quick task 261013-ffc" .planning/phases/02-shared-shell-static-home/02-UI-SPEC.md && git diff --quiet -- contact.html && cd /private/tmp/claude-501/-Users-melvin-Desktop-testing/a6867164-c830-4130-af48-48c0608054f9/scratchpad && ls home-bold-hero-1280.png home-bold-hero-375.png home-bold-full-1280.png home-bold-full-375.png home-bold-mid-1-1280.png home-bold-mid-2-1280.png home-bold-mid-3-1280.png</automated>
  </verify>
  <done>
- All eleven guard scripts exit 0, including motion choreo, fallback, vendor and console, and home cycle.
- Every section has a distinct scroll choreography, and sizes are visibly larger.
- With motion settled at the bottom, everything is fully visible. No-JS, reduced motion and GSAP-blocked paths hide nothing.
- contact.html is unchanged.
- After shots have been viewed and are clearly bolder than home-sleek-1280.png.
- The UI-SPEC amendment and REPLACE-ME rows are written.
- The SUMMARY lists `requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06]`, with per-requirement evidence (test group plus result), the license note, guard changes with justifications, and screenshot paths.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| npm registry to repo | Third-party minified code (GSAP) is copied into assets/js/vendor/ and runs on every Home visit |
| page to user | Prototype is static. The only input is the existing contact form, which this task does not change |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-ffc-SC | Tampering | npm pack gsap@3.15.0 to assets/js/vendor | mitigate | gsap is an established package already chosen in the CLAUDE.md stack research (not [ASSUMED]). Verify the tarball shasum equals `npm view gsap@3.15.0 dist.shasum` (7851baaf...9d14). Copy only the three dist files byte for byte, extract in an isolated scratch dir, never execute from it, and record shasum and source in GSAP-VERSION.md. check-portability scans the vendor files for fetch, import, XHR and CDN hosts. |
| T-ffc-01 | Tampering/XSS | js/main.js DOM building (alt word spans, ticker clone) | mitigate | Use createElement, textContent and cloneNode only. No innerHTML. The verify step greps for it. data-words is author-controlled static markup. |
| T-ffc-02 | Information disclosure | Vendored code phoning home | accept | GSAP dist makes no network calls (planner grep confirmed no fetch/XHR). Licence banner URLs are comments only. |
| T-ffc-03 | Denial of service (a11y) | Auto-moving content (cycle, drift) | mitigate | WCAG 2.2.2: visible pause toggle, plus pause on hover, focus, hidden and off-screen. The ticker is scroll-linked. Reduced motion is static. Tests cover each path. |
</threat_model>

<verification>
- All guards green: check-portability, check-contrast, check-design-system, font-metrics-test, smoke-test, check-home, home-browser-test (hero, nojs, sticky, layout, cycle), check-contact, contact-browser-test, motion-browser-test (vendor, choreo, fallback, nojs, reduced, overflow, header, contact, console).
- index.html opens over file:// with GSAP active (vendor group), and with no console errors (console group).
- The screenshots in the scratchpad have been viewed and compared against home-sleek-1280.png.
</verification>

<success_criteria>
- At first look the hero is clearly bolder and more impressive than the ep2 version. It is near full-viewport, has a much bigger kinetic headline, drifting colour fields, a dramatic masked photo with chips and a scroll cue, and still reads warm and local.
- Every section animates distinctly with scroll, and everything is larger. Native scrolling is never hijacked.
- HERO-01..HERO-06 are met with automated evidence, ready for Phase 3 verification.
- Content is never hidden without working motion. Contact is unaffected.
</success_criteria>

<output>
Create `.planning/quick/261013-ffc-bold-hero-redesign-with-kinetic-headline/261013-ffc-SUMMARY.md` when done. It must include:
- frontmatter `requirements-completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06]`
- an evidence table (requirement, test group, result)
- RED output from Task 1
- the GSAP license note and shasum
- guard expectation changes with justifications
- token values and worst-case contrast ratios
- discretion choices
- screenshot paths
</output>
