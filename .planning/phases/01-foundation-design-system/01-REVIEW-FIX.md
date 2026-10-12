---
phase: 01-foundation-design-system
fixed_at: 2026-10-12T21:15:00Z
review_path: .planning/phases/01-foundation-design-system/01-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 1: Code Review Fix Report

**Fixed at:** 2026-10-12T21:15:00Z
**Source review:** .planning/phases/01-foundation-design-system/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (WR-01..WR-06; Info findings were out of scope)
- Fixed: 6
- Skipped: 0

After the fixes, all five guards pass: check-portability, check-contrast, check-design-system, font-metrics-test and smoke-test.

## Fixed Issues

### WR-01: Form field boundary fails WCAG 1.4.11 non-text contrast (1.50:1)

**Files modified:** `css/styles.css`, `tools/check-contrast.js`
**Commit:** bb1637c
**Applied fix:** Added a `--color-field-border: var(--color-ink-soft)` token in `:root`. It is an alias, so no new hex was added to the palette. `.field__input` now uses it for its 2px border. `check-contrast.js` now resolves `var(--color-*)` alias tokens and has a `NON_TEXT` table that requires at least 3:1. `field-border/white` measures 7.53:1 and `field-border/tint` measures 6.90:1, and both pass. Note: the UI-SPEC form-field row still says "2px `--color-line` border" and should be updated to match.

### WR-02: "Figtree Fallback" has no 600 face, and Figtree SemiBold is not preloaded

**Files modified:** `css/styles.css`, `index.html`, `contact.html`, `js/main.js`, `tools/font-metrics.html`, `tools/font-metrics.js`, `tools/font-metrics-test.js`
**Commit:** a96f955
**Applied fix:**
- The 400 `Figtree Fallback` face now declares `font-weight: 400` explicitly.
- Added a 600 `Figtree Fallback` face using `local("Arial Bold")`/`local("Arial-BoldMT")`. Its values (size-adjust 94.4%, ascent 100.6%, descent 26.5%) were measured with a new "label" row in the font-metrics harness, which compares Figtree 600 against Arial Bold.
- The width delta for 600 text went from -1.98% (synthetic bold) to -0.10%. The harness now enforces the MAX_DELTA limit on this row too.
- Both pages now preload `Figtree-SemiBold.woff2`.
- `main.js` now loads `600 1em Figtree`, so the smoke test's `fonts-loaded` check also covers SemiBold.

### WR-03: Metric-matched fallbacks do nothing on Android and Linux

**Files modified:** `css/styles.css`
**Commit:** e834af5
**Applied fix:** Best effort, documented in a CSS comment.
- **Linux/ChromeOS:** added metric-compatible clones to the existing faces: Gelasio (a Georgia clone), and Liberation Sans and Arimo (Arial clones, regular and bold). Because these are metric-compatible, the overrides already tuned for Georgia and Arial apply to them.
- **Android:** added separate `"Fraunces Fallback Android"` (Noto Serif Bold) and `"Figtree Fallback Android"` (Roboto 400, and Roboto Medium/Bold for 600) faces, and inserted them into `--font-display` and `--font-body`. These faces only override vertical metrics: ascent and descent are taken from the real Fraunces and Figtree files and derived from the measured overrides. `size-adjust` stays at 100%.
- **Not measured:** none of this was measured on Linux or Android. Android widths are not tuned, so some horizontal reflow on swap is still expected there. There is no zero-CLS claim for those platforms.
- Desktop deltas are unchanged.
- Not done: the reviewer's optional suggestion to have the harness report which fallback family was actually used.
- Note: the font stacks in UI-SPEC still list the old two-family stacks.

### WR-04: Underline SVG is a child of the text node Phase 3 will animate

**Files modified:** `index.html`, `styleguide.html`, `tools/check-design-system.js`
**Commit:** 0481d2d
**Applied fix:** The hero word text is now wrapped in `<span class="hero-word__text">`, with the SVG as its sibling. This was done in `index.html` and in all 3 occurrences in `styleguide.html`. `check-design-system.js` now fails if a `.hero-word.accent-underline` element does not start with `.hero-word__text`. I checked that this regex flags the old markup. Phase 3 should target `.hero-word__text` only.

### WR-05: `check-design-system.js` misses several kinds of raw colour values

**Files modified:** `tools/check-design-system.js`
**Commit:** 09b42f8
**Applied fix:**
- Replaced the colour and font checks with one per-declaration scan, `/([a-z-]+)\s*:\s*([^;{}]+)(?=;|\})/gi`, which also catches a last declaration that has no trailing `;`.
- Outside `:root`, the scan now flags hex values, colour functions (rgb/rgba/hsl/hsla/hwb/lab/lch/oklab/oklch/color()) and a list of CSS named colours. The named-colour match skips `var(--color-navy)` and `white-space`.
- The `font:` shorthand is now a violation.
- The script now fails when the `:root` braces are unbalanced (`end === -1`) and no longer re-appends the file in that case.
- Custom properties declared outside the main `:root` (for example inside `@media`) are scanned too.
- This rewrite also removed the dead `hexes` code from IN-02 (lines 34 and 39).
- I tested it with temporary bad CSS (`#fff` with no `;`, `rgba()`, `red`, the `font:` shorthand, `hsl()` in a media `:root`). Every case failed as expected, and there were no false positives on valid rules. The temporary CSS was then reverted.

### WR-06: `check-portability.js` misses several things that break file://

**Files modified:** `tools/check-portability.js`
**Commit:** 0f6f4e0
**Applied fix:**
- `listFiles` is now recursive, using its own walker. JS is scanned in `js/**` and `assets/js/**`, and CSS in `css/**`.
- Every tag is now checked for every `href`/`src`/`srcset`/`poster` attribute, single or double quoted, using `(?<![-\w])` so `data-src=` is ignored. `srcset` is split on commas.
- Added checks for dynamic `import(` and `XMLHttpRequest`.
- I tested it with a temporary HTML file and a temporary `assets/js/vendor/*.js` file. It caught absolute and remote paths, missing files in srcset and poster, fetch, import() and XHR, and it ignored data-src. The temporary files were then removed.

## Guard results (after all fixes)

| Guard | Result |
|-------|--------|
| node tools/check-portability.js | PORTABILITY OK (exit 0) |
| node tools/check-contrast.js | CONTRAST OK (exit 0), including the new non-text field-border pairs |
| node tools/check-design-system.js | DESIGN SYSTEM OK (exit 0) |
| node tools/font-metrics-test.js | FONT METRICS OK (exit 0); deltas: display -0.06%, heading 0.22%, body -0.42%, label (600) -0.10% |
| node tools/smoke-test.js | PASS index.html, contact.html, styleguide.html (js fonts-loaded) |

---

_Fixed: 2026-10-12T21:15:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
