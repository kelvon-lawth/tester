# Project Research Summary

**Project:** Local Freelance Marketer Website (Prototype)
**Domain:** Two-page static marketing site (Home + Contact), kinetic-typography hero, no backend
**Researched:** 2026-10-12
**Confidence:** MEDIUM

## Executive Summary

A small, polished concept site for a local freelance marketer: Home carries the whole story (hero → services → about → proof → process → closing CTA); Contact carries a validated form. All four research files converge on hand-written HTML + tokens-first CSS + small vanilla JS loaded as classic `<script defer>` — no framework, bundler, or build step — so the site opens by double-clicking `index.html` and deploys unchanged to any static host. ES modules and `fetch()` fail over `file://`, so they are ruled out.

The core value — the first impression via a kinetic hero cycling business types ("Marketing for your bakery / gym / salon…") — is also where most risk concentrates: 4 of 11 pitfalls (layout shift, screen-reader announcements, reduced-motion/no-JS, jank) converge there. Recommended: progressive enhancement. The static HTML headline is complete and meaningful without JS; the animated word sits in a fixed-footprint CSS grid-stack slot, `aria-hidden`, with a visually hidden full sentence for assistive tech; motion uses only `transform`/`opacity`; the cycle pauses when the tab is hidden or the hero is off-screen, and offers a pause control or stops after 1–2 loops (WCAG 2.2.2).

The second risk is design: "professional + local" can collapse into a generic template or an over-crafted pastiche. Lock tokens first (≈5 colors, 2 font families, 3–4 handcrafted accents), keep placeholder content believable but clearly fictional and centralized, and make the form's success state honest that nothing was sent.

**Conflict resolved (opinionated):** STACK.md recommends GSAP 3.15 + SplitText (per-letter); ARCHITECTURE.md and PITFALLS.md recommend CSS-driven, word-level animation and warn against per-letter DOM and unneeded libraries. Recommendation: build the hero CSS-first and word-level (JS toggles state on one timer; CSS/WAAPI animates). Zero dependencies, `file://`-safe, and avoids SplitText accessibility and licensing uncertainty. Add vendored GSAP only if a Phase 3 spike shows the desired choreography is not achievable in CSS/WAAPI; if used, load as classic script with `aria-label` on the parent and `aria-hidden` on split spans.

## Key Findings

### Recommended Stack

(See STACK.md.) HTML5 (`index.html`, `contact.html`), tokens-first CSS, vanilla JS (classic deferred scripts), native form validation, self-hosted WOFF2 fonts, inline SVG.

**Core technologies:**
- HTML + CSS custom properties (clamp, grid, flex) — pages, layout, theming; Tailwind/Bootstrap would push a generic look
- Vanilla JS, classic `<script defer>` — hero cycler, form, nav; avoids `file://` module/CORS failure
- CSS keyframes/WAAPI (default) or GSAP 3.15.0 + SplitText (optional, vendored) — kinetic hero; GSAP free licensing is MEDIUM confidence, confirm at gsap.com/standard-license
- Native Constraint Validation API (`novalidate`, `checkValidity()`, `aria-describedby`) — form; no validation libraries or Formspree
- Self-hosted WOFF2 (1–2 families), inline SVG, small WebP images — warm handcrafted look, small payload
- Any static host (Netlify, GitHub Pages, Cloudflare Pages) — deploy folder as-is

### Expected Features

(See FEATURES.md.)

**Must have (table stakes):**
- Hero with static value proposition and primary CTA
- 4 services in plain language: social media, local SEO/Google, ads/campaigns, branding/design
- About block with photo and first-person copy
- 2–3 testimonials and a local-business logo strip (placeholders)
- Repeated CTAs to Contact; shared header/nav/footer
- Contact form (name, email, business, message) with inline accessible validation and success state
- Direct contact details (`mailto:`/`tel:`)
- Phone-first responsive layout, accessibility basics, fast load, reduced-motion support

**Should have (differentiators):**
- Kinetic hero cycling business types
- Handcrafted accents (underline, squiggles, grain, rotated cards) within a budget
- Earthy palette and characterful type pairing, defined as tokens
- Town-specific copy hooks; 3-step "How it works"
- Business-type picker in the form
- Subtle scroll reveals; expectation-setting form copy

**Defer:** sticky CTA, service-card micro-interactions. v2+: real form backend, real content, SEO/analytics, static generator if pages grow.

**Never build:** extra pages, pricing tables, chat widgets, real submission/CAPTCHA, popups, carousels, autoplay video, parallax, fake urgency, CMS, jargon-heavy copy.

### Architecture Approach

(See ARCHITECTURE.md.) Flat layout: `index.html`, `contact.html`, `css/` (tokens, base, layout, sections, contact), `js/` (nav, hero-cycler, contact-form), `assets/`. One-directional flow, no server. Tokens feed every stylesheet; the word list lives in HTML, JS toggles state, CSS renders. The form's submit handler is the single seam for a future endpoint. Header/footer duplicated across the two pages, kept in sync by checklist.

**Major components:**
1. Design tokens (`tokens.css`) — only place raw values live
2. Base/texture layer — reset, type, grain, focus styles, global reduced-motion rules
3. Shared shell — header, always-visible two-link nav + CTA, footer
4. Hero module — static accessible headline + cycling slot + `hero-cycler.js`
5. Content sections — services, about, testimonials/logos, process, closing CTA
6. Contact form module — native validation + honest success panel
7. Placeholder content layer — centralized and easy to swap

### Critical Pitfalls

(See PITFALLS.md for all 11.)

1. **Hero layout shift from varying word widths** — stack words in one grid cell; never center a changing-width line. Acceptance: CTA bounding box does not move across a full cycle at 320/768/1440px.
2. **Screen-reader announcements and WCAG 2.2.2** — no `aria-live` on the rotator; sr-only full sentence plus `aria-hidden` animated copy; pause on hover/focus/hidden tab; pause control or stop after a few loops.
3. **Reduced-motion and no-JS as an afterthought** — static meaningful headline is the default markup; enhance only under `no-preference` and listen for `change`; never hide the hero until JS runs (also hurts LCP).
4. **Font loading** — self-host WOFF2, preload only the hero font, tune fallback metrics (`size-adjust`), start animation after `document.fonts.ready`.
5. **Generic vs over-crafted design** — fix grid, type scale and palette first; cap accents at 3–4; contrast ≥ 4.5:1; apply the "swap the logo" test.
6. **Also watch:** misleading form (success copy says demo; use `textContent` not `innerHTML`); placeholders (centralize, "sample content" indicator, `noindex`, `example.com`/555 values); mobile (`clamp()` type, `svh`, 44px targets, test 320px); asset bloat (≈500KB first view); `file://` portability (relative paths only).

## Implications for Roadmap

### Phase 1: Foundation & Design System
**Rationale:** Everything depends on tokens, fonts and structure; the riskiest subjective choice (design direction) and structural pitfalls are cheapest to settle here.
**Delivers:** File skeleton with relative paths, `tokens.css`, `base.css`, self-hosted fonts, palette, mini style guide (palette, 2 fonts, 3–4 accents), texture utilities, performance budgets, `file://` open check.
**Avoids:** Pitfalls 4, 6, 10 (budgets), 11.

### Phase 2: Shared Shell & Static Home Layout
**Rationale:** Both pages need the shell. Building Home statically first proves layout, copy and mobile; the static hero becomes the animation's fallback.
**Delivers:** Header (two-link nav + CTA), footer, buttons, responsive container; static Home (hero, 4 services, about + photo, testimonials + logo strip, 3-step process, closing CTA); placeholder system with `REPLACE-ME.md`, "Prototype: sample content" note, `noindex`.
**Avoids:** Pitfalls 7, 9, 10 (image sizing).

### Phase 3: Kinetic Hero
**Rationale:** Core value and highest risk; starts once shell and static hero exist.
**Delivers:** Word-level cycler in a fixed grid slot; technique decided first (CSS/WAAPI default, GSAP only if justified); `aria-hidden` + sr-only sentence; reduced-motion path with `change` listener; no-JS default; pause on hover/focus/hidden/off-screen; 2.5–3.5s per word; pause control or end state.
**Avoids:** Pitfalls 1, 2, 3, 5.

### Phase 4: Contact Page
**Rationale:** Independent of Phase 3; needs only the shell, so can run in parallel.
**Delivers:** `contact.html` with labeled form and optional business-type picker; native validation with `aria-describedby`/`aria-invalid` and focus management; `role="status"` success panel with honest "demo only, nothing sent" copy; fake direct contact details; reassurance copy; isolated submit handler with marked endpoint seam.
**Avoids:** Pitfall 8; XSS via `textContent`.

### Phase 5: Polish & QA
**Rationale:** Accents and reveals sit on a stable layout; verification needs finished pages.
**Delivers:** SVG handcrafted accents within budget, subtle reduced-motion-safe scroll reveals, optional sticky CTA. QA: real-device phone, 320px no horizontal scroll, VoiceOver, keyboard/focus, contrast, CLS 0, Lighthouse mobile 90+, 4x CPU throttle, double-click `file://` and subfolder hosting, header/footer parity, per-page basics (title, meta, lang, favicon, alt, skip link, one h1, `aria-current`), placeholder grep.

### Phase Ordering Rationale

- Dependencies flow tokens → shell → hero / sections / contact → polish.
- Static Home before animation means the progressive-enhancement fallback exists by construction.
- Phases 3 and 4 are independent once Phase 2 exists — parallelizable.
- Each pitfall maps to the phase where it is cheapest to fix; the four hero pitfalls are handled together in Phase 3.

### Research Flags

Needs deeper research:
- **Phase 3 (Kinetic Hero):** technique (CSS/WAAPI vs GSAP, per-letter vs per-word), grid-stack slot sizing with chosen fonts, WCAG 2.2.2 approach, reduced-motion behavior; if GSAP, verify SplitText API and license.
- **Phase 1:** light — style-guide decision (fonts, palette, accents) and contrast checks.

Standard patterns (skip research): Phase 2 (static layout), Phase 4 (native validation, accessible errors), Phase 5 (checklist QA).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Versions verified via npm on 2026-10-12; `file://` module restriction established; GSAP licensing from memory; GSAP vs CSS-first unresolved across files |
| Features | MEDIUM | Domain convention plus PROJECT.md; no competitor audit |
| Architecture | MEDIUM-HIGH | Established static-site practice; no external sources consulted |
| Pitfalls | MEDIUM | WCAG/CSS/browser behavior not re-fetched; screen-reader claims need real VoiceOver testing |

**Overall confidence:** MEDIUM — conclusions are consistent and low-risk for a simple site; uncertainty is unverified sources and subjective design outcomes, not technical feasibility.

### Gaps to Address

- **GSAP vs CSS-first:** decide in a Phase 3 spike; default CSS/WAAPI word-level.
- **GSAP/SplitText license and API:** confirm on gsap.com before vendoring, if chosen.
- **WCAG 2.2.2 specifics:** re-check and choose pause control vs stop-after-loops in Phase 3.
- **Screen-reader behavior:** verify `aria-hidden` + sr-only pattern with VoiceOver (macOS, iOS) in Phase 5.
- **Font selection and fallback metrics:** not chosen; resolve in Phase 1.
- **Placeholder strategy:** marked HTML blocks plus `REPLACE-ME.md` (`file://`-safe); avoid fetched JSON.
- **Nav:** inline two-link nav rather than hamburger; `nav.js` may be unnecessary.

## Sources

- **Primary (HIGH):** npm registry 2026-10-12 (gsap 3.15.0, astro 7.3.8, vite 8.3.4, motion 14.1.0, animejs 4.5.0); PROJECT.md; established `file://` module/fetch restriction.
- **Secondary (MEDIUM):** WCAG 2.2 (2.2.2, 2.3.3, 1.4.3, 4.1.3), MDN, web.dev (training knowledge, not re-fetched); GSAP free-plugin licensing (recalled; confirm at gsap.com/standard-license); freelancer/local-site conventions.
- **Tertiary (LOW):** practitioner guidance on `aria-live` misuse and letter-splitting accessibility — needs real screen-reader testing.

---
*Research completed: 2026-10-12*
*Ready for roadmap: yes*
