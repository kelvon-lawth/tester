---
phase: 06-tech-debt-vercel-launch
plan: 01
subsystem: deploy
tags: [vercel, build, guards, css]
requirements-completed: [OPS-01, OPS-02]
key-files:
  created: [tools/build-site.sh, tools/check-deploy.js, vercel.json, .gitignore, css/styleguide.css]
  modified: [css/styles.css, styleguide.html, .github/workflows/pages.yml, tools/check-design-system.js, tools/check-home.js, tools/qa-browser-test.js, REPLACE-ME.md]
commits: [663c114, 339bf3f, 198014e]
pushed: 198014e
---

# Phase 6 Plan 01: Public-only build and Vercel config Summary

POSIX allowlist build (tools/build-site.sh) publishes only public files to _site, wired into vercel.json and pages.yml, with the style guide CSS moved to css/styleguide.css and a 12th guard (check-deploy.js) asserting the output.

## Commits
- 663c114 test: failing deploy guard and style guide move checks
- 339bf3f feat: build public-only _site and move style guide CSS
- 198014e docs: REPLACE-ME.md strings and automatic dev-file exclusion

All 12 guards pass. Pushed to origin/main at 198014e (plain push, accepted).

## Deviations from Plan
- Wording only: the comment in build-site.sh was reworded so it does not contain the text "sed -i" (the guard greps for it).
- Planning files were already committed, so no extra planning commit was needed.

## Known Stubs
None.

## Self-Check: PASSED
