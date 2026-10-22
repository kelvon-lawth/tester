---
phase: 02-shared-shell-static-home
verified: 2026-10-22T00:00:00Z
status: passed
score: 4/4 roadmap success criteria verified; 12/12 requirements satisfied
overrides_applied: 0
---

# Phase 2: Shared Shell & Static Home Verification Report

**Phase Goal:** Visitors can read a complete, warm, professional Home page and navigate to Contact from a consistent header, footer and repeated calls to action
**Status:** passed
**Re-verification:** No, initial verification

## Observable Truths (ROADMAP success criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Always-visible header nav (Home/Contact, current page indicated), footer with placeholder contact, area served, "Prototype - sample content" | VERIFIED | `index.html` has `aria-current="page"` on Home; `contact.html` has one aria-current; footer at index.html:266 has email/tel, area served, "Prototype — sample content" (line 284). Browser test confirms header is sticky. |
| 2 | Hero readable without JS, then 4 services, About with photo, testimonials, logo strip, 3-step How it works, closing CTA band | VERIFIED | Hero h1 has a visually-hidden full sentence plus lede, CTA and trust cue in static HTML. Sections present: #services, #about, #kind-words, logos, #how-it-works, #pricing (extra, from quick task 261022-bsb), cta-band. `check-home.js` passes (HOME OK, including order). |
| 3 | "Let's talk" CTAs in hero, mid-page and closing band; phone sticky CTA | VERIFIED | Six `href="contact.html"` "Let's talk" buttons: hero (l.51), about (123), pricing plans (229, 245), closing band (258), plus `.sticky-cta` (292). `home-browser-test.js` confirms sticky CTA shows past the hero, hides near band/footer, phone only. |
| 4 | Placeholder content clearly fictional and every swappable item listed in REPLACE-ME.md | VERIFIED | REPLACE-ME.md (130 lines) lists names, contacts, photos with source URLs (e.g. hero and about images). `check-home.js` "replace" check passes. Fictional `.example` emails and 555 numbers. |

**Score:** 4/4

## Requirements Coverage

All 12 IDs (SHL-01..04, HOME-01..08) are declared in the Phase 2 plans and mapped to Phase 2 in REQUIREMENTS.md. No orphaned requirements.

| Req | Status | Evidence |
|-----|--------|----------|
| SHL-01 | SATISFIED | Sticky header, aria-current on both pages |
| SHL-02 | SATISFIED | Footer present with details, area, prototype note |
| SHL-03 | SATISFIED | Hero, mid-page and closing-band CTAs |
| SHL-04 | SATISFIED | `.sticky-cta`, browser-tested |
| HOME-01 | SATISFIED | Hero static content, no-JS readable (visually-hidden full headline, plain lede and CTA) |
| HOME-02 | SATISFIED | #services section, check-home passes |
| HOME-03 | SATISFIED | #about "Hi, I'm Sam. I live here too." with photo |
| HOME-04 | SATISFIED | #kind-words testimonials |
| HOME-05 | SATISFIED | Logo strip "Neighbours I've helped" |
| HOME-06 | SATISFIED | #how-it-works, step columns/connector browser-tested |
| HOME-07 | SATISFIED | `.cta-band` closing section |
| HOME-08 | SATISFIED | REPLACE-ME.md audited in 02-06 |

## Superseded Plan Wording (noted, not failed)

- Static "bakery" hero in plans 02-02 and similar was replaced by the bold hero with a kinetic cycling word (quick task 261013-ffc). The no-JS state still shows "bakery" plus the full hidden sentence, so HOME-01 still holds. (The cycling headline overlaps Phase 3 scope, which is now partly delivered early.)
- Original three-CTA layout, contact form, restyle and the pricing section came from quick tasks. The user approved the current Home on 2026-10-22 (02-06-SUMMARY.md), so subjective visual items are human-verified.

## Guards Run

check-contact, check-contrast, check-design-system, check-home, check-portability, smoke-test, font-metrics-test, home-browser-test, motion-browser-test and contact-browser-test all passed (exit 0, OK markers). `tools/font-metrics.js` is a browser-loaded helper, not a CLI guard, so it was not run standalone. Debt markers (TBD/FIXME/XXX) in index.html, contact.html, css and js/main.js: none.

## Anti-Patterns and Review Findings

| Item | Severity | Notes |
|------|----------|-------|
| CR-01 (02-REVIEW): contact.html no-JS form submits GET to `#`, leaking PII into the URL | Warning for Phase 2 (out of scope) | Contact form is Phase 4 (CON-*). Must be fixed there; not a Phase 2 requirement. |
| WR-01..04 (02-REVIEW): GSAP lifecycle leaks, weak phone regex, `clip-path` animation | Warning | Not blocking Phase 2 requirements. Carry to Phase 5 polish. |
| Home hero and About images hot-linked from Unsplash (external URLs) | Warning | The site shows broken images offline or if blocked (the portability guard still passes). Listed in REPLACE-ME.md as to-replace. Consider vendoring local images in Phase 5. |

## Human Verification

None outstanding. The user approved the Home on 2026-10-22.

## Gaps Summary

No gaps. The phase goal is achieved: a complete Home page, a consistent header and footer, repeated "Let's talk" CTAs and a mobile sticky CTA are all present and verified by guards and browser tests. Carry-forward items: CR-01 to Phase 4, WR-01..04 and local image vendoring to Phase 5.

_Verified: 2026-10-22_
_Verifier: Claude (gsd-verifier)_
