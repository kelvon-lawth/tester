# Feature Landscape

**Domain:** Freelance / local marketer portfolio-style site (2 pages: Home + Contact)
**Researched:** 2026-10-12
**Confidence:** MEDIUM. Based on well-established conventions for freelancer and local-service sites and on PROJECT.md constraints. No live competitor audit or web search was run, so treat patterns as convention, not measured data.

## Page Allocation (strict 2-page limit)

| Page | Job | Sections (in order) |
|------|-----|---------------------|
| Home | Make the first impression, build trust, explain the offer, push to contact | Header/nav, Hero (kinetic headline + CTA), Services (4), About/intro with photo, Community proof (testimonials + logos), How it works (short process), Closing CTA band, Footer |
| Contact | Remove friction for the one conversion | Header/nav, Short warm intro, Form, Alternate contact details (email, phone, area, hours), Reassurance (reply time, free chat), Footer |

The About, Process and Proof content lives on Home as sections. There is no separate about, portfolio or pricing page.

## Table Stakes

Missing any of these makes the site feel unfinished or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Hero with clear value proposition and primary CTA | Visitors decide in seconds what you do and for whom | Low | Headline must state "marketing for local businesses" even if the animation is mid-cycle; the static subhead carries the meaning |
| Services section with 4 offerings | Visitors need to see what they can buy | Low | Social media, Local SEO & Google, Ads & campaigns, Branding & design. One-line benefit-led description each, plain language, no jargon |
| About/intro block with photo and first-person copy | Hiring a freelancer means hiring a person | Low | Placeholder photo. Mention the town and why they do this work |
| Testimonials | Strongest trust signal for local buyers | Low | 2 to 3 quotes with name, business and type (placeholder) |
| Local business logos or "worked with" strip | Social proof at a glance | Low | Placeholder marks. Style as neighborly, not corporate |
| Repeated CTAs (header, hero, mid-page, closing band, footer) | Single conversion goal, so every scroll position needs a path | Low | Consistent label such as "Let's chat". All link to the Contact page |
| Shared header/nav and footer | Basic wayfinding on both pages | Low | Mobile menu is tiny with two links, so consider a persistent inline CTA instead of a hamburger |
| Contact form (name, email, business, message) | Primary conversion | Medium | Inline validation, clear error text, labels (not placeholder-only), accessible error association |
| Form success state | Without a backend, the success state is what sells realism | Low | Replace form with a friendly thank-you message; keep the focus management accessible |
| Visible direct contact details | Many local owners prefer to call or email | Low | Placeholder email, phone, service area. Use mailto/tel links |
| Responsive layout, phone-first | Most local owners browse on phones | Medium | Test hero text wrapping on small screens, because cycling words have different lengths |
| Readable, accessible basics | Professional baseline | Medium | Contrast, focus states, semantic HTML, alt text, keyboard-usable form |
| Fast load, static hosting | Stated constraint | Low | Optimise images, avoid heavy animation libraries |
| Reduced-motion support | Stated constraint and accessibility norm | Low | Static fallback showing one headline or a non-animated list of words |

## Differentiators

These make the site memorable and "local" rather than generic agency.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Kinetic-typography hero cycling business types | The "wow" moment; shows "for anyone in town" in one gesture | Medium to High | CSS or small JS. Handle variable word widths without layout shift, pause on hover or when the tab is hidden, and keep an accessible static text equivalent (aria-live off or a single label) |
| Handcrafted accents (hand-drawn underlines, squiggles, doodle arrows, paper/grain texture, slightly rotated cards) | Signals human and local without clutter | Medium | Inline SVG, subtle. Keep the layout grid clean so it still reads professional |
| Earthy, warm palette plus characterful type pairing | Distinct from blue/corporate agency sites | Low | Defined once as design tokens and reused everywhere |
| Town-specific copy hooks (neighborhood names, "your neighbor in [Town]") | Local identity beats generic claims | Low | Placeholder tokens that are easy to swap |
| Friendly "How it works" in 3 steps (chat, plan, grow) | Reduces fear for non-marketers | Low | Short; fits on Home without a new page |
| Service cards with small illustrations or hover micro-interaction | Adds polish without extra pages | Low to Medium | Keep subtle; touch devices need an equivalent to hover |
| Subtle scroll-reveal animations | Cohesive motion language with the hero | Medium | Respect reduced motion; do not delay content visibility |
| Business-type picker in the form (dropdown or chips: bakery, gym, salon...) | Echoes the hero and qualifies the lead | Low | Optional field; keeps the form short |
| Form copy that sets expectations ("I reply within a day, no pressure") | Warms up the conversion | Low | Pure copy |
| Sticky or floating CTA on Home | Keeps the conversion path visible | Low | Make sure it does not cover content on phones |
| Real-seeming result snippets in testimonials ("30% more bookings") | Concrete proof | Low | Clearly placeholder, easy to replace |

## Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Extra pages (blog, portfolio, pricing, separate About) | Violates the 2-page scope | Fold into Home sections; link anchors from the nav if useful |
| Pricing tables | Locks in numbers; needs a page; placeholder prices mislead | "Free chat" CTA; mention packages are tailored |
| Live chat widget / chatbot | Needs a backend and clashes with the human feel | Direct email/phone plus the form |
| Real form submission, email service, CAPTCHA | Out of scope; adds infrastructure | Front-end validation and fake success; code comments marking the future hook-up point |
| Newsletter signup, popups, cookie banners | Annoying, needs backend or compliance, unnecessary for a prototype | Single clear CTA |
| Analytics, tracking, SEO tuning | Declared out of scope | Basic title and meta tags only |
| Heavy stock "agency" imagery (handshakes, laptops, charts) | Feels corporate and fake | Placeholder photos of local-feeling scenes; warm illustrations |
| Autoplay video or background video | Hurts performance and fights the kinetic headline | Let the type be the motion |
| Parallax-heavy or multiple competing animations | Muddies the one wow moment, harms phones | One hero animation plus subtle reveals |
| Carousels for testimonials | Low engagement, accessibility problems | Static grid of 2 to 3 cards |
| Dark patterns / fake urgency ("only 2 spots left") | Breaks the warm, honest tone | Honest, low-pressure copy |
| CMS or admin panel | Out of scope | Hand-edited HTML with clearly marked placeholders |
| Jargon-heavy service copy (ROAS, SERP, CTR) | Alienates bakery and gym owners | Plain benefits such as "get found on Google Maps" |

## Feature Dependencies

```
Design tokens (palette, type, spacing) -> every visual feature
Shared header/footer -> CTAs that link to Contact
Hero static copy -> kinetic animation (animation is an enhancement over meaningful static text)
Reduced-motion fallback -> kinetic hero, scroll reveals
Handcrafted SVG accents -> design tokens and base layout
Placeholder content tokens (name, town) -> About, testimonials, hero subhead, footer, contact details
Contact page form markup -> validation -> success state
Business-type list (shared data) -> hero cycling words AND optional form picker
Responsive layout -> hero word-width handling, nav behaviour
```

## MVP Recommendation

Everything in the table stakes is in scope for the prototype, since the project is the polished concept. Build order:

1. Design tokens, base layout, shared header/footer (foundation)
2. Home sections with static content: hero (static), services, about, proof, process, closing CTA
3. Kinetic hero animation with reduced-motion fallback (the core value)
4. Contact page with validated form and success state
5. Handcrafted accents, scroll reveals, responsive polish and accessibility pass

Defer: sticky CTA and service-card micro-interactions (nice-to-have if time allows). Never build: anything in Anti-Features.

## Sources

- PROJECT.md (scope, constraints, core value). HIGH confidence for requirements alignment.
- General conventions for freelancer and local-service sites (hero + services + proof + single CTA). MEDIUM confidence; from experience of the domain, not verified against specific sources in this session.
- Accessibility guidance (WCAG, prefers-reduced-motion) as general standards. MEDIUM confidence.
