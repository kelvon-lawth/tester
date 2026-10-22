# Phase 5: Polish & QA - Context

**Gathered:** 2026-10-22
**Status:** Ready for planning

<domain>
## Phase Boundary
Both pages are verified polished, accessible and fast, and ready to show clients (QA-01..03, ROADMAP success criteria 1-4).
</domain>

<decisions>
## Implementation Decisions
- The deliverable is automated QA plus small fixes. No redesign: the user approved the current Home on 2026-10-22.
- Add a QA guard, or extend the existing ones, for:
  - no horizontal scroll at 320, 375, 768 and 1280 on both pages;
  - interactive tap targets of at least 44px at 375 (inline text links inside paragraphs are exempt, per WCAG 2.5.8);
  - keyboard: every link, button and field is reachable by Tab and shows a visible focus style;
  - header and footer markup identical across index.html and contact.html;
  - Home first-view transfer weight of about 500KB or less, and CLS near 0;
  - file:// load and subfolder static hosting both work.
- Vendor the hot-linked Unsplash images (hero, About, testimonial avatars) as local, right-sized WebP or JPEG in assets/img/. Keep explicit width/height and lazy-loading below the fold. Update REPLACE-ME.md with the new local paths and the original source URLs. This fixes offline/file:// use and helps the weight budget. If downloading is impossible, keep the hot-links and record it.
- Fix whatever the new guards find, as minimally as possible.
- Real-device smoothness (HERO-06) and the screen-reader pass remain human items. List them in VERIFICATION as human_needed only if they can't be covered automatically.

### Claude's Discretion
Guard structure, image sizes and compression.
</decisions>
