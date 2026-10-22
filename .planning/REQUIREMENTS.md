# Requirements: Local Freelance Marketer Website (Prototype)

**Defined:** 2026-10-12
**Core Value:** The home page must make a strong first impression — polished, professional and warm, with an impressive animated headline — so a visitor immediately reads "a real local person who can grow my business."

## v1 Requirements

Requirements for the show-ready prototype. Each maps to roadmap phases.

### Foundation & Design

- [x] **FND-01**: Visitor can open the site by double-clicking `index.html` (no server, no build step) and every page, style, script and font loads via relative paths
- [x] **FND-02**: Visitor sees a consistent bright, friendly "social network" visual identity (limited palette of white, social blue, coral pop and navy; 2 font families) applied from shared design tokens across both pages
- [x] **FND-03**: Visitor sees subtle handcrafted accents (squiggle section dividers and a hand-drawn underline under the hero word) — 1–4 accent types, per Phase 1 discussion — layered on a clean professional grid
- [x] **FND-04**: Visitor sees self-hosted fonts render without noticeable layout jump on load
- [x] **FND-05**: Text meets WCAG AA contrast (≥ 4.5:1 for body text) throughout

### Shared Shell

- [x] **SHL-01**: Visitor can navigate between Home and Contact from an always-visible header nav on every page, with the current page indicated
- [x] **SHL-02**: Visitor sees a footer on both pages with placeholder contact details, area served and a subtle "Prototype — sample content" note
- [x] **SHL-03**: Visitor can reach the contact page from repeated "Let's talk" calls to action on the home page (hero, mid-page, closing band)
- [x] **SHL-04**: Mobile visitor sees a sticky "Let's talk" button while scrolling the home page that links to the contact page

### Home Content

- [x] **HOME-01**: Visitor sees a hero with a clear value proposition headline, supporting line and primary CTA, fully readable without JavaScript
- [x] **HOME-02**: Visitor sees four services — Social media, Local SEO & Google, Ads & campaigns, Branding & design — each with an icon/illustration and a plain-language description
- [x] **HOME-03**: Visitor sees a first-person "About me" block with a placeholder photo and warm, neighborly copy
- [x] **HOME-04**: Visitor sees 2–3 placeholder testimonials from local businesses (name, business, short quote)
- [x] **HOME-05**: Visitor sees a strip of placeholder local-business logos
- [x] **HOME-06**: Visitor sees a 3-step "How it works" section (e.g. chat → plan → grow)
- [x] **HOME-07**: Visitor sees a closing CTA band inviting them to get in touch
- [x] **HOME-08**: All placeholder content (name, town, testimonials, contact details, photos) is clearly fictional and listed in a `REPLACE-ME.md` swap checklist

### Kinetic Hero

- [x] **HERO-01**: Visitor sees the headline "Marketing for your [word]" where the word cycles through local business types (bakery, gym, salon, shop, café, …) with a bold, smooth animated transition
- [x] **HERO-02**: Surrounding text and the CTA do not shift position as words of different lengths cycle, at phone, tablet and desktop widths
- [x] **HERO-03**: Visitor can pause and resume the animation via a visible control; the cycle also pauses on hover/focus and when the tab is hidden or the hero is off-screen
- [x] **HERO-04**: Visitor with "reduce motion" enabled, or without JavaScript, sees a complete static headline with no cycling
- [x] **HERO-05**: Screen-reader user hears a single complete headline, not each word change
- [x] **HERO-06**: Animation runs smoothly (no visible jank) on a typical laptop and phone

### Contact Page

- [x] **CON-01**: Visitor can fill in a form with name, phone and email (required) and an optional message, all with visible labels (amended by D-01, 2026-10-13; was name, email, business name, message)
- ~~**CON-02**: Visitor can choose their business type from a picker matching the hero's business types (plus "Other")~~ Descoped (D-01, 2026-10-13): form trimmed to name, phone, email, message
- ~~**CON-03**: Visitor can tick which of the four services they are interested in~~ Descoped (D-01, 2026-10-13): form trimmed to name, phone, email, message
- [x] **CON-04**: Visitor sees inline, accessible error messages for missing or invalid fields (e.g. bad email) and focus moves to the first error on submit
- [x] **CON-05**: Visitor sees a friendly success message after a valid submit that states this is a prototype and nothing was sent
- [x] **CON-06**: Visitor sees direct placeholder contact details (email via `mailto:`, phone via `tel:`) alongside the form
- [x] **CON-07**: Visitor sees a stylized map / area-served placeholder graphic on the contact page

### Quality

- [ ] **QA-01**: Both pages look polished at phone (320px+), tablet and desktop widths with no horizontal scrolling and tap targets ≥ 44px
- [ ] **QA-02**: Keyboard user can reach and operate every link, control and form field with a visible focus style
- [ ] **QA-03**: Home page first view loads fast (≈ 500KB budget, no layout shift)

## v2 Requirements

Deferred. Tracked but not in the current roadmap.

### Content & Launch

- **LAUNCH-01**: Real freelancer name, branding, photos, testimonials and logos replace placeholders
- **LAUNCH-02**: Contact form actually delivers submissions (e.g. form service or email endpoint)
- **LAUNCH-03**: SEO metadata, social share images and analytics

### Enhancements

- **ENH-01**: Subtle scroll-reveal animations on home sections
- **ENH-02**: Town-specific copy woven through headlines
- **ENH-03**: Reply-time reassurance copy on the contact page

## Out of Scope

| Feature | Reason |
|---------|--------|
| Pages beyond Home and Contact (blog, portfolio, pricing, about) | User specified exactly two pages |
| Real form submission, CAPTCHA, backend | Prototype; front-end only |
| CMS / admin panel | Placeholder content is hand-edited |
| Chat widgets, popups, cookie banners | Clutter; works against the warm feel |
| Testimonial carousels, autoplay video, heavy parallax | Performance and accessibility cost; distracts from hero |
| Framework / build tooling (React, Astro, Vite, Tailwind) | Overkill for 2 pages; breaks double-click opening |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | Phase 1 | Complete |
| FND-02 | Phase 1 | Complete |
| FND-03 | Phase 1 | Complete |
| FND-04 | Phase 1 | Complete |
| FND-05 | Phase 1 | Complete |
| SHL-01 | Phase 2 | Complete |
| SHL-02 | Phase 2 | Complete |
| SHL-03 | Phase 2 | Complete |
| SHL-04 | Phase 2 | Complete |
| HOME-01 | Phase 2 | Complete |
| HOME-02 | Phase 2 | Complete |
| HOME-03 | Phase 2 | Complete |
| HOME-04 | Phase 2 | Complete |
| HOME-05 | Phase 2 | Complete |
| HOME-06 | Phase 2 | Complete |
| HOME-07 | Phase 2 | Complete |
| HOME-08 | Phase 2 | Complete |
| HERO-01 | Phase 3 | Complete |
| HERO-02 | Phase 3 | Complete |
| HERO-03 | Phase 3 | Complete |
| HERO-04 | Phase 3 | Complete |
| HERO-05 | Phase 3 | Complete |
| HERO-06 | Phase 3 | Complete |
| CON-01 | Phase 4 | Complete |
| CON-02 | Phase 4 | Descoped (D-01) |
| CON-03 | Phase 4 | Descoped (D-01) |
| CON-04 | Phase 4 | Complete |
| CON-05 | Phase 4 | Complete |
| CON-06 | Phase 4 | Complete |
| CON-07 | Phase 4 | Complete |
| QA-01 | Phase 5 | Pending |
| QA-02 | Phase 5 | Pending |
| QA-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 33 total
- Mapped to phases: 33
- Unmapped: 0 ✓
- Descoped: 2 (CON-02, CON-03 by D-01)

---
*Requirements defined: 2026-10-12*
*Last updated: 2026-10-22, Phase 4*
