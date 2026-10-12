# Walking Skeleton — Local Freelance Marketer Website (Prototype)

**Phase:** 1
**Generated:** 2026-10-12

## Capability Proven End-to-End

A visitor double-clicks `index.html` (no server, no build) and sees a branded stub page in the bright social-network identity (white page, Fraunces headline "Marketing for your bakery" with "bakery" in social blue over a coral hand-drawn underline, Figtree body, navy footer), can follow the header link to `contact.html` and back, and the shared stylesheet, self-hosted fonts and a classic deferred script all load over `file://`. An automated headless-Chrome smoke test proves it (`node tools/smoke-test.js`).

Static-site translation of the template's stack items: there is no database, API or auth. "Real read/write" here means real assets resolved through relative paths (CSS, WOFF2 fonts, JS) and a real script side effect observable in the DOM (`<html class="js fonts-loaded">`). "Deployment" means: double-click from disk, and the same folder dropped onto any static host (including a subfolder) unchanged.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | None. Hand-written HTML5, one stylesheet, vanilla JS | Two pages do not justify a toolchain; must open over `file://` (CLAUDE.md, PROJECT.md constraints) |
| Pages | `index.html`, `contact.html` (public). `styleguide.html` is a dev-only third file, linked only from a footer dev link, removed or hidden in Phase 5 | Scope is exactly two pages; style guide satisfies Phase 1 success criterion 2 |
| Shared header/footer | Copy-pasted markup in each page, marked with `<!-- SHELL:HEADER START/END -->` and `<!-- SHELL:FOOTER START/END -->` comments | No includes: `fetch()` and modules fail over `file://` |
| Styling | Single stylesheet `css/styles.css`, tokens-first (`:root` custom properties are the only place raw values live), mobile-first `min-width` queries at 640px and 1024px, BEM-lite class names | One file = one request, trivial to swap brand values; UI-SPEC is the token source of truth |
| Scripts | Classic `<script defer src="js/...">` only. Never `type="module"`, never `fetch()` of local files, never `import` | Chrome blocks module scripts over `file://` (CORS) |
| Shared JS | `js/main.js` loaded on every page: swaps `no-js` to `js` on `<html>`, adds `fonts-loaded` (or `fonts-failed`) once Fraunces + Figtree load. Page-specific scripts (Phase 3 hero, Phase 4 form) are separate classic deferred files | Gives later phases a no-JS hook (`.no-js`) and a fonts-ready hook for the hero |
| Fonts | Self-hosted WOFF2, Latin subset, from Fontsource pinned `@5.3.0` on jsDelivr: `Fraunces-SemiBold.woff2` (static 600), `Figtree-Regular.woff2`, `Figtree-SemiBold.woff2`. OFL licence files alongside. `font-display: swap` plus metric-tuned local fallbacks `"Fraunces Fallback"` (local Georgia Bold, size-adjust 93.7%, ascent-override 104.5%, descent-override 27.7%) and `"Figtree Fallback"` (local Arial, size-adjust 99.6%, ascent-override 95.4%, descent-override 25.1%, line-gap-override 0% on both); measured max width delta 0.42% (limit 3%), Body line counts match (2026-10-12, `node tools/font-metrics-test.js`) | Fraunces full variable file is ~121KB alone, over the 120KB font budget; UI-SPEC allows static SemiBold. Static trio is ~41KB. Consequence: Fraunces SOFT/WONK/opsz axes are not adjustable; the default instance is used |
| Design tokens | `--color-*`, `--space-*` (xs..3xl, 4..64px), `--fs-*` (4 sizes), `--fw-regular`/`--fw-semibold`, `--lh-*`, `--radius-*`, `--shadow-card`, `--ease-out`, `--dur-*`, `--container`, `--measure`, hero tokens `--color-hero-static`, `--color-hero-word`, `--hero-underline-*` | Values exactly as in 01-UI-SPEC.md; Phases 2-5 consume them, never hardcode |
| Accent kit | Exactly two: `.divider-squiggle` (CSS mask data-URI, colour from `background-color: var(--color-line)` or `--color-coral` modifier) and `.accent-underline` (inline SVG under the hero word, `stroke: var(--hero-underline-color)`) | D-09/D-10/D-11; no grain, no blobs, no third accent ever |
| Shared business-word list | bakery, café, salon, gym, florist, shop, restaurant (in this order), documented in the comment header of `css/styles.css` and in `styleguide.html`; later JS reads it from the DOM / `data-words` | D-08; single source for Phase 3 hero and Phase 4 picker |
| Photos | Hotlinked royalty-free stock (Unsplash/Pexels) with `width`/`height`, `alt`, `referrerpolicy="no-referrer"`, tint placeholder background; URLs + credits in `REPLACE-ME.md` | D-13; the only allowed non-relative asset |
| Dev tooling | Zero-dependency Node scripts in `tools/` (`check-portability.js`, `smoke-test.js`, `check-contrast.js`, `check-design-system.js`, `font-metrics-test.js` + `font-metrics.html`). Run with plain `node`; headless Chrome via `CHROME_PATH` or the default macOS path. No `package.json`, no npm installs | Automated verification without adding a toolchain to the site; `tools/` is not linked from any page |
| Deployment target | Double-click `index.html` from disk; any static host (Netlify Drop, GitHub Pages, Cloudflare Pages) by uploading the folder as-is. Local run command: `open index.html` (macOS) | No server or build exists to deploy |
| Directory layout | `index.html`, `contact.html`, `styleguide.html`, `REPLACE-ME.md`, `css/styles.css`, `js/main.js`, `assets/fonts/` (WOFF2 + `OFL-Fraunces.txt`, `OFL-Figtree.txt`, `SOURCES.md`), `tools/` | Flat, relative-path friendly; mirrors UI-SPEC file structure |

## Stack Touched in Phase 1

- [ ] Project scaffold (file skeleton, single stylesheet, classic deferred JS, zero-dependency Node test scripts)
- [ ] Routing: two real pages linked by plain `<a href="index.html">` / `<a href="contact.html">` with `aria-current="page"`
- [ ] "Data" layer, static-site sense: real relative-path loads of CSS, three WOFF2 fonts and `js/main.js` over `file://`, verified by `node tools/smoke-test.js`
- [ ] UI: skip link, two-link header nav, branded h1 with blue hero word and coral underline, navy footer; style guide with buttons/links/focus states
- [ ] Deployment: documented local run (`open index.html`) plus portability scan (`node tools/check-portability.js`) proving no absolute paths, modules, fetch or CDNs

## Out of Scope (Deferred to Later Slices)

- Full header/footer shell, mobile sticky CTA, Home content sections, `REPLACE-ME.md` content entries beyond fonts/sample photo (Phase 2)
- Kinetic cycling hero, pause control, reduced-motion hero behaviour (Phase 3; Phase 1 ships only the static first word "bakery" and the hero tokens)
- Contact form, validation, success state, area map graphic (Phase 4; Phase 1 ships only the field style tokens and a "Let's talk" stub h1)
- Removing/hiding `styleguide.html` and `tools/` from the shipped site, cross-device QA, 500KB budget audit (Phase 5)
- Dark mode (D-03), GSAP (Phase 3 decision), paper grain, blob frames (D-09), any third accent type

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: Visitor reads a complete, warm static Home page and navigates to Contact via shared header/footer and repeated "Let's talk" CTAs
- Phase 3: Visitor sees the "Marketing for your [word]" headline cycle smoothly and accessibly, with pause and reduced-motion support
- Phase 4: Visitor fills in and "sends" a validated, front-end-only enquiry and sees direct contact details
- Phase 5: Both pages verified polished, accessible and fast on real devices; dev-only files removed from the shipped set
