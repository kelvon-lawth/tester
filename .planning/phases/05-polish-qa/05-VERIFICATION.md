---
phase: 05-polish-qa
verified: 2026-10-22
status: human_needed
score: 3/3
human_verification:
  - test: "Hero and scroll animation smoothness on a real phone and laptop (HERO-06)"
    why_human: "Headless Chrome has no GPU; p95 frame time only measured headless"
  - test: "Screen-reader pass (VoiceOver/NVDA) on Home and Contact"
    why_human: "Announcement quality can't be fully asserted by guards"
---

# Phase 5 Verification

| Req | Verdict | Evidence (qa-browser-test at cc7d000) |
|-----|---------|------------------------------------|
| QA-01 | VERIFIED | overflow: none at 320/375/768/1280 on both pages, plus no-JS 320. tap: 29 targets at 375, all at least 44px |
| QA-02 | VERIFIED | keyboard: Tab reaches all 15 controls per page at 1280 and 375, each with a visible focus style. Space and Enter operate the toggle and submit |
| QA-03 | VERIFIED | weight: 400KB at 1280 and 360KB at 375, same-origin only, CLS 0.000 (photos vendored to assets/img/) |

Success criterion 4: the shell group (header and footer identical, one aria-current) and the hosting group (file:// and http subpath, from a path containing a space) both pass.
All 11 guards pass. The remaining items above are human-only.
