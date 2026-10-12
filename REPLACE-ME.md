# Replace me: placeholder swap checklist

Everything listed here is fictional or sample content and must be swapped before launch.

## Identity

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Freelancer name | Sam Whitlock | `index.html`, `contact.html` | `.wordmark` in header and footer, `<title>`, copyright line | [ ] |
| Town | Elmhollow | `index.html`, `contact.html` | `<title>`, meta description, footer tagline, hero copy | [ ] |
| Nearby villages | Fenwick Cross, Thornby | `index.html`, `contact.html` | "Area served" in the SHELL:FOOTER block | [ ] |
| Header and footer wordmark | Text "Sam Whitlock" | `index.html`, `contact.html` | `.wordmark` | [ ] |

## Contact details

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Email | hello@samwhitlock.example (and its `mailto:` href) | `index.html`, `contact.html` | SHELL:FOOTER block, "Get in touch" | [ ] |
| Phone | (555) 555-0142 (and `tel:+15555550142` href) | `index.html`, `contact.html` | SHELL:FOOTER block, "Get in touch" | [ ] |
| Area served | Elmhollow, Fenwick Cross and Thornby | `index.html`, `contact.html` | SHELL:FOOTER block, "Area served" | [ ] |

## Numbers and claims

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Client count | 40+ | `index.html` | `.trust-cue` (hero, under the CTAs) | [ ] |
| Years of experience | ten years | `index.html` | `#about` (first paragraph, "ten years") | [ ] |

## Photos

Hotlinked stock photos (D-13). Replace each with a real photo and host it in `assets/`.

| Where used (file and element) | Full URL | Photographer | Source page URL | Licence | Done |
|-------------------------------|----------|--------------|-----------------|---------|------|
| styleguide.html (sg-photo, dev only) | https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=70&auto=format | Unsplash contributor, photo id 1509440159596 (name not confirmed) | https://unsplash.com/photos/1509440159596 | Unsplash licence | [ ] |
| `index.html` `.hero__media img` | https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&h=1000&q=55 | Unsplash contributor, photo id 1556740738-b6a63e27c4df (name not confirmed, look up at https://unsplash.com/photos/1556740738-b6a63e27c4df); also replace the alt text, it describes a café counter | https://unsplash.com/photos/1556740738-b6a63e27c4df | Unsplash licence | [ ] |
| `index.html` `#about .about__media` | GAP: no verified photo matched the alt text (candid person walking a high street with a coffee), so a tint `media--placeholder` box is in place. Add an `<img class="media" width="800" height="800" loading="lazy" referrerpolicy="no-referrer">` with a square photo and update the alt text | n/a | n/a | n/a | [ ] |
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

Filled in by Plan 04.

## Copy blocks

| Item | Current placeholder | File | How to find it | Done |
|------|---------------------|------|----------------|------|
| Home page title | Sam Whitlock \| Local marketing help in Elmhollow | `index.html` | `<title>` | [ ] |
| Contact page title | Contact \| Sam Whitlock, local marketer in Elmhollow | `contact.html` | `<title>` | [ ] |
| Home meta description | Friendly, local marketing help for Elmhollow bakeries, gyms, salons and shops. Sample content for a prototype. | `index.html` | `<meta name="description">` | [ ] |
| Footer tagline | Helping local businesses in Elmhollow and nearby villages get found and get busy. | `index.html`, `contact.html` | SHELL:FOOTER block | [ ] |
| Hero support line | I’m Sam, a marketer right here in Elmhollow. I help neighbourhood businesses get found and get busy. | `index.html` | `.hero__lede` | [ ] |
| Hero text link | See how I help | `index.html` | `.link-cta` | [ ] |
| Services heading | Four ways I help local businesses get found, get remembered and get busy. | `index.html` | `#services-title` | [ ] |
| Service titles and descriptions | Social media, Local SEO & Google, Ads & campaigns, Branding & design (and their descriptions) | `index.html` | `.service-card` (4 cards) | [ ] |
| About heading | Hi, I’m Sam. I live here too. | `index.html` | `#about-title` | [ ] |
| About paragraphs | Two first-person paragraphs about growing up in Elmhollow and working locally | `index.html` | `.about__text p` | [ ] |
| About CTA lead-in | Fancy a coffee and a chat? | `index.html` | `.about__lead` | [ ] |

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
