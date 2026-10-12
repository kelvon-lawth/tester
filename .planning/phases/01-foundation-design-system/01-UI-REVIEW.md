# Phase 1 — UI Review

**Audited:** 2026-10-12 (retroactive)
**Baseline:** 01-UI-SPEC.md (approved) plus 01-CONTEXT.md decisions D-01 to D-14
**Screenshots:** captured with headless Chrome over file:// in `.planning/ui-reviews/01-20261012-134547/` (gitignored): index desktop 1440x900, index mobile 500x812, contact desktop, styleguide desktop 1440x7000, styleguide mobile 500x9000, hero underline crop. Chrome's minimum window is 500px, so the 320px "restaurant" fit was not re-shot. It relies on `tools/font-metrics-test.js` (205.9px inside a 288px box, per 01-03-SUMMARY).

**Scope note:** index.html and contact.html are stubs by design. Missing page content (services, kinetic hero, form) is not scored. This review scores the design system, the stub shells and styleguide.html.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 3/4 | Every contract string is present and exact, but straight apostrophes render in Fraunces display ("Let's talk" h1) |
| 2. Visuals | 3/4 | The focal point is clear, but the coral hero underline collides with descenders ("bakery" y; gym, shop will do the same) and sits outside the line box |
| 3. Color | 3/4 | No raw colours outside tokens and the 60/30/10 split holds, but skip-link hover turns blue-hover on ink (about 2.3:1, fails AA) |
| 4. Typography | 3/4 | 4 sizes and 2 weights exactly as specified. Label line-height 1.4 exists only as a literal in `.sg-label`, and real labels use 1.5 |
| 5. Spacing | 2/4 | Authored CSS is token-only, but there is no margin reset, so browser defaults (h2 about 23px, p 18px, figure 40px) set most rendered vertical rhythm. Stacked `.section` padding doubles to 192px |
| 6. Experience Design | 3/4 | Focus, hover, active, error and reduced-motion states are present. Ghost has no :active, footer/navy links have no hover feedback, and font-state classes are set but never used |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **Off-scale browser default margins and doubled section padding** (WARNING, Spacing). Phase 2 inherits these for every heading, paragraph and figure, so section rhythm will not follow the 7-step scale. Stacked sections will also sit 192px apart on desktop (128px on mobile). **Fix:** in Base, add `h1,h2,h3,p,ul,ol,figure{margin:0}`. Then set rhythm from tokens: `h2,h3{margin-block-end:var(--space-md)}`, `p + p{margin-block-start:var(--space-md)}`. Change `.section` to `padding-block: var(--space-3xl)` with `.section + .section { padding-block-start: 0 }`, or use one-sided padding, so neighbours do not double up.
2. **Hero underline collides with descenders and overflows its line box** (WARNING, Visuals). The y descender of "bakery" crosses the coral stroke at both 72px and 40px (crop-hero.png). Three of the seven words (bakery, gym, shop) have descenders. Because the SVG is absolute and extends past the box, the element below gets only about 16px of clearance (see the style-guide hero sample caption). **Fix:** move it to `top: calc(100% + var(--hero-underline-offset))` measured from a box sized to the descender, or add `padding-block-end: var(--hero-underline-height)` to `.accent-underline` so the line box reserves room. As an alternative, set the SVG under the descender with `top: 100%` and remove the `margin-top` / `- var(--space-sm)` combination. Also add `vector-effect: non-scaling-stroke` to the path so the stroke stays 4px on short ("gym") and long ("restaurant") words alike under `preserveAspectRatio="none"`.
3. **Skip link fails AA on hover** (WARNING, Color/XD). `a:hover` (0,1,1) beats `.skip-link` (0,1,0) at css/styles.css:267 vs :405, so hovering the focused skip link shows `#2A44D4` text on `#1C1E21` (about 2.3:1). **Fix:** add `.skip-link:hover { color: var(--color-bg); }`, or raise specificity to `a.skip-link`.

---

## Detailed Findings

### Pillar 1: Copywriting (3/4)

Contract strings verified as exact matches. Nav "Home"/"Contact" (index.html:21-22). Skip link "Skip to main content" (:14). Footer "Prototype — sample content" (:38). Index h1 "Marketing for your bakery" (:31). Contact h1 "Let's talk" (contact.html:31). Primary CTA "Let's talk" and secondary "See how I help" (styleguide.html:272, 278). Error copy matches the contract word for word (styleguide.html:291). There are no generic labels (Submit, Click here, OK).

- WARNING: straight apostrophes at display size. "Let's talk" at 72px Fraunces (contact.html:31, contact-desktop.png) shows a vertical tick instead of a typographic apostrophe, and this is the largest text on the page. The same applies to "doesn't" (styleguide.html:291) and to every future "Let's talk" CTA. Use `’` (U+2019) in visible copy and record it as a copywriting convention for Phases 2 to 4.
- Minor: `<title>` contains the literal bracket placeholder "[Name]" (index.html:6, contact.html:6). This is fine for the prototype, but it must be listed in REPLACE-ME.md so it gets swapped, together with the h1 and footer placeholders.
- Minor: the public stub footers link "Style guide (dev)" (index.html:39, contact.html:39). The spec allows this. Phase 5 must remove it from both pages, or a third page ships.

### Pillar 2: Visuals (3/4)

Strengths: index.html has an unmistakable focal point. The display serif, the blue hero word and the coral underline match the Focal Point section. The palette reads bright, social and warm, and the accent kit is restrained (exactly 2 types).

- WARNING: descender collision (see Fix 2). Evidence is in crop-hero.png: the blue y tail overlays the coral stroke. This is the signature element of the site's core value, so it should read as intentional.
- WARNING: the underline height is fixed at 12px (`--hero-underline-height`) for every font size. At 28px Heading size in the style guide ("Underline on white", styleguide.html:246) the stroke is visibly heavy compared with the glyphs. At 40px mobile Display it is about 30% of x-height. Consider scaling it with `em` (for example `0.16em`), clamped by the token.
- Minor: the stub header is a bare 44px strip with zero block padding (`.site-header` css:291 has no padding; height comes only from the nav link `min-block-size`). Nav text sits tight to the tint edge (index-desktop.png). This is acceptable for a stub, but Phase 2 should give the header `padding-block: var(--space-md)`.
- Minor (style guide only): `.sg-band` has `padding-block` only, so text in tint bands sits flush against the band edge (styleguide.html:240, 247; visible in sg-mobile.png). The style-guide field row uses `align-items: center` (`.sg-row`), so "Your name" sits about 15px lower than "Email" because of the error message. The two inputs also have different widths. That misrepresents the field component. Phase 4 needs a `.field` wrapper with a defined width.
- Minor: the inline-link focus on navy renders as a hard white rectangle around underlined text (styleguide.html:298). It is acceptable, but it looks boxier than the pill buttons' rings.

### Pillar 3: Color (3/4)

Token discipline is strong. The only hex/rgba values are in `:root` (css:118-131, 171). There are 13 `var(--color-blue)` references, all on reserved roles (CTA, links, current nav, hero word, focus rings, field focus border), plus style-guide specimens. Coral appears only in the hero underline, `.divider-squiggle--coral` and `.text-coral-on-navy`. It is never text on light backgrounds and never on buttons, which complies with D-01a. Navy is confined to the footer and `.on-navy`. On the index stub, the split visibly holds: white dominant, tint header, blue and coral as small pops.

- WARNING: skip-link hover contrast failure (Fix 3).
- WARNING: `.sg-space` bars use `--color-blue` as a decorative fill (css:639). The spec states "nothing else may use `--color-blue`". This is style-guide only, but it teaches the wrong pattern. Use `--color-ink-soft` or `--color-line`.
- WARNING (decision for Phase 2): a primary blue button on the navy band (styleguide.html:296) is a blue fill on navy at 2.78:1, the same pairing the spec forbids for text. The white label passes (5.12:1), so it is AA-legal, but the pill shape is weak against navy. Phase 2's closing CTA band should decide whether to use a white/tint-filled CTA on navy and add it to the interaction contract.
- Minor: `.site-footer a` and `.on-navy a:not(.btn)` keep the colour white on hover (css:410-413 overrides `a:hover`), so there is no colour change. The underline is the only affordance, which is fine, but no hover state exists (see Pillar 6).

### Pillar 4: Typography (3/4)

The size tokens are exactly 4: `--fs-body` 1.125rem, `--fs-label` 0.875rem, `--fs-heading` 1.75rem and `--fs-display` clamp(2.5rem, 6.5vw + 0.5rem, 4.5rem), as specified. The weights are exactly 400 and 600, and only those three WOFF2 files ship (41KB total, under the 120KB budget). There are 2 families, `text-wrap: balance`/`pretty` is applied, and metric-matched fallbacks are tuned and verified (FONT METRICS OK).

- WARNING: there is no `--lh-label` token. The spec's Label row sets line-height 1.4, but it exists only as a literal in `.sg-label` (css:696). The components that are labels per the spec (`.btn` css:448 uses `--lh-body` 1.5; `.site-nav a`, `.field__label` and the footer inherit 1.5) do not follow it. Add `--lh-label: 1.4` and apply it to `.btn`, `.site-nav a`, `.field__label`, `.field__error` and `.site-footer`.
- Minor: style-guide swatch captions use `<code>` (styleguide.html:39 and following), which falls back to the UA monospace. That is a third, unspecified family on screen. Style `code { font-family: var(--font-body); font-weight: var(--fw-semibold); }` or accept it as dev-only.
- Minor: styleguide.html preloads only 2 of the 3 fonts (omits Figtree-SemiBold, styleguide.html:7-8). The verification noted this. Make all three pages' heads identical.

### Pillar 5: Spacing (2/4)

Authored values are clean. Every padding, margin and gap in styles.css uses a `--space-*` token. The documented exceptions (44px targets, 3px rings, 12px artwork) are respected, the gutters step 16/24/32 at 640 and 1024 as specified, and there is no 4xl token.

The rendered rhythm is not on the scale.

- WARNING: there is no margin reset for `h2`, `h3`, `p`, `ul`, `figure`. `h2,h3` (css:223-230) set size and leading but leave the UA `margin-block: 0.83em`, so 28px x 0.83 = about 23.2px, which is off-scale. `p` keeps a 1em UA margin, giving 18px for body and 14px for label, both off-scale. `figure` in the sample-photo section keeps the UA `margin: 1em 40px`, which visibly indents the photo 40px from the gutter (sg-mobile.png, section 9). Only `.sg-swatches figure`, `.sg-caption`, `.sg-heading`, `.sg-display`, `.site-footer p` and `h1` are reset. Phase 2's sections, cards and footer will inherit these unscaled values unless the foundation fixes them (Fix 1).
- WARNING: `.section` applies symmetric `padding-block` (64px, or 96px at 1024px+, css:586-592). Adjacent sections therefore produce a 192px gap on desktop and 128px on mobile. That is visible in sg-desktop.png as large dead zones between sections 2 and 3, 3 and 4, and 4 and 5. The spec's "section vertical padding 96px" intent is a 96px separation, not 192px.
- Minor: `.sg-band` has no inline padding (see Visuals), and `.accent-underline__svg` uses `top: calc(100% - var(--space-sm))` plus `margin-top: var(--space-xs)`. That reuses spacing tokens as artwork positioning, which the spec's exceptions note warns against, and nets to -4px from an unclear origin. Express it as a single `--hero-underline-offset`.

### Pillar 6: Experience Design (3/4)

State coverage for a foundation phase:
- Present: global `:focus-visible` (3px blue, 3px offset), white rings on navy and footer, `.btn--primary` hover/active, `.btn--ghost` hover, ghost-on-navy hover, field focus (border plus ring), field error via `aria-invalid` with `aria-describedby` linkage, `prefers-reduced-motion` collapse and smooth-scroll gating, skip link targeting `main[tabindex=-1]` with no focus outline on main, 44px minimum targets, no-JS class swap, and a hotlinked image with width/height plus a tint placeholder.
- Not applicable: loading, empty and destructive states (the spec declares none).

Gaps:
- WARNING: skip-link hover contrast (Fix 3).
- WARNING: `.btn--ghost` has no `:active`/`.is-active` state, while primary does (css:466-471). The pressed feedback is inconsistent between the two button types. Add `transform: translateY(1px)` plus `background-color: var(--color-tint)`, or the navy equivalent.
- WARNING: footer and on-navy text links have no hover state at all (css:410-413 overrides `a:hover`). Add, for example, `text-decoration-thickness: 3px` or a `--color-tint` colour on hover.
- Minor: `js/main.js` adds `fonts-loaded`/`fonts-failed`/`js` classes, but no CSS consumes them. Either use them in Phase 3 (for example, gate the hero SplitText run on `fonts-loaded` so per-char measurement uses the real face) or document that intent in main.js.
- Minor: the hero underline SVG is static now. Phase 3 must gate any draw-in under `prefers-reduced-motion: no-preference`, as the spec requires.

---

## Registry Safety

Not applicable: no `components.json` and no shadcn. Third-party assets (Fraunces/Figtree OFL files, Unsplash hotlink) are recorded in `assets/fonts/SOURCES.md` and REPLACE-ME.md.

---

## Files Audited

- /Users/melvin/Desktop/testing/index.html
- /Users/melvin/Desktop/testing/contact.html
- /Users/melvin/Desktop/testing/styleguide.html
- /Users/melvin/Desktop/testing/css/styles.css
- /Users/melvin/Desktop/testing/js/main.js
- /Users/melvin/Desktop/testing/js/styleguide.js
- /Users/melvin/Desktop/testing/assets/fonts/ (file list only)
- .planning/phases/01-foundation-design-system/01-UI-SPEC.md, 01-CONTEXT.md, 01-0{1,2}-SUMMARY.md, 01-03-SUMMARY.md (grep), 01-VERIFICATION.md
- Screenshots: .planning/ui-reviews/01-20261012-134547/{index-desktop,index-mobile,contact-desktop,sg-desktop,sg-mobile,crop-hero}.png
