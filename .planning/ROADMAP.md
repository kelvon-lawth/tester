# Roadmap: Local Freelance Marketer Website (Prototype)

## Overview

A two-page static prototype (Home + Contact) built with hand-written HTML, tokens-first CSS and small vanilla JS, so it opens by double-clicking `index.html`. The journey: settle the design system, build the shared shell and a complete static Home (which becomes the hero's no-JS fallback), layer on the kinetic hero (core value), build the Contact page in parallel, then polish and verify everything across devices and assistive tech.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation & Design System** - File skeleton, design tokens, self-hosted fonts, bright social-network palette and handcrafted accent kit (completed 2026-10-12)
- [ ] **Phase 2: Shared Shell & Static Home** - Header/nav/footer and a complete, readable Home page with placeholder content system
- [ ] **Phase 3: Kinetic Hero** - Cycling business-type headline that is smooth, stable, accessible and motion-safe
- [ ] **Phase 4: Contact Page** - Validated front-end-only form, honest success state, direct contact details and area graphic
- [ ] **Phase 5: Polish & QA** - Responsive, keyboard, performance and screen-reader verification across both pages

## Phase Details

### Phase 1: Foundation & Design System

**Goal**: The site has a consistent bright, social-network visual identity and a portable file structure that every page builds on
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: FND-01, FND-02, FND-03, FND-04, FND-05
**Success Criteria** (what must be TRUE):

  1. Double-clicking `index.html` (and `contact.html` stub) opens it with styles, scripts and fonts all loading, with no server or build step
  2. A visible style-guide view shows the limited social-network palette, two font families and the handcrafted accents (squiggle divider and hero hand-drawn underline) applied from shared design tokens
  3. Self-hosted fonts render on load without a noticeable layout jump
  4. All body text/background token pairings meet WCAG AA contrast (4.5:1 or better)

**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 01-01-PLAN.md — Walking skeleton: file:// tests, tokens, self-hosted fonts, index/contact stubs, deferred main.js

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02-PLAN.md — Style guide view: contrast + design-system guards, component CSS, styleguide.html, REPLACE-ME.md

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03-PLAN.md — Font fallback metric tuning (no layout jump), 320px hero-word fit, human sign-off

**UI hint**: yes

### Phase 2: Shared Shell & Static Home

**Goal**: Visitors can read a complete, warm, professional Home page and navigate to Contact from a consistent header, footer and repeated calls to action
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: SHL-01, SHL-02, SHL-03, SHL-04, HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, HOME-06, HOME-07, HOME-08
**Success Criteria** (what must be TRUE):

  1. Visitor sees an always-visible header nav linking Home and Contact with the current page indicated, and a footer with placeholder contact details, area served and a "Prototype - sample content" note
  2. Visitor reads a hero (value proposition, supporting line, primary CTA) with JavaScript disabled, then scrolls through four services with icons, a first-person About block with photo, 2-3 testimonials, a local-logo strip, a 3-step "How it works" and a closing CTA band
  3. Visitor can reach the contact page from "Let's talk" CTAs in the hero, mid-page and closing band, and a phone visitor sees a sticky "Let's talk" button while scrolling
  4. All placeholder content is clearly fictional and every swappable item is listed in `REPLACE-ME.md`

**Plans:** 6 plans

Plans:
**Wave 1**

- [ ] 02-01-PLAN.md — Shared header/footer on both pages, base spacing/hover/apostrophe fixes, failing Home contract test (check-home.js) and extended guards

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 02-02-PLAN.md — Split hero (lede, CTAs, trust cue, verified photo), descender-safe underline, CDP browser layout test

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 02-03-PLAN.md — Services 2x2 icon cards (tint) and first-person About with mid-page Let’s talk

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 02-04-PLAN.md — Testimonials (3 cards, tint) and six inline-SVG local logo wordmarks

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 02-05-PLAN.md — How it works timeline, navy closing band, phone sticky CTA (IntersectionObserver)

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 02-06-PLAN.md — REPLACE-ME.md audit, full guard sweep, human review checkpoint
**UI hint**: yes

### Phase 3: Kinetic Hero

**Goal**: The home page hero delivers the "wow" first impression: a bold, smooth cycling "Marketing for your [word]" headline that never harms readability, layout or accessibility
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06
**Success Criteria** (what must be TRUE):

  1. Visitor sees the headline's word cycle through bakery, gym, salon, shop, café, and more with a bold, smooth animated transition
  2. Surrounding text and the CTA stay put as words of different lengths cycle, at phone, tablet and desktop widths
  3. Visitor can pause and resume via a visible control; the cycle also pauses on hover/focus, when the tab is hidden and when the hero is off-screen
  4. Visitor with reduce-motion enabled, or with no JavaScript, sees a complete static headline with no cycling
  5. Screen-reader user hears one complete headline rather than each word change, and the animation runs without visible jank on a typical laptop and phone

**Plans**: TBD
**UI hint**: yes
**Research flag**: Needs deeper research before planning (CSS/WAAPI vs GSAP technique, grid-stack slot sizing with chosen fonts, WCAG 2.2.2 pause approach, reduced-motion behavior). Default to CSS-first, word-level.

### Phase 4: Contact Page

**Goal**: Visitors can fill in and "send" an enquiry through an accessible, validated, front-end-only form and find direct contact details
**Mode:** mvp
**Depends on**: Phase 2 (parallelizable with Phase 3)
**Requirements**: CON-01, CON-02, CON-03, CON-04, CON-05, CON-06, CON-07
**Success Criteria** (what must be TRUE):

  1. Visitor can complete a labeled form (name, email, business name, message), pick a business type matching the hero's list plus "Other", and tick any of the four services
  2. Submitting with missing or invalid fields (e.g. bad email) shows inline accessible error messages and moves focus to the first error
  3. A valid submit shows a friendly success message stating this is a prototype and nothing was sent
  4. Visitor sees placeholder `mailto:` and `tel:` contact details and a stylized area-served map graphic alongside the form

**Plans**: TBD
**UI hint**: yes

### Phase 5: Polish & QA

**Goal**: Both pages are verified polished, accessible and fast on real devices, and ready to show to clients
**Mode:** mvp
**Depends on**: Phase 3, Phase 4
**Requirements**: QA-01, QA-02, QA-03
**Success Criteria** (what must be TRUE):

  1. Both pages look polished at 320px+, tablet and desktop widths with no horizontal scrolling and tap targets of at least 44px
  2. Keyboard user can reach and operate every link, control and form field, each with a visible focus style
  3. Home first view loads within roughly a 500KB budget with no layout shift
  4. Double-click `file://` opening and subfolder static hosting both work, and header/footer match across pages

**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 / 4 (parallelizable) -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Design System | 3/3 | Complete    | 2026-10-12 |
| 2. Shared Shell & Static Home | 0/6 | Not started | - |
| 3. Kinetic Hero | 0/TBD | Not started | - |
| 4. Contact Page | 0/TBD | Not started | - |
| 5. Polish & QA | 0/TBD | Not started | - |
