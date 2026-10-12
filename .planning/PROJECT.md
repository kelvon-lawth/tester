# Local Freelance Marketer Website (Prototype)

## What This Is

A two-page prototype website for a freelance marketer who offers advertising and marketing help to anyone in their town: bakeries, gyms, salons, shops and other local businesses. It should look professional but feel local, warm and human, with a standout kinetic-typography motion graphic on the home page. Content is placeholder (name, city, testimonials, photos) so the real details can be swapped in later.

## Core Value

The home page must make a strong first impression: polished, professional and warm, with an impressive animated headline. A visitor should immediately read "a real local person who can grow my business."

## Requirements

### Validated

- [x] Subtle handcrafted accents (squiggle dividers, hero underline) and a bright "social network" palette (white, social blue, coral pop, navy) on a clean professional layout — Validated in Phase 1: Foundation & Design System
- [x] Runs as a static site: opens locally or deploys to any static host — Validated in Phase 1: Foundation & Design System

### Active

- [ ] Home page with a hero section whose kinetic-typography headline cycles business types ("Marketing for your [bakery / gym / salon / shop / …]") with a bold animated transition
- [ ] Services section featuring four offerings: Social media, Local SEO & Google, Ads & campaigns, Branding & design
- [ ] Warm, human tone throughout: friendly first-person copy and a freelancer intro/about block with a placeholder photo
- [ ] Community proof: placeholder testimonials and logos from local businesses
- [ ] Contact page with a realistic form (name, email, business, message) that validates input and shows a success message, with no backend
- [ ] Shared header/navigation and footer linking the two pages, with clear "get in touch" calls to action
- [ ] Responsive: polished on desktop and phone

### Out of Scope

- Additional pages (blog, portfolio, pricing, separate about page) — user specified exactly two pages
- Real form submission or email delivery — prototype; form is front-end only
- CMS or admin panel — content is placeholder and hand-edited
- Real business name, branding, photos or testimonials — placeholders until the real freelancer's details exist
- Analytics, cookies and SEO tuning — not needed for a show-ready prototype

## Context

- Audience for the prototype: showing to clients or stakeholders as a polished concept
- The freelancer sells to small local businesses of any type, so imagery and copy should feel inclusive and neighborly, not corporate-agency
- Motion is the "wow" moment; it should be smooth and also respect reduced-motion preferences
- Greenfield: empty directory, no existing code

## Constraints

- **Scope**: Exactly two pages (Home, Contact) — per user request
- **Hosting**: Static only, no server — prototype must open without backend infrastructure
- **Content**: Placeholders acceptable — prototype stage
- **Performance**: Animation must stay smooth on typical laptops and phones

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Freelance marketer persona (not agency) | User choice; drives the warm first-person tone | — Pending |
| Kinetic typography with cycling business-type words as hero motion | User choice; shows "for anyone" while being the visual hook | — Pending |
| Front-end-only contact form with validation and success state | Prototype; no backend needed | — Pending |
| Local feel = warm & human + community proof + handcrafted look | User choice | — Pending |
| Palette: "social network brights" (white, social blue #3B5BFD, coral pop #FF6B6B, navy #1B2A4A) instead of earthy tones | User asked for colors closer to networks (2026-10-12) | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-12 after Phase 1 completion*
