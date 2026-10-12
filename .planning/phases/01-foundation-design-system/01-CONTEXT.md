# Phase 1: Foundation & Design System - Context

**Gathered:** 2026-10-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the site's visual foundation: design tokens (palette, type, spacing, motion), self-hosted fonts, the accent kit, the static file skeleton (`index.html`, `contact.html` stub, CSS, JS folders, assets) that opens by double-click with no build step, and a visible style-guide view showing it all. Covers FND-01..FND-05. Page content (Home sections, hero animation, contact form) belongs to later phases.

</domain>

<decisions>
## Implementation Decisions

### Color palette
- **D-01:** "Social network brights" palette (revised 2026-10-12 — replaces the earlier earthy cream/olive/terracotta direction): background white `#FFFFFF`, secondary blue tint `#F1F5FF`, dark band navy `#1B2A4A`, text near-black `#1C1E21`, primary accent social blue `#3B5BFD` (hover: a darker blue chosen to keep ≥4.5:1), pop coral `#FF6B6B`, error a distinct red that is not coral (e.g. `#C62828`). Feel: social, energetic, approachable.
- **D-01a:** Contrast rules (computed): blue on white 5.12:1 and on blue tint 4.69:1 — OK for text and buttons (white on blue 5.12:1). Coral on white is only 2.78:1 — coral must NOT be used for text or essential UI on light backgrounds; use it for decorative accents (squiggles, hero underline, small shapes) and for text only on the navy band (5.12:1). Ink on blue tint 15.31:1; white on navy 14.22:1.
- **D-02:** "Calm with pops" — pages are mostly white/blue-tint backgrounds; blue appears on CTAs, links and the hero word; coral is a sparing decorative pop; exactly one dark band style (navy) used for the closing CTA band and footer. No color-blocked section rhythm.
- **D-03:** Light theme only — no dark mode.
- **D-04:** In the kinetic hero, static words are near-black ink; the cycling business-type word is social blue with a coral hand-drawn underline beneath it. Define tokens for this now (Phase 3 consumes them).

### Typography
- **D-05:** Headings/display: warm soft serif — Fraunces (self-hosted WOFF2, OFL).
- **D-06:** Body: clean modern sans — Figtree (self-hosted WOFF2, OFL). Exactly 2 families, no script font.
- **D-07:** Hero display size "big & confident": ~72px max on desktop via fluid `clamp()`; on a 320px phone the longest cycling word ("restaurant") must fit on one line without overflow.
- **D-08:** Hero business-type word list (shared by Phase 3 hero and Phase 4 picker): bakery, café, salon, gym, florist, shop, restaurant.

### Handcrafted accents
- **D-09:** Accent kit is deliberately minimal: (1) squiggle section dividers, (2) a single hand-drawn underline reserved for the hero word. No paper grain texture, no blob photo frames.
- **D-10:** Loudness: "subtle seasoning" — layout reads clean and professional first; at most a couple of squiggle dividers per page.
- **D-11:** FND-03 is relaxed from "3–4 accent types" to "1–4 accent types" (user decision); this phase satisfies it with 2. Update REQUIREMENTS.md / UI-SPEC wording accordingly.
- **D-12:** Service icons: clean, uniform line icons (crisp single-weight, not hand-drawn doodles). Inline SVG, colored via `currentColor`.
- **D-13:** Photos: real-looking free stock photos (royalty-free, e.g. Unsplash/Pexels license) **hotlinked** from the web rather than bundled. Accepted trade-off: photos won't show when offline; FND-01's "everything via relative paths" applies to pages, CSS, JS and fonts, not photos. Include sized `width`/`height` (or aspect-ratio) and meaningful `alt` so missing images don't shift layout, and list photo URLs + credits in `REPLACE-ME.md`.

### UI-SPEC alignment
- **D-14 [informational]:** (Completed before planning; UI-SPEC revised and approved.) The draft `01-UI-SPEC.md` must be revised to match D-01..D-04 (new palette + contrast table) and D-09..D-13 (remove paper grain and blob frames, icon style, photo approach) and to fix the UI checker's blocking spacing issue (remove 96px step; button padding from tokens only). Add the declared focal point (Display headline + blue hero word with coral underline, CTA second).

### Claude's Discretion
- Exact spacing/type scale values, breakpoints and container width (within UI-SPEC rules).
- Fallback font metric overrides, style-guide page layout, file names within the agreed skeleton.
- Whether the style guide lives at `styleguide.html` (removed/hidden in Phase 5 to keep the site at two pages).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract
- `.planning/phases/01-foundation-design-system/01-UI-SPEC.md` — Draft UI design contract (tokens, contrast table, interaction states, copy). Must be revised per D-14; where it conflicts with this CONTEXT.md, CONTEXT.md wins.

### Project scope & requirements
- `.planning/PROJECT.md` — Vision, constraints (two pages, static only, placeholders)
- `.planning/REQUIREMENTS.md` — FND-01..FND-05 (FND-03 relaxed per D-11)
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Research
- `.planning/research/SUMMARY.md` — Stack (plain HTML/CSS/vanilla JS, classic `<script defer>`, no modules/fetch on `file://`), font-loading and design-tension pitfalls
- `.planning/research/PITFALLS.md` — Font loading (size-adjust fallbacks), generic-vs-over-crafted design, portability

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project (only `.planning/` and `CLAUDE.md` exist).

### Established Patterns
- None yet; this phase establishes them (tokens-first CSS, classic deferred scripts, relative paths).

### Integration Points
- Tokens and base styles created here are consumed by Phase 2 (shell + Home), Phase 3 (hero word color/underline tokens, D-04/D-08), and Phase 4 (contact form, business-type list D-08).

</code_context>

<specifics>
## Specific Ideas

- Hero headline pattern: "Marketing for your [word]" with the word in social blue + coral hand-drawn underline.
- Business words: bakery · café · salon · gym · florist · shop · restaurant.
- Overall feel: professional first, local warmth through color, type and copy rather than heavy decoration.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Brand placeholder name/town/logo was offered but not discussed; Claude may choose plausible fictional placeholders in Phase 2.)

</deferred>

---

*Phase: 01-foundation-design-system*
*Context gathered: 2026-10-12*
