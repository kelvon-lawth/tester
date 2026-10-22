# Replace me: placeholder swap checklist

Everything listed here is fictional or sample content and must be swapped before launch.

Before launch, also grep every file for `Sam`, `Elmhollow`, `samwhitlock` and `01632` (and `441632960123`) to catch any occurrence a row below misses. Also check the `.area-map` figure in `contact.html`, which names the town and villages inside its SVG.

## Identity

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Freelancer name | Sam Whitlock (and the first name "Sam" on its own) | `index.html`, `contact.html` | `.wordmark` in header and footer, `<title>`, copyright line; `contact.html` meta description; first name "Sam" in `.hero__lede` ("I’m Sam"), `#about-title` ("Hi, I’m Sam"), the Priya Nair and Marcus Bell testimonial quotes, and the About photo alt ("a stand-in portrait for Sam") | [ ] |
| Town | Elmhollow | `index.html`, `contact.html` | `<title>`, meta description, footer tagline, hero copy; `contact.html` `.area-map` (SVG `<title>` and the Elmhollow `<text>` label) | [ ] |
| Nearby villages | Fenwick Cross, Thornby | `index.html`, `contact.html` | "Area served" in the SHELL:FOOTER block; `contact.html` `.area-map` (SVG `<title>` and the Fenwick Cross and Thornby `<text>` labels) | [ ] |
| Header and footer wordmark | Text "Sam Whitlock" | `index.html`, `contact.html` | `.wordmark` | [ ] |

## Contact details

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Email | hello@samwhitlock.example (and its `mailto:` href) | `index.html`, `contact.html` | SHELL:FOOTER block, "Get in touch"; `index.html` `.cta-band__email` (text and `mailto:` href); `contact.html` `.contact__details` and the `.contact__noscript` note | [ ] |
| Phone | 01632 960 123 (and `tel:+441632960123` href; UK Ofcom drama-range number, never in service) | `index.html`, `contact.html` | SHELL:FOOTER block, "Get in touch"; `contact.html` `.contact__details` and the `.contact__noscript` note | [ ] |
| Area served | Elmhollow, Fenwick Cross and Thornby | `index.html`, `contact.html` | SHELL:FOOTER block, "Area served"; `contact.html` `.contact__list` "Based in" | [ ] |
| Area-served map | Stylised inline-SVG map: Elmhollow (centre), Fenwick Cross, Thornby, dashed service-radius rings; caption ‘Elmhollow and the villages around it, about a 20-minute drive’ | `contact.html` | `figure.area-map` in `.contact__details`: `<title id="area-map-title">`, the three `.area-map__label` `<text>` labels and `.area-map__caption`. Redraw road/pin positions for the real town | [ ] |

## Numbers and claims

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Client count | 40+ | `index.html` | `.trust-cue` (hero, under the CTAs) | [ ] |
| Years of experience | ten years | `index.html` | `#about` (first paragraph, "ten years") | [ ] |
| Hero proof chip: rating | 4.9 from local owners (placeholder claim, verify or remove: it is not a real rating) | `index.html` | `.hero-chip--rating` | [ ] |
| Hero proof chip: local roots | Born and bred in Elmhollow (follows the Town row) | `index.html` | `.hero-chip--local` | [ ] |

## Photos

Hotlinked stock photos (D-13). Replace each with a real photo and host it in `assets/`.

| Where used (file and element) | Full URL | Photographer | Source page URL | Licence | Done |
|-------------------------------|----------|--------------|-----------------|---------|------|
| styleguide.html (sg-photo, dev only) | https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=70&auto=format | Unsplash contributor, photo id 1509440159596 (name not confirmed) | https://unsplash.com/photos/1509440159596 | Unsplash licence | [ ] |
| `index.html` `.hero__media img` | https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=640&h=800&q=55 | Unsplash contributor, photo id 1556740738-b6a63e27c4df (name not confirmed, look up at https://unsplash.com/photos/1556740738-b6a63e27c4df) | https://unsplash.com/photos/1556740738-b6a63e27c4df | Unsplash licence. Replace with a real photo of you or your work and update the alt text (currently: smiling shop owner taking a card payment at a counter) | [ ] |
| `index.html` `#about .about__media img` | https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=640&h=640&fit=crop&q=60&auto=format | Photographer unknown, Unsplash photo id 1573496359142-b8d87734a5a2 (name not confirmed) | https://unsplash.com/photos/1573496359142-b8d87734a5a2 | Unsplash licence. Replace with a real portrait or working shot of you and update the alt text (currently: "A smiling woman in a grey blazer leaning against a warm orange wall, a stand-in portrait for Sam") | [ ] |
| `index.html` `#kind-words .avatar` (Priya Nair) | https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&q=70&auto=format | Photographer unknown, Unsplash photo id 1494790108377-be9c29b29330 | https://unsplash.com/photos/1494790108377-be9c29b29330 | Unsplash licence. Replace with a real headshot of the real client and update the alt text (smiling woman, dark wavy hair, red top). | [ ] |
| `index.html` `#kind-words .avatar` (Marcus Bell) | https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&q=70&auto=format | Photographer unknown, Unsplash photo id 1507003211169-0a1dd7228f2d | https://unsplash.com/photos/1507003211169-0a1dd7228f2d | Unsplash licence. Replace with a real headshot of the real client and update the alt text (smiling man, white t-shirt). | [ ] |
| `index.html` `#kind-words .avatar` (Lena Fischer) | https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=96&h=96&fit=crop&q=70&auto=format | Photographer unknown, Unsplash photo id 1438761681033-6461ffad8d80 | https://unsplash.com/photos/1438761681033-6461ffad8d80 | Unsplash licence. Replace with a real headshot of the real client and update the alt text (woman with short auburn hair by a lake). | [ ] |

## Testimonials

All names, businesses and quotes are invented. Swap for real, permissioned testimonials.

| Quote | Name | Role | Business | Town | Headshot | Done |
|-------|------|------|----------|------|----------|------|
| Sam got us onto Google Maps and our Saturday queue doubled. Everything was explained in plain English. | Priya Nair | Owner | Rise & Crumb Bakery | Elmhollow | Photos row `#kind-words .avatar` (Priya Nair) | [ ] |
| I’m no marketer and Sam never made me feel it. One small ad brought in three new members a week. | Marcus Bell | Owner | Iron Orchard Gym | Fenwick Cross | Photos row `#kind-words .avatar` (Marcus Bell) | [ ] |
| Our new logo and Instagram finally feel like us. Clients keep mentioning them at the chair. | Lena Fischer | Founder | Studio Marigold Salon | Elmhollow | Photos row `#kind-words .avatar` (Lena Fischer) | [ ] |

## Logos

Six invented inline-SVG wordmarks. Replace each with a real client logo.

| Business name | File | How to find it | Replace with | Done |
|---------------|------|----------------|--------------|------|
| Rise & Crumb Bakery | `index.html` | `ul.logo-strip svg[aria-label="Rise & Crumb Bakery"]` | Real client logo (SVG or PNG) with permission | [ ] |
| Iron Orchard Gym | `index.html` | `ul.logo-strip svg[aria-label="Iron Orchard Gym"]` | Real client logo (SVG or PNG) with permission | [ ] |
| Studio Marigold Salon | `index.html` | `ul.logo-strip svg[aria-label="Studio Marigold Salon"]` | Real client logo (SVG or PNG) with permission | [ ] |
| Fernside Florist | `index.html` | `ul.logo-strip svg[aria-label="Fernside Florist"]` | Real client logo (SVG or PNG) with permission | [ ] |
| The Daily Pour Café | `index.html` | `ul.logo-strip svg[aria-label="The Daily Pour Café"]` | Real client logo (SVG or PNG) with permission | [ ] |
| Copperline Hardware | `index.html` | `ul.logo-strip svg[aria-label="Copperline Hardware"]` | Real client logo (SVG or PNG) with permission | [ ] |

## Copy blocks

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Home page title | Sam Whitlock \| Local marketing help in Elmhollow | `index.html` | `<title>` | [ ] |
| Contact page title | Contact \| Sam Whitlock, local marketer in Elmhollow | `contact.html` | `<title>` | [ ] |
| Home meta description | Friendly, local marketing help for Elmhollow bakeries, gyms, salons and shops. Sample content for a prototype. | `index.html` | `<meta name="description">` | [ ] |
| Contact meta description | Get in touch with Sam Whitlock, a friendly local marketer in Elmhollow. Email, ring or send a note. Sample content for a prototype. | `contact.html` | `<meta name="description">` | [ ] |
| Footer tagline | Helping local businesses in Elmhollow and nearby villages get found and get busy. | `index.html`, `contact.html` | SHELL:FOOTER block | [ ] |
| Hero support line | I’m Sam, a marketer right here in Elmhollow. I help neighbourhood businesses get found and get busy. | `index.html` | `.hero__lede` | [ ] |
| Hero text link | See how I help | `index.html` | `.link-cta` | [ ] |
| Hero headline for screen readers | Marketing for your bakery, café, salon, gym, florist, shop or restaurant (keep in step with the cycling word list in `data-words`) | `index.html` | `.hero-title .visually-hidden` and `.hero-word[data-words]` | [ ] |
| Giant decorative town word behind About | Elmhollow (follows the Town row) | `index.html` | `.deco--word` in `#about` (aria-hidden) | [ ] |
| Hero animation pause button label | Pause animation | `index.html` | `.hero-toggle__label` | [ ] |
| Services heading | Four ways I help local businesses get found, get remembered and get busy. | `index.html` | `#services-title` | [ ] |
| Service titles and descriptions | Social media, Local SEO & Google, Ads & campaigns, Branding & design (and their descriptions) | `index.html` | `.service-card` (4 cards) | [ ] |
| About heading | Hi, I’m Sam. I live here too. | `index.html` | `#about-title` | [ ] |
| About paragraphs | Two first-person paragraphs about growing up in Elmhollow and working locally | `index.html` | `.about__text p` | [ ] |
| About CTA lead-in | Fancy a coffee and a chat? | `index.html` | `.about__lead` | [ ] |
| How it works heading | Three easy steps, no jargon | `index.html` | `#how-title` | [ ] |
| How it works steps | Chat, Plan, Grow and their descriptions | `index.html` | `.step` (3 items) | [ ] |
| Closing band heading | Let’s get your business busy | `index.html` | `#cta-title` | [ ] |
| Closing band support line | Tell me a bit about what you do, and let’s see how I can help. | `index.html` | `.cta-band__inner > p` | [ ] |
| Closing band email line | Prefer email? hello@samwhitlock.example | `index.html` | `.cta-band__email` | [ ] |
| Contact intro | Whether you run a bakery, a gym or the shop on the corner, I’d love to hear what you’re working on. Drop me a note below or give me a ring, and I’ll get back to you within a day or two. | `contact.html` | `.contact__intro` | [ ] |
| Contact form labels and hints | Your name, Phone number, Email address, Message (optional); "Tell me a bit about your business and what you’d like help with." | `contact.html` | `#contact-form` labels, `#message-hint` | [ ] |
| Contact form error messages | "Please tell me your name.", "Please add a phone number so I can call you back.", "Please add your email address.", plus email and phone format messages | `js/main.js` | contact-form IIFE, `messageFor()` | [ ] |
| Contact success message | Thanks, that’s all looking good. This is a prototype, so nothing was actually sent. (Rewrite when a real submission is wired up) | `contact.html` | `#contact-success` | [ ] |
| Contact direct details heading and line | Rather talk directly? I’m happy to chat by phone or email, whichever suits you. | `contact.html` | `#contact-details-title` and the paragraph after it | [ ] |

## Pricing

All plan names, prices and features are placeholders. Set real prices before launch.

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Pricing heading | Simple monthly plans, no surprises | `index.html` | `#pricing-title` | [ ] |
| Pricing intro line | No contracts. Cancel any month. Every plan starts with a free coffee and a chat. | `index.html` | `#pricing .section-head p` | [ ] |
| Plan 1 name and price | Local Basics, £195 a month (placeholder, set real price) | `index.html` | `#plan-basics-title`, first `.pricing-card__amount` | [ ] |
| Plan 1 audience line | For shops and cafés that want to be found and stay visible. | `index.html` | first `.pricing-card__for` | [ ] |
| Plan 1 features | Google Business Profile set up and kept fresh; 8 social media posts a month; Local SEO health check every quarter; A monthly check-in over coffee | `index.html` | first `.pricing-card__features` | [ ] |
| Plan 2 name and price | Growth, £395 a month (placeholder, set real price) | `index.html` | `#plan-growth-title`, second `.pricing-card__amount` | [ ] |
| Plan 2 audience line | For busy businesses ready to bring in more new faces. | `index.html` | second `.pricing-card__for` | [ ] |
| Plan 2 features | Everything in Local Basics; 16 social media posts a month, plus stories; Local ads and campaigns run for you (ad spend separate); A branding and design refresh for your logo, sign or menu; Plain-English results report every month | `index.html` | second `.pricing-card__features` | [ ] |
| Featured plan badge | Most popular (on Growth) | `index.html` | `.pricing-card__badge` | [ ] |

## Shell

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Copyright line | © 2026 Sam Whitlock. All names and details are made up. | `index.html`, `contact.html` | `.site-footer__fine` | [ ] |
| Prototype note | Prototype — sample content | `index.html`, `contact.html` | `.site-footer__fine` (remove at launch) | [ ] |
| Dev style-guide link | Style guide (dev) | `index.html`, `contact.html` | `.site-footer__fine`, remove in Phase 5 | [ ] |

## Fonts

Fraunces and Figtree are SIL OFL and self-hosted. See `assets/fonts/SOURCES.md`. No swap needed.

## Dev-only files to remove in Phase 5

- `styleguide.html`
- `js/styleguide.js`
- `tools/` (dev-only harness: `font-metrics.html`, `font-metrics.js`, `*-test.js`, `check-*.js`; remove the whole folder, it must not ship, threat T-01-10)
- the "Style guide (dev)" footer link in `index.html` and `contact.html`
- the "Style guide (dev only)" block in `css/styles.css`
