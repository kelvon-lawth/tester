---
phase: quick-261022-bsb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - tools/check-home.js
  - tools/home-browser-test.js
  - tools/motion-browser-test.js
  - index.html
  - css/styles.css
  - REPLACE-ME.md
  - js/main.js
autonomous: true
requirements: [PRICING-01]

must_haves:
  truths:
    - "Home page shows a Pricing section with exactly 2 plans (Local Basics, Growth) between 'Three easy steps, no jargon' and the navy 'Let’s get your business busy' band"
    - "Growth is visually highlighted with a 'Most popular' badge; each plan shows name, GBP monthly price, feature list and a 'Let’s talk' button to contact.html"
    - "Plans sit side by side at 1280px and stack at 320px with no horizontal scroll"
    - "Pricing cards animate in (transform/opacity only) with GSAP, fall back to the IO reveal without GSAP, and are fully visible with no JS or reduced motion"
    - "All 10 tools/* guards pass"
  artifacts:
    - path: "index.html"
      provides: "section#pricing with aria-labelledby=pricing-title, ul.pricing-grid, 2 article.pricing-card"
      contains: 'id="pricing"'
    - path: "css/styles.css"
      provides: ".pricing-grid, .pricing-card, .pricing-card--featured, .pricing-card__badge styles"
      contains: ".pricing-card"
    - path: "js/main.js"
      provides: "pricing choreography in choreography() and .pricing-card in REVEAL_TARGETS"
      contains: ".pricing-card"
    - path: "tools/check-home.js"
      provides: "groups.pricing, updated order and replace groups"
      contains: "groups.pricing"
    - path: "REPLACE-ME.md"
      provides: "## Pricing table of placeholder plan copy"
      contains: "## Pricing"
  key_links:
    - from: "index.html .pricing-card a.btn"
      to: "contact.html"
      via: "href"
      pattern: 'class="btn btn--primary" href="contact.html">Let’s talk</a>'
    - from: "js/main.js REVEAL_TARGETS"
      to: "tools/motion-browser-test.js TARGETS"
      via: "selector lists kept in sync"
      pattern: "\\.pricing-card"
---

<objective>
Add a two-option Pricing section to the Home page (index.html) per the user request "create a pricing section for the main page. show 2 options".

Purpose: Visitors see clear, friendly, local pricing before the closing call to action.
Output: New #pricing section (markup, CSS, motion), placeholder copy logged in REPLACE-ME.md, guards extended to cover it.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@index.html
@REPLACE-ME.md
@tools/check-home.js

Runs on the main tree (no worktree). Do NOT touch `.claude/`. Every commit message ends with:
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

<interfaces>
Facts extracted from the codebase (no exploration needed):

index.html (main order today): section.hero, #services (section--tint), #about, #kind-words (section--tint), logos section (aria-labelledby="logos-title", section--tight), div.container > .divider-squiggle, #how-it-works (section--joined, h2#how-title), section.cta-band (aria-labelledby="cta-title"), then after </main> footer and the last element `<a class="btn btn--primary sticky-cta" href="contact.html">Let’s talk</a>`.
Existing card pattern: `<ul class="services-grid"><li><article class="card card--white service-card">…<h3>…</h3><p>…</p></article></li></ul>` and section heading `<div class="section-head"><h2 id="…-title">…</h2></div>`.
Icon pattern: `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="…"/></svg>`.

tools/check-home.js:
- helpers: sectionById(html,id), sectionByLabel(html,id), textOf(s), amp(s), count(text,re), mainOf(html)
- groups.order: `pos` array ends with ["#how-it-works", …], [".cta-band", …]; asserts exactly 2 section--tint (#services, #kind-words); asserts `lets.length !== 4` (Let’s talk links, all href contact.html)
- groups.replace: required `## ` headings list and `terms` list checked in REPLACE-ME.md

tools/home-browser-test.js: LAYOUT scenario string returns `out` (overflow, cards, testimonialTops, stepTops…); results.layout checks l320/l768/l1280 with helpers `eq(a,n)` (tops within 2px) and `growing(a)`. Layout is measured with STATIC (reduced motion).

tools/motion-browser-test.js: HELPERS `const TARGETS=[…]` must stay in sync with REVEAL_TARGETS in js/main.js. CONTENT = TARGETS + extras; after scrolling, every CONTENT element must be "settled" (opacity 1, transform identity, no clip). => pricing cards must NOT carry any static transform (no scale(1.03) on the featured card), or the settled check fails.

js/main.js:
- GSAP IIFE: `choreography(cleanups)` builds one-shots via `oneShot(trigger, start, { onDone })` returning a timeline; helper `qa(sel, scope)`; `.section-head h2` is already auto-split by SplitText (new section heading gets it for free); testimonials pattern: per-card trigger, `fig.classList.add("is-animating")`, `tl.from(fig, {...})`, onDone `gsap.set(fig,{clearProps:"transform,opacity"})` + remove is-animating; `var wide = window.innerWidth >= 1024`.
- IO fallback IIFE: `REVEAL_TARGETS` array, `STAGGERED = /(^|\s)(service-card|testimonial|step)(\s|$)/`, `delayFor(el)` uses the parent LI index for `.service-card` inside an LI.
- Sticky CTA IIFE hides only over `.cta-band` and the footer (unchanged by this work).

tools/check-design-system.js rules that bite here:
- No hex / rgb / named colours outside :root; font-size must be var(--fs-*), font-weight var(--fw-*); no `font` shorthand.
- `var(--color-blue)` only allowed in a fixed selector list (.btn--primary, .link-cta, .service-card__icon, .step__badge, …). => Do NOT use var(--color-blue) in any pricing selector. Highlight with navy + coral (coral decorative only).
- No inline style= attributes; no straight apostrophes in visible text (use ’); forbidden CSS words: grain, noise, blob, feTurbulence, italic.
Tokens available: --color-bg/-tint/-navy/-ink/-ink-soft/-coral/-line, --fs-body/-label/-heading/-display, --fw-regular/-semibold, --space-xs…3xl, --radius-sm/md/lg/pill, --shadow-card-rest/-hover, --edge-card, --font-display, --dur-base, --ease-out, --lift.
Allowed text pairs (check-contrast.js): ink/white, ink-soft/white, white/navy, white on blue (buttons). Coral is never text on white.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: RED guards for the pricing section</name>
  <files>tools/check-home.js, tools/home-browser-test.js, tools/motion-browser-test.js</files>
  <behavior>
    - check-home `pricing` group: section#pricing exists with aria-labelledby="pricing-title", not section--tint; h2#pricing-title text "Simple monthly plans, no surprises"; section text includes "No contracts. Cancel any month."; exactly 2 `.pricing-card` articles inside `ul.pricing-grid`; card h3 texts are "Local Basics" then "Growth"; card 1 text contains "£195" and card 2 "£395", each followed by "a month"; each card has a `ul.pricing-card__features` with at least 4 `<li>`; each card contains `class="btn btn--primary" href="contact.html">Let’s talk</a>`; exactly one `pricing-card--featured`, it is the Growth card, and it contains `pricing-card__badge` with text "Most popular"; every svg in the section has aria-hidden="true" and focusable="false".
    - check-home `order`: insert ["#pricing", m.search(/<section[^>]*id="pricing"/)] between #how-it-works and .cta-band; change expected Let’s talk count from 4 to 6 (message updated).
    - check-home `replace`: add "## Pricing" to required headings and add terms "Local Basics", "Growth", "£195", "£395", "Most popular", "No contracts. Cancel any month." to the terms list.
    - home-browser-test LAYOUT: also return `pricingTops` (tops of `.pricing-card`) and `pricingLefts` count; results.layout asserts at 1280 the 2 pricing cards share a top (eq(…,2)) and have 2 distinct lefts; at 320 the 2 cards stack (growing tops). Update the group's return message to mention pricing.
    - motion-browser-test: add '.pricing-card' to the HELPERS TARGETS array (keep in sync with main.js REVEAL_TARGETS, which Task 3 updates).
  </behavior>
  <action>Edit tools/check-home.js: add `groups.pricing` using the existing helpers (sectionById, textOf, amp, count) in the same style as groups.services and groups.steps, then update groups.order and groups.replace exactly as described in behavior. Add a short comment "quick 261022-bsb: pricing section" above the new group and above each changed line. Edit tools/home-browser-test.js LAYOUT string and results.layout as described (keep existing assertions untouched). Edit tools/motion-browser-test.js TARGETS. Run `node tools/check-home.js` and confirm it FAILS only in pricing, order and replace (RED). Commit: `test(quick-261022-bsb): add RED guards for home pricing section`.</action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/check-home.js pricing order replace; test $? -eq 1 && node tools/check-home.js shell hero vendor services about testimonials logos steps band sticky</automated>
  </verify>
  <done>check-home fails on pricing/order/replace with clear messages; all other check-home groups still pass; browser tests contain the new pricing assertions and TARGETS entry.</done>
</task>

<task type="auto">
  <name>Task 2: Pricing markup, styles and REPLACE-ME entries</name>
  <files>index.html, css/styles.css, REPLACE-ME.md</files>
  <action>
index.html: insert a new section between the closing `</section>` of #how-it-works and `<section class="section cta-band" …>`. Structure: `<section id="pricing" class="section pricing" aria-labelledby="pricing-title">` > `.container` > `<div class="section-head"><h2 id="pricing-title">Simple monthly plans, no surprises</h2><p>No contracts. Cancel any month. Every plan starts with a free coffee and a chat.</p></div>` > `<ul class="pricing-grid">` with two `<li>` each holding `<article class="card card--white pricing-card" aria-labelledby="plan-basics-title|plan-growth-title">`. Do NOT add section--tint (exactly two tints are required).
Card contents in DOM order: (Growth only) `<p class="pricing-card__badge">Most popular</p>`; `<h3 id="plan-…-title">Local Basics|Growth</h3>`; `<p class="pricing-card__for">` one-line audience (Basics: "For shops and cafés that want to be found and stay visible." Growth: "For busy businesses ready to bring in more new faces."); `<p class="pricing-card__price"><span class="pricing-card__amount">£195</span> <span class="pricing-card__period">a month</span></p>` (Growth £395) — plain text so screen readers hear "£195 a month", never "/mo"; `<ul class="pricing-card__features">` items, each `<li>` starting with a check icon `<svg class="icon pricing-card__check" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>` followed by text. Features drawn from the four services — Local Basics: "Google Business Profile set up and kept fresh", "8 social media posts a month", "Local SEO health check every quarter", "A monthly check-in over coffee". Growth: "Everything in Local Basics", "16 social media posts a month, plus stories", "Local ads and campaigns run for you (ad spend separate)", "A branding and design refresh for your logo, sign or menu", "Plain-English results report every month". Last child: `<a class="btn btn--primary" href="contact.html">Let’s talk</a>`. Growth article gets the extra class `pricing-card--featured`. Use curly ’ for every apostrophe; no inline styles.

css/styles.css: add a "Pricing (quick 261022-bsb)" block after the steps/How-it-works rules and before the cta-band rules, tokens only. `.pricing-grid`: list reset, display grid, gap var(--space-xl), single column, max-inline-size about 60rem centred with margin-inline auto; `@media (min-width: 768px)` two equal columns, align-items stretch. `.pricing-card`: display flex, flex-direction column, gap var(--space-md), block-size 100%, padding var(--space-xl). `.pricing-card__amount`: font-family var(--font-display), font-size var(--fs-heading), font-weight var(--fw-semibold), color var(--color-ink), line-height 1. `.pricing-card__period` and `.pricing-card__for`: color var(--color-ink-soft). `.pricing-card__features`: list reset, grid, gap var(--space-sm); each li display flex, gap var(--space-sm), align-items flex-start; `.pricing-card__check` color var(--color-navy), margin-block-start 2px. `.pricing-card .btn`: margin-block-start auto, align-self flex-start (full width below 640px is fine). `.pricing-card--featured`: border-color var(--color-navy), border-width 2px, box-shadow var(--shadow-card-hover), plus a decorative coral top bar via `::before` (absolute, inset-block-start 0, inline 0, block-size 6px, background var(--color-coral), border-radius var(--radius-lg) var(--radius-lg) 0 0, aria-free since pseudo). `.pricing-card__badge`: align-self flex-start, background var(--color-navy), color var(--color-bg), font-size var(--fs-label), font-weight var(--fw-semibold), padding var(--space-xs) var(--space-md), border-radius var(--radius-pill). Add `.pricing-card` to the existing hover-lift selector groups (`.service-card::after, .testimonial::after` layer, the `:hover::after/:focus-within::after` opacity rule, and the `(hover: hover) and (prefers-reduced-motion: no-preference)` translateY lift) so pricing cards behave like the other white cards. NEVER use var(--color-blue) in pricing selectors (check-design-system blue allow-list) and NEVER give `.pricing-card` a resting transform (motion test requires identity transform at rest). Ensure nothing overflows at 320px (long feature lines must wrap: min-inline-size 0 on grid children).

REPLACE-ME.md: add a `## Pricing` section after `## Copy blocks` (before `## Shell`) with a table (Item | Current placeholder | File | How to find it | Done) listing: section heading "Simple monthly plans, no surprises"; intro line "No contracts. Cancel any month. Every plan starts with a free coffee and a chat."; plan 1 name "Local Basics" and price "£195 a month" (placeholder, set real price); plan 1 audience line and features; plan 2 name "Growth" and price "£395 a month"; plan 2 audience line and features; badge "Most popular" (on Growth). Each row: file `index.html`, how-to-find e.g. `#pricing .pricing-card` / `.pricing-card__badge`, Done `[ ]`.
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/check-home.js && node tools/check-design-system.js && node tools/check-contrast.js && node tools/check-portability.js && node tools/smoke-test.js</automated>
  </verify>
  <done>check-home prints HOME OK (pricing, order with 6 Let’s talk links, replace all pass); design-system, contrast, portability and smoke guards pass. Commit: `feat(quick-261022-bsb): two-plan pricing section on Home`.</done>
</task>

<task type="auto">
  <name>Task 3: Pricing motion (GSAP choreography + IO fallback) and full guard run</name>
  <files>js/main.js</files>
  <action>
GSAP path: inside `choreography(cleanups)`, after the testimonials block, add a "Pricing" block modelled on the testimonials per-card pattern so stacked phone cards animate as each arrives: for each `.pricing-card` (index i) create `oneShot(card, "clamp(top 88%)", { onDone })`, add `is-animating` to the card, `tl.from(card, { y: 56, opacity: 0, duration: 1, delay: wide ? i * 0.12 : 0 })`, then cascade that card's feature `li`s with `tl.from(items, { y: 16, opacity: 0, duration: 0.6, stagger: 0.06 }, 0.3)`, and for the featured card pop its `.pricing-card__badge` with `tl.from(badge, { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(2)" }, 0.4)`. onDone: `gsap.set([card, badge].concat(items).filter(Boolean), { clearProps: "transform,opacity" })` and remove `is-animating`. Animate only transform and opacity (no clip-path, no box-shadow, no layout properties). The new `.section-head h2` is already covered by the existing section-heading SplitText reveal; do not add a second one.
IO fallback IIFE: add ".pricing-card" to REVEAL_TARGETS (keep identical to tools/motion-browser-test.js TARGETS updated in Task 1), add `pricing-card` to the STAGGERED regex, and in `delayFor` treat `.pricing-card` inside an LI the same as `.service-card` (use the parent LI index) so the second card is staggered.
Do not touch the sticky-CTA IIFE (pricing sits above .cta-band; existing hide zone stays correct). Reduced motion and no-JS need no code: the GSAP branch only runs under prefers-reduced-motion: no-preference and the IO fallback bails under reduce, so cards are visible by default.
Then run every guard. If a browser test fails because of the new section, fix the cause in index.html/css/main.js rather than weakening an assertion.
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && for t in check-contact check-contrast check-design-system check-home check-portability smoke-test font-metrics-test home-browser-test contact-browser-test motion-browser-test; do node tools/$t.js >/dev/null 2>&1 && echo "PASS $t" || { echo "FAIL $t"; node tools/$t.js | tail -20; }; done</automated>
  </verify>
  <done>All 10 tools/* guards print PASS (motion-browser-test choreo, choreo-jump and IO-fallback groups include the 2 pricing cards and they settle; home-browser-test layout and sticky pass). Commit: `feat(quick-261022-bsb): pricing card choreography and reveal fallback`.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| none | Static HTML/CSS/JS prototype; no user input, network calls or storage added |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-261022-01 | Information disclosure | Placeholder prices shown as real | mitigate | All plan names/prices/features listed in REPLACE-ME.md `## Pricing` for swap before launch; footer already states "Prototype — sample content" |
| T-261022-02 | Tampering | js/main.js DOM work | accept | Only static selectors and GSAP tweens; no innerHTML or external data |
</threat_model>

<verification>
- `node tools/check-home.js` prints HOME OK with the new pricing group.
- All 10 guards pass (loop in Task 3 verify).
- Open index.html over file:// at 1280px and 320px: pricing sits after "Three easy steps, no jargon" and before the navy band; two cards side by side on desktop, stacked on phone, Growth highlighted with "Most popular".
</verification>

<success_criteria>
- Exactly 2 pricing plans on Home, correct placement, Growth featured, CTAs to contact.html.
- Design-system, contrast, reduced-motion and no-JS behaviour preserved; animation uses transform/opacity only.
- REPLACE-ME.md lists every new placeholder.
- 3 atomic commits with the Co-Authored-By trailer.
</success_criteria>

<output>
Create `.planning/quick/261022-bsb-add-pricing-section-with-two-options-to-/261022-bsb-SUMMARY.md` when done
</output>
