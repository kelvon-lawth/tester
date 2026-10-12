# Technology Stack

**Project:** Local Freelance Marketer Website (Prototype)
**Researched:** 2026-10-12

## Recommendation in One Line

Plain HTML + CSS + vanilla JS (no build step), with GSAP 3.15 + SplitText (vendored locally as classic scripts) for the kinetic hero, and native browser form validation. Opens by double-clicking index.html and deploys to any static host unchanged.

## Recommended Stack

### Core
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| HTML5 (hand-written, 2 files: index.html, contact.html) | n/a | Pages | Two pages do not justify a framework. Duplicating header/footer across two files is cheaper than any templating setup. Zero toolchain means it works over file:// and on any host. | HIGH |
| CSS (single stylesheet, custom properties, grid/flex, clamp()) | n/a | Layout, theme, warm/handcrafted accents | Modern CSS covers everything needed: design tokens as variables, fluid type via clamp(), SVG/CSS textures, `prefers-reduced-motion`. No Tailwind or Sass needed at this size. | HIGH |
| Vanilla JS (classic `<script defer>`, not `type="module"`) | ES2020+ | Hero orchestration, form validation, mobile nav | Module scripts are blocked by CORS on file:// in Chrome, which would break the "opens locally" requirement. Classic scripts avoid it. | HIGH |

### Animation
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| GSAP | 3.15.0 (npm latest, verified 2026-10-12) | Timeline for cycling-word hero, entrance reveals | Best-in-class timeline control for sequenced per-letter motion, with `gsap.matchMedia()` for reduced-motion branching. Vendor `gsap.min.js` locally. | HIGH on version, MEDIUM on licensing note below |
| GSAP SplitText plugin | bundled with 3.15.0 | Split the cycling word into chars for staggered kinetic in/out | Handles splitting, `aria` labelling, and revert. SplitText and all former "Club" plugins were made free for all uses (including commercial) after Webflow acquired GSAP. Verify the current license text at gsap.com/standard-license when vendoring. | MEDIUM (licensing from memory plus npm presence; confirm) |

### Form
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Constraint Validation API + `required`, `type="email"`, `minlength`, `novalidate` + custom messages | native | Validate name/email/business/message; show inline errors and a success state | No library needed. Use `novalidate` on the form, check `form.checkValidity()`/`input.validity` on submit, render inline error text with `aria-describedby` and `aria-live="polite"`, `preventDefault()`, then swap in a success message. | HIGH |

### Infrastructure
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Any static host (Netlify Drop, GitHub Pages, Cloudflare Pages, Vercel) | n/a | Deploy | Folder of files, no config. | HIGH |
| `npx serve` or VS Code Live Server (optional, dev only) | n/a | Local preview with live reload | Optional. file:// also works. | HIGH |

### Supporting
| Item | Purpose | When to Use |
|------|---------|-------------|
| Self-hosted WOFF2 fonts (e.g., a warm display serif or hand-feel face plus a clean sans, from Fontsource/Google Fonts download) | Typography personality | Self-host so the prototype works offline and avoids layout shift. Use `font-display: swap`. A Google Fonts `<link>` is acceptable for speed if offline is not needed. |
| Inline SVG (hand-drawn underline, squiggles, blob shapes), CSS `background-image` noise/paper texture (SVG feTurbulence or small PNG) | Handcrafted accents | No icon or illustration library needed. |
| Placeholder images (local files, WebP) | Photo, logos | Keep in `/assets`. Use `loading="lazy"` below the fold, explicit width/height. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Site framework | Plain HTML/CSS/JS | Astro 7.3.8 | Astro is the right call if this grows to many pages, content collections, or shared layouts. For two files its build step, Node dependency, and `dist/` output (which does not open correctly from file:// with absolute asset paths unless configured) cost more than the shared-layout benefit. Easy migration later because markup is already semantic HTML. |
| Build tool | None | Vite 8.3.4 | Gives HMR and bundling, but built output uses module scripts that fail over file://. Adds toolchain for no gain here. Reasonable only if moving to a JS framework. |
| Animation | GSAP + SplitText | CSS-only (keyframes + manual span splitting) | Viable and zero-dependency for a simple word swap, and it is the fallback path I recommend for reduced motion. But per-letter stagger, overlapping in/out, and interruptible timelines get brittle in pure CSS; the hero is the core value, so use the stronger tool. |
| Animation | GSAP + SplitText | Motion (motion 14.1.0, ex-Framer Motion) | Excellent for React or declarative UI. Its vanilla `animate()` is fine but has no SplitText equivalent and weaker timeline sequencing for this use. |
| Animation | GSAP + SplitText | anime.js 4.5.0 | Capable, has a text splitter in v4, smaller. A credible second choice if you want to avoid GSAP licensing questions, but the ecosystem, docs, and reduced-motion tooling are stronger in GSAP. |
| Form validation | Native API | Zod / Yup / validator libs / Formspree | Overkill for four fields and no backend. A service like Formspree contradicts "front-end only" scope. |
| Styling | Hand-written CSS | Tailwind, Bootstrap | Utility or component frameworks push a generic look, which fights the handcrafted/warm goal. Tailwind also needs a build step. |
| Scroll libs | None (CSS + IntersectionObserver, or GSAP if needed) | Lenis, ScrollTrigger, AOS | Not required. Add ScrollTrigger only if scroll-driven reveals are wanted; it ships in the same GSAP package. |

## Implementation Notes (prescriptive)

- Vendor files: `assets/js/vendor/gsap.min.js` and `SplitText.min.js` (from the npm `gsap` package `dist/`), loaded with `<script defer>` before `main.js`. Pin the version in a comment.
- Cycling hero: one timeline per word (chars out, swap text, chars in), `repeat: -1` via a recursive or looping timeline. Reserve the width of the longest word (or animate container width) to prevent layout shift. Provide a visually-hidden full sentence for screen readers and `aria-hidden` on the animated span.
- Reduced motion: wrap in `gsap.matchMedia()` with `(prefers-reduced-motion: reduce)` to show a static first word (or a gentle fade swap). Default no-JS state shows a static "Marketing for your business" so the page is fine if the script fails.
- Animate only `transform` and `opacity` for smoothness on phones.
- Pause the cycle when the tab is hidden (`document.visibilitychange`) and optionally when off-screen.
- Shared header/footer: copy-paste across two files; keep them identical. No JS includes (fetch fails on file://).

## Installation

```bash
# No project install required. To obtain vendored files once:
mkdir /tmp/gsap-pull && cd /tmp/gsap-pull && npm pack gsap@3.15.0
# extract, then copy package/dist/gsap.min.js and package/dist/SplitText.min.js into assets/js/vendor/

# Optional dev preview
npx serve .
```

## Version Verification

Checked with `npm view <pkg> version` on 2026-10-12: gsap 3.15.0, astro 7.3.8, vite 8.3.4, motion 14.1.0, animejs 4.5.0. Context7 and the official docs were not consulted for API specifics; verify the SplitText API (`SplitText.create(el, {type: "chars"})`) against gsap.com/docs when implementing.

## Sources

- npm registry (`npm view`), 2026-10-12: HIGH for version numbers
- GSAP licensing/free plugins statement: recalled from the Webflow/GSAP announcement; confirm at https://gsap.com/standard-license: MEDIUM
- file:// module-script CORS restriction: well-established browser behavior: HIGH
