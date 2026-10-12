# Pitfalls Research

**Domain:** Two-page static freelance-marketer site (local businesses) with kinetic-typography hero, placeholder content, front-end-only contact form
**Researched:** 2026-10-12
**Confidence:** MEDIUM (WCAG, CSS, and browser behaviors below are well-established practice from training knowledge; no live source verification was run this session. Specific values, such as the WCAG 2.2.2 5-second rule, should be re-checked at implementation time.)

## Critical Pitfalls

### Pitfall 1: Hero layout shift from varying word widths

**What goes wrong:**
The headline "Marketing for your [bakery / gym / salon / shop]" changes width every cycle. The words differ in length, so the line reflows, the CTA and subheading below jump, and centered text wobbles horizontally. On phones the line can wrap to two lines for "photographer" but not "gym", so the whole hero height changes. This breaks the "polished" first impression and adds CLS.

**Why it happens:**
The rotating word is built as inline text, and only the word's opacity or transform is animated. Nobody sets a fixed footprint for the slot.

**How to avoid:**
- Give the rotating slot a stable box. Options:
  - Stack all words in one CSS grid cell (`grid-area: 1/1`) so the container sizes to the longest word.
  - Use `ch`/`em` min-width on the slot.
  - Put the rotating word on its own line, with a fixed `min-height` in `em`.
- Left-align or fix the anchor edge. Do not center a line that has a changing width.
- Reserve the same height on mobile by testing the longest word at 320px width. Pick the word list with line length in mind.
- Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, or `left`.

**Warning signs:**
The CTA button moves during the cycle. Lighthouse CLS is above 0. Resizing the window to 320px makes the hero jump.

**Phase to address:**
Hero/motion phase. Make this an acceptance criterion: "the CTA's bounding box does not move across a full cycle at 320, 768 and 1440px."

---

### Pitfall 2: Screen readers announce every word change (and WCAG pause/stop)

**What goes wrong:**
Putting `aria-live` on the rotating word, or splitting the headline into per-letter `<span>`s, makes screen readers read "b-a-k-e-r-y" letter by letter or re-announce every 2 to 3 seconds. Without live regions, the text may be read as a garbled concatenation of all the hidden words. Auto-moving content that lasts longer than 5 seconds also needs a pause/stop/hide mechanism (WCAG 2.2.2).

**Why it happens:**
Per-letter splitting libraries (SplitText-style, manual spans) wrap each character in an element, so the accessible name is fragmented. Developers add `aria-live` to "make it accessible", which has the opposite effect here.

**How to avoid:**
- Provide a static, complete accessible headline. For example, a visually hidden `<span class="sr-only">Marketing for your local business: bakeries, gyms, salons and shops.</span>`. Mark the animated visual copy `aria-hidden="true"`. Alternatively, put `aria-label` on the `<h1>`, but the sr-only text is more robust.
- Do NOT use `aria-live` on the rotator.
- If splitting letters, use `aria-label` on the parent and `aria-hidden` on the spans.
- Add a visible pause/play button, or stop the cycle after one or two loops and settle on a final state. Stopping is the simplest way to satisfy WCAG 2.2.2.
- Pause the cycle on hover/focus and when the tab is hidden (`document.hidden` or `visibilitychange`).

**Warning signs:**
VoiceOver (macOS and iOS) reads fragments. The `<h1>` text content in the DOM is only one word at a time. There is no way to stop the motion.

**Phase to address:**
Hero/motion phase for the markup structure. Accessibility pass at the end for verification with VoiceOver.

---

### Pitfall 3: prefers-reduced-motion handled as an afterthought (or by only disabling CSS)

**What goes wrong:**
The CSS animation is disabled with a media query, but a JS timer keeps swapping words. Or the reduced-motion version is blank or shows only the first word, hiding the "for anyone" message. Or the `* { animation: none }` blanket rule breaks layout, for example by leaving words stacked on top of each other.

**Why it happens:**
The reduced-motion fallback is not designed, only suppressed. The JS and CSS paths are checked separately.

**How to avoid:**
- Design the reduced-motion state as a first-class layout: a static headline that lists the business types, or a slow crossfade with no movement. Show it as the default, and enhance with motion only when `(prefers-reduced-motion: no-preference)`.
- In JS, read `matchMedia('(prefers-reduced-motion: reduce)')` and listen for `change` events so toggling the OS setting mid-session works.
- Keep the final static state meaningful even if JS never runs (no-JS fallback).
- Test it by enabling the OS "Reduce motion" setting and also Chrome DevTools rendering emulation.

**Warning signs:**
With reduce motion on, words still change, or the hero looks broken or empty. With JS disabled, the hero is empty.

**Phase to address:**
Hero/motion phase, designed alongside the animation (not after).

---

### Pitfall 4: Web font loading causes FOUT/FOIT and breaks the animation timing

**What goes wrong:**
The hero headline uses a bold display font. It loads late. Visitors see a fallback-font flash, then a reflow when the web font swaps in. Worse, the animation starts before the font loads and measures word widths in the wrong font, so the slot sizing from Pitfall 1 is wrong. A big hero font with a different fallback metric causes a large visible jump.

**Why it happens:**
Google Fonts links are added by default with `display=swap` and nothing else. Measuring is done in JS at DOMContentLoaded. A static prototype often opens from `file://` with no network, so fonts silently fall back.

**How to avoid:**
- Self-host the fonts (woff2, subset to Latin, 1 to 2 families, minimal weights) in the repo. This also makes the site work offline and from `file://`.
- `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the hero font only.
- Use `font-display: swap` or `optional` for the display font, and tune the fallback with `size-adjust`, `ascent-override`, `descent-override` and `line-gap-override` so metrics match.
- Start the animation after `document.fonts.ready`, and avoid measuring in JS when pure CSS grid sizing works (Pitfall 1).
- Pick a variable font only if it saves bytes versus 2 static weights.

**Warning signs:**
The hero text visibly changes shape on a hard reload with the cache disabled and Network throttled to Slow 4G. CLS comes from the headline. Fonts are fetched from a third-party domain.

**Phase to address:**
Foundation/design-system phase (font setup). Re-verify in the hero phase.

---

### Pitfall 5: Animation jank from the wrong properties, heavy libraries, or per-letter DOM explosion

**What goes wrong:**
The animation stutters on mid-range phones. Causes: animating layout or paint properties (`filter: blur`, `text-shadow`, `letter-spacing`, `width`), hundreds of per-letter nodes each with their own transition, `will-change` applied to everything, a 100KB+ animation library loaded for one headline, or a `setInterval` that fights with `requestAnimationFrame`. Hand-drawn texture overlays (large PNG/SVG noise with `mix-blend-mode`) layered over the hero add repaint cost on top.

**Why it happens:**
"Kinetic" is interpreted as "lots of effects". The testing machine is a fast laptop.

**How to avoid:**
- Animate `transform` and `opacity` only. Keep the number of animated nodes small (word-level, not letter-level, unless letters are few).
- Prefer CSS animations/transitions or the Web Animations API for a simple cycle. Add GSAP only if choreography truly needs it, and justify it in the stack decision.
- Use `will-change` sparingly and remove it after the animation.
- Keep texture overlays as a single small tiled image or a static background, with `pointer-events: none`. Avoid blend modes and animated filters over the hero.
- Pause the animation when it is off-screen (`IntersectionObserver`) and when the tab is hidden.
- Test with Chrome DevTools CPU throttling at 4x to 6x and on a real phone.

**Warning signs:**
Performance panel shows long frames or lots of Paint/Layout in the animation. Phone fans or heat on long viewing. The Lighthouse TBT rises.

**Phase to address:**
Hero/motion phase. Re-check in the final polish/performance phase.

---

### Pitfall 6: The "local and warm" design collapses into either a generic template or a crude craft pastiche

**What goes wrong:**
Two failure modes. (a) Generic: stock SaaS layout, purple gradients, the Inter font, three icon cards, "We help businesses grow" copy. It reads as a template, which defeats "real local person". (b) Over-crafted: hand-drawn doodles, paper textures and script fonts stacked on everything, which hurts legibility and looks amateurish. The brief asks for BOTH professional and local, so the tension is the central design risk.

**Why it happens:**
"Handcrafted" is applied as decoration everywhere instead of as a few deliberate accents on a disciplined grid.

**How to avoid:**
- Fix the structure first: a clean grid, a strict type scale, generous whitespace, and consistent spacing. Then add at most 3 to 4 handcrafted accents (for example a hand-drawn underline under the key word, a wobbly divider, one subtle paper grain on the background, a photo with a slightly rotated "taped" frame).
- Limit the palette to roughly 5 colors: warm earthy neutrals plus one accent, with checked contrast.
- Pair one characterful display face (for the hero and headings) with one highly readable body face. Do not use more than two families.
- Write the copy in first person, with concrete local details (a street name, "your bakery on Main Street") rather than abstract agency language.
- Review against a short list of references (local-creative portfolios, not agency templates) before coding.

**Warning signs:**
Swapping the logo and name would make the page look like any other template. Body text sits on a textured background with poor contrast. More than one hand-drawn element appears per viewport.

**Phase to address:**
Design foundation phase (tokens, type, palette, accent set decided up front). Visual polish phase for the final pass.

---

### Pitfall 7: Placeholder content looks fake, or ships as if it were real

**What goes wrong:**
"Lorem ipsum", "John Doe", "Acme Bakery" and obviously stock photos with 5-star quotes undermine the "polished concept" shown to stakeholders. The opposite problem is also serious: invented testimonials and logos from real-sounding local businesses could be mistaken for real endorsements, and be misleading if the prototype is deployed publicly. Placeholders are also scattered across many HTML spots, which makes the later swap error-prone.

**Why it happens:**
Content is written last, in a hurry. Nobody decides how placeholder content is differentiated from real content.

**How to avoid:**
- Write believable, specific, plausible-but-fictional copy (a fictional town, fictional business names that are clearly not real brands, specific quotes with concrete results that are modest and credible).
- Avoid real brand names, real people's faces, and invented statistics claiming specific growth numbers. If stats are used, keep them visibly fictional or omit them.
- Use a deliberate photo approach: warm, neutral illustrated or tonally consistent placeholders (own illustrations, SVG portraits, consistent crop/aspect ratio), not mismatched stock.
- Give logo placeholders a consistent style (simple typographic wordmarks in the site's palette), not grey boxes.
- Centralize all swappable content (name, city, email, testimonials) in one place: either clearly marked `<!-- PLACEHOLDER -->` blocks, a single `content` JS/JSON file rendered at load, or CSS custom properties and a short `REPLACE-ME.md` checklist. Pick one approach and use it consistently.
- Add a small, tasteful "Prototype: sample content" indicator (footer note or a dismissible badge) so no one mistakes it for a live business.
- Set `<meta name="robots" content="noindex">` if deployed publicly.

**Warning signs:**
`grep -i "lorem\|john doe\|example.com\|acme"` finds matches. Faces or images have inconsistent style. The same name appears in 10 files with no checklist.

**Phase to address:**
Content phase (copy and placeholder system), with the swap checklist produced in the final hand-off phase.

---

### Pitfall 8: A front-end-only form that misleads (and validates badly)

**What goes wrong:**
The form shows "Thanks! I'll be in touch" but nothing is sent. A stakeholder or a real visitor submits it and believes a message went through. Separately, validation is poor: `novalidate` with no error messages, errors shown only in color, no focus management, the page reloading on submit because the default action fires, or the form posting to `file://` or a 404 on the static host. The success message is not announced to screen readers.

**Why it happens:**
"No backend" is treated as "no thought about the user's expectation". Validation is done with only HTML5 browser bubbles, which look inconsistent.

**How to avoid:**
- Be explicit that this is a prototype. Success copy should say something like "Demo only: your message wasn't sent" in the prototype, with a code comment and a single place to flip it when a real endpoint (Formspree, Netlify Forms, etc.) is wired up. Make the later swap trivial: use a real `<form action method>` structure, keep field `name` attributes correct, and keep the submit handler isolated in a single function.
- Call `event.preventDefault()` and validate in JS, but also keep native attributes (`required`, `type="email"`, `autocomplete`).
- Use inline, text-based errors linked with `aria-describedby` and `aria-invalid`, plus a status region (`role="status"` or `aria-live="polite"`) for the success message. Move focus to the first invalid field or to the success message.
- Use a loose email check (presence of `@` and a dot). Do not write a complicated regex that rejects valid addresses.
- Do not store anything in `localStorage` or imply data was saved. Do not add a fake spinner that suggests a network request longer than about 600ms.
- Include a honeypot only when a real backend exists; skip it for now.

**Warning signs:**
The success message is identical to what production would say. The Network tab shows no request but the UI claims sent. Errors appear only as red borders. The page scrolls to the top after submit.

**Phase to address:**
Contact page phase. Include "prototype note" and a11y in the acceptance criteria.

---

### Pitfall 9: Mobile treated as a shrunken desktop

**What goes wrong:**
The giant display headline overflows or breaks mid-word at 360px. `100vh` hero is cut off by the mobile browser's dynamic toolbar. Tap targets are tiny, the nav does not collapse or the hamburger is inaccessible, texture and hand-drawn accents overlap the text, hover-only effects are unusable, and horizontal scroll appears from a decorative element that is wider than the viewport. The viewport meta tag is missing, so the page renders zoomed-out.

**Why it happens:**
Design and test were done at desktop width only. Fixed `px` font sizes are used on the hero.

**How to avoid:**
- `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- Fluid type via `clamp()` for the hero. Check the longest rotating word at 320px.
- Use `min-height: 100svh` (or `dvh`) with a safe fallback to `vh`, and never lock content to exact viewport height.
- Build mobile-first. 44x44px minimum tap targets. A keyboard-accessible nav toggle (button with `aria-expanded`), or, with only two pages, a simple always-visible two-link nav that avoids a hamburger altogether (the recommended choice here).
- `overflow-x: clip` is only a band-aid. Find and fix the actual overflowing element.
- Provide hover alternatives: do not hide meaning behind `:hover`.
- Test on a real iPhone and an Android device, not just DevTools.

**Warning signs:**
Horizontal scroll bar on mobile. Text clipped in the hero at 360px. The CTA is below the fold on a 667px-tall screen.

**Phase to address:**
Layout phase (mobile-first from the start), with a dedicated responsive QA pass before the end.

---

### Pitfall 10: Performance and asset bloat on a "simple" static site

**What goes wrong:**
Uncompressed JPEG placeholders at 3000px, many Google Font weights, a heavy animation library, a large texture PNG, and an unoptimized hero image give a slow LCP. The headline is the LCP element, but it is hidden until JS runs (opacity 0 initial state), so LCP is delayed. Images lack `width`/`height`, causing CLS.

**Why it happens:**
Without a build step there is no automatic optimization, and visual richness is the whole point.

**How to avoid:**
- Make the headline text visible in HTML and CSS without JS. Hide nothing by default that JS must reveal (see Pitfall 3's no-JS fallback).
- Use WebP/AVIF or optimized JPEG at displayed size (max 2x), `loading="lazy"` below the fold, explicit `width`/`height`, and `decoding="async"`.
- Use SVG for logos, hand-drawn accents and the texture where possible (inline small ones).
- Cap the total payload (suggested budget: under about 500KB for the first view, excluding lazy images) and target Lighthouse mobile performance 90+.
- Minimal JS: one small vanilla script per page, loaded with `defer`.

**Warning signs:**
Lighthouse LCP above 2.5s on throttled mobile. Network total above 1MB on first load. Content flashes in after JS.

**Phase to address:**
Foundation phase (budgets), final polish/performance phase (audit).

---

### Pitfall 11: Static-site portability: paths and features that fail on `file://` or a subpath host

**What goes wrong:**
The requirement is "opens locally or deploys to any static host". Root-absolute paths (`/css/style.css`, `/contact`) break when opened from `file://` or deployed to a GitHub Pages project subpath. ES modules (`<script type="module">`) and `fetch()` of a local JSON content file are blocked by CORS on `file://`. Pretty URLs (`/contact` without `.html`) only work on hosts that rewrite them.

**Why it happens:**
Developers test only through a local dev server.

**How to avoid:**
- Use relative paths everywhere (`./css/style.css`, `contact.html`, `index.html`).
- Avoid module scripts and `fetch` for local data, or confirm they work from `file://`. Use classic scripts, or inline data.
- Link pages as `index.html` and `contact.html` explicitly.
- Test by double-clicking the HTML file AND by serving from a subfolder.
- If a build tool (Vite etc.) is chosen, set `base: './'`. Consider whether a build step is needed at all for two pages.

**Warning signs:**
The page is unstyled or the animation is dead when opened by double-click. Console shows CORS or 404 errors for local resources.

**Phase to address:**
Foundation phase (project structure), verified in the final QA phase.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Copy the header/footer markup into both pages by hand | No tooling needed | The two copies drift (a nav link updated in one place only) | Acceptable for exactly two pages, if a checklist or a quick diff check is part of QA |
| Hardcode placeholder name/city in many places | Fast to write | Painful, error-prone swap later | Never. Centralize or mark with a consistent token |
| Inline all CSS in HTML | One file per page | Duplicated styles, hard to maintain | Never; use one shared stylesheet |
| `!important` and magic numbers for the hero slot width | Quickly stops the jump | Breaks when the word list or font changes | Only if documented; prefer grid stacking (Pitfall 1) |
| Add GSAP/animation library "just in case" | Easy sequencing | Payload and complexity for a simple cycle | Only if CSS/WAAPI cannot express the choreography |
| Skip real-device testing | Saves time | Jank and layout bugs discovered by the client | Never for the hero |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Google Fonts | Load via CDN with many weights, and the site breaks offline or from `file://` | Self-host a subset of 1 to 2 families as woff2 |
| Future form backend (Formspree/Netlify) | Hardcode the prototype handler so it must be rewritten | Keep a real `<form action method>` and an isolated submit function that can be swapped |
| Static hosts (GitHub Pages/Netlify) | Root-absolute paths, missing 404 handling | Relative paths; test in a subfolder |
| Social/OG preview | Skipped entirely and the shared link looks bare | Add basic `title`, `description`, and one OG image (cheap), even though SEO tuning is out of scope |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Animating filter/blur/text-shadow or layout properties | Dropped frames in the hero | Only `transform` and `opacity` | Mid-range phones, 4x CPU throttle |
| Per-letter spans with individual timers | Long main-thread tasks, DOM bloat | Word-level animation, one shared clock | About 100+ animated nodes |
| Animation running while off-screen or in a background tab | Wasted battery and CPU | `IntersectionObserver` plus `visibilitychange` | Always, but visible on laptops with many tabs |
| Full-bleed texture with blend modes | Scroll jank, high paint cost | Small tiled static texture, no blend over the hero | Phones, large retina viewports |
| Hero hidden until JS runs | Late LCP, blank hero | Visible by default, JS only enhances | Slow networks |
| Unsized, oversized images | CLS and slow LCP | `width`/`height`, resize to displayed size, lazy-load | Any mobile connection |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering form input into the page with `innerHTML` for the success message ("Thanks, ${name}!") | XSS (self-XSS in the prototype, real XSS if reused with a backend) | Use `textContent` |
| Exposing a real personal email or phone number as placeholder | Spam and privacy | Use clearly fake values on reserved domains (`example.com`, `555` numbers) |
| Leaving a future endpoint key or token in client code | Credential leak | Use only public form endpoints, and never put secrets in a static site |
| Third-party embeds (maps, fonts, scripts) | Tracking, privacy, and extra weight | Self-host; skip embeds. Use a static map image if one is needed |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Rotating words too fast (under about 2s) | Cannot read; feels frantic | Roughly 2.5 to 3.5s per word, with a quick transition (about 400 to 600ms) |
| The only message lives in the rotating word | Skimmers see "bakery" and conclude it is not for them | Make the static part of the headline and the subhead say "for any local business" |
| Services use vague agency jargon | Local owners do not understand "brand synergy" | Plain language with concrete local examples for the four services |
| Weak or repeated CTA text ("Submit") | Lower conversion | Specific, warm CTAs ("Tell me about your shop") in the header, hero and footer |
| No visible focus styles on handcrafted buttons and links | Keyboard users get lost | Keep or restyle `:focus-visible` rings with contrast |
| Low-contrast earthy palette (beige on cream, terracotta on tan) | Fails WCAG AA | Check all text/background pairs at 4.5:1 (3:1 for large text) |
| Testimonials without names, business types, or a face | Reads as fake | Include a first name, business type and town, plus a consistent avatar style |

## "Looks Done But Isn't" Checklist

- [ ] **Hero animation:** Often missing a reduced-motion state and a no-JS state. Verify with OS reduce-motion on and JS disabled.
- [ ] **Hero animation:** Often missing a pause mechanism or an end state. Verify against WCAG 2.2.2 (cycle stops, or has a visible pause control).
- [ ] **Hero headline:** Often announced oddly by assistive tech. Verify with VoiceOver that it reads as one coherent sentence, once.
- [ ] **Layout stability:** Verify that the CTA does not move across a full cycle at 320, 768 and 1440px, and CLS is 0 on mobile Lighthouse.
- [ ] **Fonts:** Verify with cache disabled and Slow 4G, and also opened from `file://` offline.
- [ ] **Contact form:** Often missing error messages tied to fields, focus management, and a status announcement. Verify with keyboard only and a screen reader.
- [ ] **Contact form:** Verify the success copy makes clear that nothing was sent (prototype).
- [ ] **Placeholders:** Verify no lorem ipsum, real brand names, real faces, real email or phone. Verify the swap checklist exists.
- [ ] **Navigation:** Verify the current page is indicated (`aria-current="page"`), both pages link to each other, and header/footer are identical on both pages.
- [ ] **Responsive:** Verify no horizontal scroll at 320px and on a real phone, tap targets are at least 44px, and the hero fits with a visible CTA on a short phone screen.
- [ ] **Portability:** Verify by double-clicking `index.html` and `contact.html`, and by hosting in a subfolder.
- [ ] **Basics:** Per-page `<title>`, meta description, `lang` attribute, favicon (avoids a console 404), alt text on all images, a skip link, and a single `<h1>` per page.
- [ ] **Contrast:** Verify all text, especially text over textures and on accent colors.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Layout shift in the hero | LOW | Restructure to a grid-stack slot, or fix the slot min-width; no content changes |
| Screen-reader announcements | LOW | Add sr-only headline and `aria-hidden` on animated copy |
| Reduced-motion/no-JS missing | LOW to MEDIUM | Make the static state the default markup, and layer motion on as an enhancement |
| Janky animation | MEDIUM | Reduce the animated node count and replace non-composited properties; may require rewriting the animation |
| Generic or over-crafted look | MEDIUM to HIGH | Reset the visual system (type, palette, accent set) and then re-skin; cheaper if tokens were centralized |
| Scattered placeholders | MEDIUM | Grep-and-centralize into one content source, then produce a swap checklist |
| Misleading form | LOW | Change copy, add a prototype note, and isolate the handler |
| Root-absolute paths | LOW | Search and replace with relative paths |

## Pitfall-to-Phase Mapping

Suggested phase names, since no roadmap exists yet. Adjust once the roadmap is created.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1. Hero layout shift | Hero/motion | CTA bounding box stable across a cycle at 3 widths; CLS 0 |
| 2. Screen reader announcements and WCAG 2.2.2 | Hero/motion, then a11y pass | VoiceOver reads once; pause or stop works |
| 3. Reduced motion and no-JS | Hero/motion | OS reduce-motion on and JS off both show a complete hero |
| 4. Font loading | Foundation/design system | Throttled hard reload shows no visible jump; fonts are self-hosted |
| 5. Animation jank | Hero/motion, then performance pass | 4x CPU throttle holds about 60fps; real-phone check |
| 6. Generic or over-crafted design | Design foundation, then visual polish | Accent budget (3 to 4) respected; contrast passes; the "swap the logo" test |
| 7. Fake or misleading placeholders | Content | Grep clean; swap checklist exists; the prototype indicator is present |
| 8. Misleading form | Contact page | Success copy is honest; keyboard and screen-reader pass; `textContent` only |
| 9. Mobile as an afterthought | Layout (mobile-first), then responsive QA | No horizontal scroll at 320px; real-device check |
| 10. Performance and asset bloat | Foundation (budgets), then performance pass | Lighthouse mobile 90+; LCP under 2.5s |
| 11. Portability (`file://`, subpath) | Foundation, then final QA | Double-click open and subfolder hosting both work |

## Research Flags for Roadmap

- Hero/motion phase: deserves the most attention (pitfalls 1, 2, 3, 5 converge there). Decide the technique (pure CSS grid-stack and keyframes versus WAAPI versus a library) before planning it.
- Contact form phase: standard patterns, no deeper research needed beyond the a11y details above.
- Design foundation: the main subjective risk (pitfall 6). Consider locking a small style guide (palette, two fonts, accent list) before building sections.

## Sources

- WCAG 2.2 Success Criterion 2.2.2 Pause, Stop, Hide; 2.3.3 Animation from Interactions; 1.4.3 Contrast; 4.1.3 Status Messages (w3.org/WAI/WCAG22). From training knowledge; not re-fetched this session.
- MDN: `prefers-reduced-motion`, `font-display`, `size-adjust` and the font metric override descriptors, `IntersectionObserver`, `document.fonts.ready`, dynamic viewport units (`svh`/`dvh`). From training knowledge; not re-fetched.
- web.dev: Cumulative Layout Shift, Optimize LCP, font best practices, animations guide (composited properties). From training knowledge; not re-fetched.
- Common practitioner knowledge on `aria-live` misuse and letter-splitting accessibility (for example, the pattern of `aria-label` plus `aria-hidden` spans). LOW to MEDIUM confidence; verify with real screen-reader testing.

---
*Pitfalls research for: two-page static freelance-marketer site with kinetic-typography hero*
*Researched: 2026-10-12*
