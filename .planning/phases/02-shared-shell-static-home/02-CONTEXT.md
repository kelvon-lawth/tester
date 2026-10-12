# Phase 2: Shared Shell & Static Home - Context

**Gathered:** 2026-10-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the shared header and footer used on both pages (identical markup copied into `index.html` and `contact.html`, no JS includes), plus the complete static Home page: a hero (headline, supporting line, CTAs, trust cue, photo) that reads fully without JavaScript, then four services, About, testimonials, a local-logo strip, a 3-step "How it works" and a closing CTA band. Also covers repeated "Let's talk" CTAs, the mobile sticky CTA and a full `REPLACE-ME.md` swap list. Covers SHL-01..SHL-04 and HOME-01..HOME-08.

Not in this phase: the kinetic word cycling (Phase 3; the hero shows the static "Marketing for your bakery" built in Phase 1), the contact form and contact-page body (Phase 4), and the cross-device QA pass (Phase 5).

</domain>

<decisions>
## Implementation Decisions

### Hero composition
- **D-01:** Split layout. Text column (h1, supporting line, CTAs, trust cue) on the left and a warm photo of "the freelancer" on the right. On phones it stacks with text first, photo below. The photo is a hotlinked stock image (Phase 1 D-13: width/height set, meaningful alt, credit in REPLACE-ME.md).
- **D-02:** Two CTAs. A primary blue "Let's talk" button linking to `contact.html`, and a secondary "See how I help" text link that jumps to the services section anchor.
- **D-03:** The supporting line is local and personal, in first person, naming the fictional freelancer and town, e.g. "I'm [Name], a marketer right here in [Town]. I help neighbourhood businesses get found and get busy."
- **D-04:** One small trust-cue line near the CTAs, e.g. "Trusted by 40+ local businesses in [Town]". The number is a placeholder and listed in REPLACE-ME.md.
- **D-05:** The h1 stays the Phase 1 static markup ("Marketing for your bakery", with the blue hero word and coral underline) so that Phase 3 can animate it in place. The split layout must leave room for the longest word ("restaurant") without the photo column squeezing it (Phase 1 D-07).

### Section order & rhythm
- **D-06:** Section order after the hero: **Services → About → Testimonials → Logos → How it works → Closing CTA band → Footer.**
- **D-07:** The mid-page "Let's talk" CTA sits at the end of the About block as a personal hand-off (e.g. "Fancy a coffee and a chat? Let's talk."). This gives three Home CTAs: hero, About, closing band (SHL-03).
- **D-08:** Backgrounds are mostly white. The blue tint `#F1F5FF` goes on exactly 2 sections: Services and Testimonials. Navy is used only for the closing CTA band and the footer (Phase 1 D-02).
- **D-09:** Mobile sticky "Let's talk" button (SHL-04): hidden while the hero CTA is on screen, appears after scrolling past the hero, and hides again while the closing CTA band is visible. Use IntersectionObserver in classic deferred JS. Progressive enhancement: with no JS it is always shown on phone widths. Phone widths only, and it must not cover the footer content.

### Proof & section styling
- **D-10:** Testimonials are 3 cards. Each has a quote, a small round headshot (hotlinked stock, credited in REPLACE-ME.md), the person's name, the business and the town. No carousel (out of scope per REQUIREMENTS).
- **D-11:** The logo strip uses 5–6 invented inline-SVG wordmarks for fictional local businesses (e.g. "Rise & Crumb Bakery"). Each varies its type treatment and adds a tiny icon, all in monochrome navy/grey. No network requests. Every name is clearly fictional and listed in REPLACE-ME.md.
- **D-12:** "How it works" is a horizontal 3-step timeline (Chat → Plan → Grow) joined by a connecting squiggle. **That connector uses one of the two squiggle slots per page (Phase 1 D-10)**, so at most one other squiggle divider may appear on the Home page. On phones the timeline stacks vertically, and the connector is either hidden or turned vertical, with no horizontal scrolling.
- **D-13:** Services form a 2×2 grid of white cards on the blue-tint section. Each card has a blue line icon (Phase 1 D-12, `currentColor`), a title and a 1–2 sentence plain-language description. The grid is 1 column on phones. The four services are Social media, Local SEO & Google, Ads & campaigns, Branding & design.

### Shell
- **D-14:** The header nav is always visible and shows the wordmark plus the Home and Contact links. The current page is marked with `aria-current="page"` and a visible style. With only two links there is no hamburger menu. The header markup is identical on both pages.
- **D-15:** The footer (navy) carries placeholder email (`mailto:`), phone (`tel:`), the area served, the "Prototype — sample content" note and the copyright line. It is identical on both pages. The dev-only style-guide link added in Phase 1 stays until Phase 5.

### Claude's Discretion
- The fictional freelancer name, town, and a text-based header wordmark. They must be plausible and clearly fictional, and all listed in REPLACE-ME.md.
- All placeholder copy within the UI-SPEC tone rules (first person, sentence case, no jargon), including service descriptions, testimonial quotes, the About text and the step descriptions.
- Exact breakpoints, card styling details, the timeline squiggle geometry, the sticky button shape (full-width bar or pill) and its IntersectionObserver thresholds.
- Choice of stock photos (freelancer portrait, 3 headshots), within Phase 1 D-13.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design contract & prior decisions
- `.planning/phases/01-foundation-design-system/01-UI-SPEC.md` — Tokens, contrast table, copywriting contract (CTA strings, tone), interaction states
- `.planning/phases/01-foundation-design-system/01-CONTEXT.md` — Palette rules (coral never text on light), 2 fonts, squiggle cap, icon style, hotlinked photo rules (D-13)
- `.planning/phases/01-foundation-design-system/01-SKELETON.md` — File structure and architecture decisions Phase 2 builds on
- `.planning/phases/01-foundation-design-system/01-01-PLAN.md`, `01-02-PLAN.md`, `01-03-PLAN.md` — Class names and components built in Phase 1 (`.hero-word`, `.accent-underline`, `.divider-squiggle`, buttons, cards, grid, `REPLACE-ME.md`, guard scripts in `tools/`)

### Project scope & requirements
- `.planning/PROJECT.md` — Vision, two-page constraint, static only
- `.planning/REQUIREMENTS.md` — SHL-01..SHL-04, HOME-01..HOME-08; Out of Scope (no carousels, popups)
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria

### Research
- `.planning/research/SUMMARY.md`, `.planning/research/PITFALLS.md`, `.planning/research/ARCHITECTURE.md` — file:// constraints (classic deferred scripts, no fetch includes), generic-design pitfalls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 1 is planned but not yet executed. Once executed it provides `css/styles.css` (all tokens, buttons, links, cards, grid, squiggle divider, icon class), `js/main.js` (`js` and `fonts-loaded` classes), `index.html` and `contact.html` stubs with header/footer markers, `REPLACE-ME.md`, and the guard scripts `tools/check-portability.js`, `tools/check-contrast.js`, `tools/check-design-system.js` and `tools/smoke-test.js`.

### Established Patterns
- Tokens-only CSS (the design-system guard rejects hex outside `:root`), classic `<script defer>`, relative paths, and header/footer copied rather than included.

### Integration Points
- Phase 2 replaces the stub body of `index.html` and fills the shared header/footer on both pages. Phase 3 animates the hero h1 in place. Phase 4 fills the `contact.html` body. The extended guard scripts must keep passing.

</code_context>

<specifics>
## Specific Ideas

- Mid-page CTA wording idea: "Fancy a coffee and a chat? Let's talk."
- Trust cue idea: "Trusted by 40+ local businesses in [Town]".
- Logo wordmark example: "Rise & Crumb Bakery".
- Steps: Chat → Plan → Grow.

</specifics>

<deferred>
## Deferred Ideas

None. The discussion stayed within the phase scope.

</deferred>

---

*Phase: 02-shared-shell-static-home*
*Context gathered: 2026-10-12*
