# Architecture Patterns

**Domain:** Two-page static marketing site (kinetic-typography hero, no backend)
**Researched:** 2026-10-12
**Confidence:** MEDIUM-HIGH. Based on established static-site practice and browser behavior. No external sources were consulted for this file, so verify the `file://` module caveat in the first build phase.

## Recommended Architecture

Plain HTML + CSS + small vanilla JS files. No framework, no bundler, no build step. The site must open by double-clicking `index.html` and deploy to any static host. For two pages, a build tool adds risk and no benefit.

```
/
├── index.html              Home: hero, services, about, proof, CTA
├── contact.html            Contact: form + success state
├── css/
│   ├── tokens.css          Design tokens (CSS custom properties)
│   ├── base.css            Reset, typography, textures, utilities
│   ├── layout.css          Header, footer, container, grid, buttons
│   ├── sections.css        Home sections (hero, services, about, proof, CTA)
│   └── contact.css         Form and success state
├── js/
│   ├── nav.js              Mobile menu toggle (both pages)
│   ├── hero-cycler.js      Word cycling (home only)
│   └── contact-form.js     Validation and success state (contact only)
├── assets/
│   ├── fonts/              Self-hosted woff2
│   ├── img/                Placeholder photo, textures, SVG doodles
│   └── logos/              Placeholder local-business logos (SVG)
```

Load order: `tokens.css` then `base.css` then `layout.css`, then the page-specific CSS. JS goes in classic `<script defer>` tags, not ES modules. Browsers block `type="module"` scripts over `file://` because of CORS, which would break the "opens locally" requirement.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Design tokens (`tokens.css`) | Palette, type scale, spacing, radii, shadows, motion durations and easings. The only place raw values live. | Read by every other stylesheet. Depends on nothing. |
| Base and texture layer (`base.css`) | Reset, body type, paper/grain texture, hand-drawn SVG utilities, focus styles, `prefers-reduced-motion` global rules | Tokens |
| Shared shell (header, nav, footer) | Brand, links between the two pages, "Get in touch" CTA, mobile menu. Same markup on both pages. | Tokens. `nav.js` toggles the menu. |
| Hero module | Static headline plus the cycling word slot. Owns the kinetic animation. | Tokens (motion vars). `hero-cycler.js` reads the word list from the DOM. |
| Content sections | Services (4 cards), about/intro with photo, testimonials, logo strip, closing CTA. Each is a self-contained `<section>` with its own class prefix. | Tokens. CTAs link to `contact.html`. |
| Contact form module | Fields, inline errors, success panel | Tokens. `contact-form.js` owns the state. No network. |
| Placeholder content | Name, city, testimonials, photo, logos | Isolated in HTML text and `assets/`, so the swap is search-and-replace. |

### Data Flow

There is no server and no shared runtime state. Flow is one-directional:

- **Styling:** tokens flow to base, then layout, then sections. A change to a token propagates everywhere.
- **Hero words:** the word list lives in the HTML (e.g. `data-words="bakery,gym,salon,shop"` or a `<ul>`). `hero-cycler.js` reads it, then drives a timer that sets the active word and toggles CSS classes. CSS performs the animation. JS sets state and CSS renders it.
- **Form:** user input goes to `contact-form.js`. It validates, then either shows inline errors or hides the form and reveals the success panel by toggling `hidden`. Nothing leaves the browser. The submit handler is the single seam where a real endpoint (Formspree, Netlify Forms, etc.) could be added later.
- **Navigation:** plain `<a href>` between `index.html` and `contact.html`. No client router.

## Patterns to Follow

### Pattern 1: Tokens-first CSS custom properties
**What:** Define every color, size and duration as a variable in `:root`. Components never hardcode values.
**When:** Always. The earthy palette and later real-brand swap depend on it.
```css
:root {
  --color-clay: #b5532f;
  --color-cream: #f6efe3;
  --font-display: "Fraunces", Georgia, serif;
  --dur-word: 600ms;
  --ease-word: cubic-bezier(.2,.8,.2,1);
}
```

### Pattern 2: Progressive-enhancement hero
**What:** Write the HTML so it reads correctly with no JS and no animation (e.g. "Marketing for your local business"). JS upgrades it into the cycler.
**When:** Always for the hero. This gives the reduced-motion and no-JS fallback for free.
```js
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduce) startCycling(words);   // otherwise show first word, or a static list
```

### Pattern 3: JS toggles state, CSS animates
**What:** JS swaps a class or `data-state` attribute. Animation uses only `transform` and `opacity` (compositor-friendly), per-letter or per-word via `animation-delay`.
**When:** The kinetic hero. This keeps animation smooth on phones.

### Pattern 4: Accessible word cycling
**What:** Keep the animated word `aria-hidden="true"`. Provide a visually hidden full sentence or static list for screen readers. Do not use `aria-live` on a timer, because it would announce every cycle.
**When:** Hero.

### Pattern 5: Native validation, custom messaging
**What:** Use `<form novalidate>` with proper `type`, `required` and `autocomplete` attributes. In JS call `checkValidity()` and render custom inline error text linked by `aria-describedby`. On success move focus to the success panel (`tabindex="-1"`).
**When:** Contact form.

### Pattern 6: Duplicated shell, kept in sync
**What:** Copy the header and footer markup into both pages. With two pages, this is cheaper than includes or a build step. Keep the shell small and mark it with HTML comments.
**When:** Two pages. Revisit only if a third page is added.

## Anti-Patterns to Avoid

### Anti-Pattern 1: ES modules or `fetch()` for includes
**Why bad:** Fails over `file://` (CORS), breaking the "opens locally" requirement.
**Instead:** Classic deferred scripts and duplicated shell markup.

### Anti-Pattern 2: Framework or bundler for two pages
**Why bad:** Adds a toolchain, a build step and hosting assumptions. It also makes placeholder editing harder.
**Instead:** Hand-written HTML/CSS/JS.

### Anti-Pattern 3: Animating layout properties or relying on JS animation loops
**Why bad:** Animating width, height or top causes jank on phones. A `requestAnimationFrame` text loop is harder to keep smooth.
**Instead:** CSS transforms and opacity, with JS only toggling classes on a timer.

### Anti-Pattern 4: Layout shift from the changing word
**Why bad:** Words differ in length, so the headline reflows and jumps on every cycle.
**Instead:** Give the word slot a fixed `min-width` or `min-height` per breakpoint, or size the slot to the longest word. Test on narrow phones, where the slot may wrap to its own line.

### Anti-Pattern 5: Hardcoded colors and raster textures
**Why bad:** The warm palette becomes impossible to retune. Large PNG textures hurt load time.
**Instead:** Tokens, plus inline or small SVG textures and doodles (SVG `feTurbulence` grain or a tiny tiled image).

### Anti-Pattern 6: Third-party font and asset CDNs
**Why bad:** Breaks offline "open locally" use and adds flash-of-unstyled-text risk.
**Instead:** Self-hosted woff2, `font-display: swap`, preload the display font.

## Scalability Considerations

Scaling traffic is not a concern for a static site. The relevant growth axes are content and pages.

| Concern | Prototype (2 pages) | If real site (5-10 pages) | If larger |
|---------|---------------------|---------------------------|-----------|
| Shared shell | Duplicate markup | Static generator (Eleventy or Astro) with layouts | Same, add content collections |
| Content swap | Edit HTML text | Move to data files | CMS |
| Form | Client-only | Formspree or Netlify Forms, one endpoint swap | Serverless function |
| Hosting | Any static host or `file://` | Netlify, Cloudflare Pages, GitHub Pages | CDN with caching headers |

## Suggested Build Order

Dependencies flow from top to bottom. The order is driven by the Core Value, which is the home-page first impression, so the hero is built early and not left for last.

1. **Foundation: tokens, base, texture utilities, file skeleton.** Everything depends on it. Include fonts and palette, and a quick check that they render from `file://`.
2. **Shared shell: header, nav, footer, buttons, responsive container.** Needed by both pages. Build it once as `index.html`, then copy it into `contact.html`.
3. **Hero module (static first, then kinetic).** Build the static, accessible hero and its layout. Then add the cycler and animation, with the reduced-motion path. This is the highest-risk and highest-value component, so it comes before the content sections.
4. **Content sections: services, about with photo, testimonials and logos, closing CTA.** These are independent of each other and can be built in any order or in parallel. Add the handcrafted accents here.
5. **Contact page: form markup, validation, success state.** Independent of the home sections but needs the shell. Can run in parallel with step 4.
6. **Polish and verification: responsive pass on real phone widths, reduced-motion test, keyboard and focus check, performance check, cross-browser, and a `file://` open test.**

**Parallelism:** steps 4 and 5 are independent once steps 1 and 2 exist. Step 3 should not start before step 2.

## Roadmap Flags

- Hero (step 3) is the one place likely to need deeper phase-level research: the choice between per-letter and per-word animation, the layout-shift handling, and the reduced-motion behavior.
- Steps 1, 2, 4 and 5 use standard patterns and are unlikely to need research.

## Sources

- Reasoned from established static-site and web-platform practice. No external sources were consulted for this file.
- Claims to verify in the build: the `file://` module restriction (MDN, "CORS" and "JavaScript modules"); the `prefers-reduced-motion` media query (MDN); native form constraint validation (MDN, Constraint Validation API).
