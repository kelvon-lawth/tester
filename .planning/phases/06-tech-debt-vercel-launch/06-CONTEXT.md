# Phase 6: Tech Debt & Vercel Launch - Context

**Gathered:** 2026-11-06
**Source:** .planning/v1.0-MILESTONE-AUDIT.md and user decisions in session

## Decisions (user)

- **D-01 Vercel connection:** the user imports the kelvon-lawth/tester GitHub repo in the Vercel dashboard. Pushes to main then redeploy automatically. No Vercel CLI, and Claude cannot log in for the user.
- **D-02 GitHub Pages:** turn it off, but only after Vercel is confirmed working. Removing the workflow does not take down the existing Pages site; the user must also disable Pages in the repo settings (`gh` is not installed).

## Decisions (implementation defaults)

- **D-03 Public files only:** without configuration, Vercel would serve the whole repo root, including `.planning/`, `tools/`, `CLAUDE.md`, `REPLACE-ME.md` and `styleguide.html`. Use a build command and output directory in `vercel.json` so only `_site/` is published.
- **D-04 Build script:** move the copy-and-strip logic from `.github/workflows/pages.yml` to a POSIX script usable on Linux and macOS (no `sed -i`). Copy `js/main.js` and vendor scripts, not `js/styleguide.js`. Keep the checks that fail the build if a style guide reference remains or the "Prototype — sample content" note is missing.
- **D-05 Style guide stays locally:** move the `.sg-*` block from `css/styles.css` into `css/styleguide.css`, linked only by `styleguide.html`, and do not deploy that file. Local `styleguide.html` must still render, and its footer link stays in local pages.
- **D-06 Unused utilities stay:** `.btn--ghost`, `.prose` and similar are the design kit shown in the style guide. Leave them; record as accepted debt.
- **D-07 Sequence:** push to main is needed for the Vercel import. The Pages workflow stays until the user confirms the Vercel URL works, then a second commit removes it.
- **D-08 Ignore files:** the repo has no `.gitignore`; add `_site/` and `.vercel/`. Do not add or touch `.claude/`.

## Scope

- In: OPS-01 to OPS-05, the three strings missing from REPLACE-ME.md, a note about the stale "removed in Phase 5" comment, SUMMARY fields for 01-01 and 04-01, STATE.md position and resolved blockers.
- Out: custom domain, real content, real form delivery, security headers, the human device and screen-reader checks (still open for the user).

## Project conventions

- Keep double-click `file://` opening working; classic scripts only.
- Commit trailer: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`
