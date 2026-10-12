---
phase: 01-foundation-design-system
reviewed: 2026-10-12T20:39:17Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - contact.html
  - css/styles.css
  - index.html
  - js/main.js
  - js/styleguide.js
  - styleguide.html
  - tools/check-contrast.js
  - tools/check-design-system.js
  - tools/check-portability.js
  - tools/font-metrics-test.js
  - tools/font-metrics.html
  - tools/font-metrics.js
  - tools/smoke-test.js
findings:
  critical: 0
  warning: 6
  info: 10
  total: 16
status: issues_found
---

# Phase 1: Code Review Report

**Reviewed:** 2026-10-12T20:39:17Z
**Depth:** standard
**Files Reviewed:** 13
**Status:** issues_found

## Summary

Reviewed the two page stubs, the shared stylesheet and tokens, `main.js`, the dev style guide, and the Node/headless-Chrome guard tools. `check-contrast.js`, `check-design-system.js` and `check-portability.js` all pass on the current tree. I verified in headless Chrome that `document.fonts.load` rejects when a font file is missing, so `main.js` handles a missing font correctly.

There are no blockers. The main problems are:

- **Form-field contrast:** the shared form-field component fails WCAG 1.4.11 (non-text contrast).
- **Font fallbacks:** the metric-matched fallback faces have gaps. There is no 600 weight for Figtree, and they only work on platforms that have Georgia and Arial.
- **Hero markup:** the underline SVG sits inside the word span that Phase 3 will animate, so swapping the word text would delete it.
- **Guard tools:** the scripts that claim to prove token-only CSS and file:// portability have several false-negative paths.

## Warnings

### WR-01: Form field boundary fails WCAG 1.4.11 non-text contrast (1.50:1)

**File:** `css/styles.css:466-478` (tokens at `css/styles.css:67,75`)
**Issue:** `.field__input` is identified only by its fill (`--color-tint` #F1F5FF) and its 2px border (`--color-line` #C9D3EE). Measured ratios: border vs white page 1.50:1, border vs its own tint fill 1.37:1, fill vs white 1.09:1. WCAG 1.4.11 requires 3:1 for the visual information needed to identify a UI component. On a white page the inputs will be close to invisible to low-vision users. Phase 4 builds the contact form on this class, so the failure will ship. `check-contrast.js` does not test non-text pairs, so nothing catches it.
**Fix:** Give inputs a border token of at least 3:1 against both white and tint. `--color-ink-soft` (#4A5568, 7.53:1) works. Also add a non-text check to `check-contrast.js`:
```css
:root { --color-field-border: var(--color-ink-soft); }
.field__input { border: 2px solid var(--color-field-border); }
```

### WR-02: "Figtree Fallback" has no 600 face, and Figtree SemiBold is not preloaded

**File:** `css/styles.css:52-59`, `index.html:7-8`, `contact.html:7-8`
**Issue:** The fallback face has no `font-weight` descriptor, so it defaults to 400. Nav links, buttons and labels all use `--fw-semibold`. Until `Figtree-SemiBold.woff2` arrives, the browser matches `Figtree Fallback` 400 and synthesises a fake bold from Arial Regular instead of using Arial Bold. The `size-adjust`/`ascent-override` values were tuned for 400 only (`font-metrics.js:97-101`), so the 600 text reflows when the real font swaps in. SemiBold is used above the fold in the header nav but is the only face that is not preloaded, which makes the swap more likely to be visible. Neither `main.js` nor the smoke test checks the 600 face, so a broken SemiBold file would also pass.
**Fix:**
```css
@font-face {
  font-family: "Figtree Fallback";
  font-weight: 600;
  src: local("Arial Bold"), local("Arial-BoldMT");
  size-adjust: /* measure 600 Figtree vs Arial Bold */;
  ascent-override: ...; descent-override: ...; line-gap-override: 0%;
}
```
Also preload `assets/fonts/Figtree-SemiBold.woff2` and add `document.fonts.load("600 1em Figtree")` to `main.js`.

### WR-03: Metric-matched fallbacks do nothing on Android and Linux

**File:** `css/styles.css:42-59`, `css/styles.css:95-96`
**Issue:** The fallback faces only resolve `local("Georgia…")` and `local("Arial")`. Android does not ship these fonts, and most Linux systems do not either. There, both fallback faces fail to load and the stack falls through to `Georgia`/`serif` and `system-ui`/`sans-serif` with no metric overrides. The "no layout jump" guarantee from Plan 01-03 therefore only holds on macOS and Windows, where it was measured with desktop Chrome. Phones, which CLAUDE.md calls out explicitly, get the unadjusted shift.
**Fix:** Add platform `local()` sources, each with its own tuned overrides (for example `local("Noto Serif Bold")`/`local("Roboto")` in separate `@font-face` blocks, since overrides are per face). Alternatively, document the limitation and rely on preload plus `font-display: swap`. The harness should also report the fallback family that was actually used.

### WR-04: Underline SVG is a child of the text node Phase 3 will animate

**File:** `index.html:30`, `css/styles.css:292-316`
**Issue:** `<span class="hero-word accent-underline">bakery<svg …/></span>` puts the SVG in the same element as the cycling word. CLAUDE.md prescribes running SplitText on the cycling word and swapping its text. Setting `textContent`/`innerText` on `.hero-word` deletes the SVG. SplitText will also walk into or wrap the SVG node. Either way the second accent breaks silently, and `check-design-system.js` will not notice because it only inspects static HTML.
**Fix:** Separate the text from the accent now, while the markup is a stub:
```html
<span class="hero-word accent-underline"><span class="hero-word__text">bakery</span><svg class="accent-underline__svg" …></svg></span>
```
Phase 3 then targets `.hero-word__text` only.

### WR-05: `check-design-system.js` misses several kinds of raw colour values

**File:** `tools/check-design-system.js:32-45`
**Issue:** The guard is meant to prove "tokens-only CSS", but:
- Line 36 only matches declarations that end in `;`. A hex in the last declaration of a block written without a trailing semicolon (`.x { color: #fff }`) is never flagged.
- Only hex colours are checked. `rgb()`, `rgba()`, `hsl()` and named colours (`color: red`) outside `:root` all pass.
- Lines 40 and 43 do not catch the `font:` shorthand, so `font: 700 20px/1 serif` bypasses both the font-size and font-weight token rules.
- Line 30: if the `:root` braces are unbalanced, `end` stays `-1` and `css.slice(end + 1)` re-appends the whole file. This only happens to be harmless.
**Fix:** Run the colour test per declaration and accept a missing trailing `;`, for example `/([a-z-]+)\s*:\s*([^;{}]+)(?=;|\})/gi`. Flag `#hex`, `rgba?\(`, `hsla?\(` and a small list of CSS named colours outside `:root`. Treat the `font:` shorthand as a violation. Fail when `end === -1`.

### WR-06: `check-portability.js` misses several things that break file://

**File:** `tools/check-portability.js:22-33`, `52`, `105-107`
**Issue:**
- `listFiles` is not recursive. CLAUDE.md puts vendored GSAP in `assets/js/vendor/`, and future code may go in `js/vendor/`. Neither location is ever scanned for `fetch(` or `import`.
- `tagRe` (line 52) only matches double-quoted `href`/`src` and only the first one per tag. Single-quoted attributes, `srcset`, `poster` and a second URL attribute are never checked.
- Line 107 catches static `import x` but not dynamic `import("./x.js")`, which fails over file:// in the same way. `XMLHttpRequest` is not checked either.
- `\b(href|src)` also matches `data-src=`, which can produce false positives.

The script prints "PORTABILITY OK", but it cannot back that claim for these cases.
**Fix:** Recurse with `fs.readdirSync(dir, { recursive: true })` (Node 20+) over `js/`, `css/` and `assets/js/`. Match `(?<![-\w])(href|src|srcset|poster)\s*=\s*(["'])(.*?)\2`, and split `srcset` on commas. Add `/\bimport\s*\(/` and `/XMLHttpRequest/` to the JS checks.

## Info

### IN-01: `js`/`no-js`/`fonts-loaded`/`fonts-failed` classes are never used by CSS

**File:** `js/main.js:10-27`
**Issue:** `styles.css` has no selectors for any of these classes. The font-loading promise exists only for `smoke-test.js` to read. That is fine for now, but it is undocumented coupling.
**Fix:** Add a comment saying the classes are a test hook (or the planned CSS hook for Phase 3), or use them, for example to gate the hero animation on `.fonts-loaded` so SplitText measures the real font.

### IN-02: Dead code in `check-design-system.js`

**File:** `tools/check-design-system.js:34,39,83,85`
**Issue:** `hexes` is computed and then thrown away with `void hexes`. The `accent-underline__svg` exemption on line 83 can never run: `\baccent-underline\b` cannot match `accent-underline__svg` because `_` is a word character, so the SVG tag never reaches that branch. The `(?!__)` on line 85 is redundant for the same reason.
**Fix:** Delete lines 34 and 39, and simplify lines 83 and 85.

### IN-03: Duplicate assertion in `font-metrics-test.js`

**File:** `tools/font-metrics-test.js:120,137-139`
**Issue:** The block at lines 137-139 repeats the `wide.fsDisplayPx > 72` check from line 120, guarded by an unrelated `wide.sim320`. When it triggers, the same failure is reported twice.
**Fix:** Remove lines 137-139.

### IN-04: Harness errors are reported as "fonts did not load"

**File:** `tools/font-metrics.js:113-126`
**Issue:** `.catch(fail)` also catches exceptions thrown inside `run()`, such as a renamed element id. These are then reported as `{fontsLoaded:false}`, which sends debugging in the wrong direction.
**Fix:** In `fail(e)`, record `String(e)` in the results JSON, and have the runner print it.

### IN-05: Style guide "Result" column does not update with the live ratio

**File:** `js/styleguide.js:30-36`, `styleguide.html:82-205`
**Issue:** The caption says the ratios are recalculated live, but only the ratio cell changes. The "Pass" cell is hard-coded, so a token change that drops a pairing below 4.5:1 would still show "Pass" next to the failing number.
**Fix:** Compute the result in JS as well: `ratio >= 4.5 ? "Pass" : "Fail"`. Forbidden rows should stay as they are.

### IN-06: `.site-footer a` overrides button colours; footer links have no hover state

**File:** `css/styles.css:350-358`, `418-422`
**Issue:** `.site-footer a` (specificity 0,1,1) beats `.btn--ghost` (0,1,0). A ghost button in the footer would get white text but keep its ink border on navy, at 1.17:1. The same rule also overrides `a:hover`, so footer links get no hover feedback.
**Fix:** Use `.site-footer a:not(.btn)` to match `.on-navy`, and add a `.site-footer a:hover { text-decoration-thickness: 3px; }` or similar.

### IN-07: `object-fit: cover` on `.media` has no effect

**File:** `css/styles.css:501-508`
**Issue:** With `block-size: auto`, the image keeps its intrinsic ratio, so `object-fit` changes nothing.
**Fix:** Add `aspect-ratio` (or a fixed block size) wherever cropping is intended, or remove `object-fit`.

### IN-08: Regular Georgia can stand in for the 600 fallback with mismatched metrics

**File:** `css/styles.css:45`
**Issue:** `local("Georgia")` is the last source of a face declared as `font-weight: 600`. If neither bold name resolves, regular Georgia is used as "600". Because the face claims 600, no synthetic bold is applied, and the overrides were tuned for Georgia Bold.
**Fix:** Drop `local("Georgia")`, and let the stack fall through to the `Georgia` family entry in `--font-display`.

### IN-09: Duplicated `dumpDom` helper and a macOS-only default Chrome path

**File:** `tools/smoke-test.js:13-64`, `tools/font-metrics-test.js:14-53`
**Issue:** The two copies of the spawn/kill logic are identical. The default `CHROME` path only exists on macOS.
**Fix:** These are dev-only tools that will be removed in Phase 5, so acceptable for now. If they survive, extract a shared `tools/lib/chrome.js` and document `CHROME_PATH` in the usage line.

### IN-10: `check-contrast.js` only reads the first `:root {` block

**File:** `tools/check-contrast.js:73-88`
**Issue:** A later `:root` override, for example inside `@media`, or a minified `:root{` with no space, is never checked. A colour token redefined there would ship unverified.
**Fix:** Collect every `:root\s*\{` block, warn if any `--color-*` is redefined outside the first one, and match `:root\s*\{` instead of the literal `":root {"`.

---

_Reviewed: 2026-10-12T20:39:17Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
