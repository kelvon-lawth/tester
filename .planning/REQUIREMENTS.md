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

- [x] **QA-01**: Both pages look polished at phone (320px+), tablet and desktop widths with no horizontal scrolling and tap targets ≥ 44px
- [x] **QA-02**: Keyboard user can reach and operate every link, control and form field with a visible focus style
- [x] **QA-03**: Home page first view loads fast (≈ 500KB budget, no layout shift)

### Launch Readiness

- [x] **OPS-01**: Deployed site contains only public files: no style guide page, script or CSS, and no tools, planning files or repo docs
- [x] **OPS-02**: REPLACE-ME.md lists every visible placeholder string
- [x] **OPS-03**: Planning records match reality (summary requirement fields, roadmap, state)
- [x] **OPS-04**: Visitor can load the site from a Vercel address, and pushing to main redeploys it
- [ ] **OPS-05**: GitHub Pages deploy is retired after Vercel is confirmed working

### Client Login

- [x] **AUTH-01**: Visitor can reach a login page from the shared header on every page
- [x] **AUTH-02**: Invited client can sign in with email and password and sign out; the session survives a reload
- [x] **AUTH-03**: Password reset by email is built and works for addresses the sender can reach (Supabase team members until an email service is added, D-12); other clients get help from the marketer
- [x] **AUTH-04**: Signed-in client sees a dashboard with a welcome, their plan and next steps (placeholder content, per client); signed-out visitors are sent to login
- [x] **AUTH-05**: Client data is enforced by the service: a client can read only their own row, and signed-out requests get none, even when calling the service directly
- [x] **AUTH-06**: Accounts are invite-only: public sign-up is off, and the marketer creates client accounts with a temporary password (D-12) and edits dashboards in the hosted service's admin console
- [x] **AUTH-07**: Home and Contact load no auth code, still open by double-click and stay within the page-weight budget; login shows a clear message when not on the hosted site

### Client Dashboard (Phase 07.1)

- [ ] **DASH-01**: "At a glance" shows 3 key numbers for the reported month, labelled per client, each with an arrow and the change since last month in plain words ("Up 12% on last month"; absolute wording when last month was under 10; safe when last month is missing or zero), under a visible "Figures for <month>" label
- [ ] **DASH-02**: "Waiting on you" lists the approvals and things needed from the client, from table rows
- [ ] **DASH-03**: "Done this month" lists the work delivered in the reported month
- [ ] **DASH-04**: "Coming up" shows the next check-in date and the renewal date for that client
- [ ] **DASH-05**: Contact buttons to call, email or book a chat, using the site-wide details and no third-party service
- [x] **DASH-06**: Each client has a plan tier (basics or growth); a Local Basics client cannot read Growth-only data even through the REST API, sees only the reported month and the month before in the monthly numbers, and no client can change their own tier or any data
- [x] **DASH-07**: Local Basics clients see the four Growth-only cards locked, with an upgrade prompt, and their page makes no request for Growth data
- [x] **DASH-08**: Growth clients see a 6-month trend chart (inline SVG), the content calendar for the next 2 weeks, ad results (spend, clicks, results) and the monthly report archive links
- [x] **DASH-09**: A live RLS test proves Basics denied, Growth own-only, signed-out none, no writes and no self-upgrade, against seeded hidden Growth rows
- [x] **DASH-10**: The additive migration is applied to the live project before the new page ships, both test clients are re-seeded (A basics, B growth), and CLIENT-GUIDE.md explains the monthly routine
- [ ] **DASH-11**: No regression: Home and Contact load no auth code and are unchanged, the CSP and vercel.json are unchanged, the page-weight budget holds, the file:// card still shows, and all guards pass

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
| Pages beyond Home, Contact, Login and Dashboard (blog, portfolio, pricing, about) | Two public pages plus the login area added by user decision, 2026-11-06 |
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
| QA-01 | Phase 5 | Complete |
| QA-02 | Phase 5 | Complete |
| QA-03 | Phase 5 | Complete |
| OPS-01 | Phase 6 | Complete |
| OPS-02 | Phase 6 | Complete |
| OPS-03 | Phase 6 | Complete |
| OPS-04 | Phase 6 | Complete |
| AUTH-01 | Phase 7 | Complete |
| AUTH-02 | Phase 7 | Complete |
| AUTH-03 | Phase 7 | Complete |
| AUTH-04 | Phase 7 | Complete |
| AUTH-05 | Phase 7 | Complete |
| AUTH-06 | Phase 7 | Complete |
| AUTH-07 | Phase 7 | Complete |
| DASH-01 | Phase 07.1 | Pending |
| DASH-02 | Phase 07.1 | Pending |
| DASH-03 | Phase 07.1 | Pending |
| DASH-04 | Phase 07.1 | Pending |
| DASH-05 | Phase 07.1 | Pending |
| DASH-06 | Phase 07.1 | Complete |
| DASH-07 | Phase 07.1 | Complete |
| DASH-08 | Phase 07.1 | Complete |
| DASH-09 | Phase 07.1 | Complete |
| DASH-10 | Phase 07.1 | Complete |
| DASH-11 | Phase 07.1 | Pending |
| OPS-05 | Phase 6 | Partial: workflow removed, Pages not yet disabled |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0 ✓
- Descoped: 2 (CON-02, CON-03 by D-01)

---
*Requirements defined: 2026-10-12*
*Last updated: 2026-11-22, Phase 07.1 planning*
