---
phase: 07-client-login-dashboard
plan: 07
status: complete-offline
key-files:
  - vercel.json
  - CLIENT-GUIDE.md
  - REPLACE-ME.md
  - CLAUDE.md
  - .planning/PROJECT.md
---

# 07-07 Summary: security headers, marketer's guide, constraint edit

Security headers and the docs are done, but the phase is **not ready to push**: no Supabase project exists yet.

## What was built
- `vercel.json`: one `/(.*)` rule with a strict CSP (`script-src 'self'` plus the one inline-script hash, `connect-src 'self'` plus the Supabase origin), `Referrer-Policy: same-origin`, `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`. There is no unsafe-inline, unsafe-eval or wildcard. The csp group passed on 10 page loads with no violations, including Home and Contact.
- `CLIENT-GUIDE.md`: a plain-language guide for the marketer. It opens with the email limit (D-12) and covers adding clients, temporary passwords, editing a dashboard, removing a client, waking the project before a demo (D-14), the real-data rule (D-11) and what never to share.
- `REPLACE-ME.md`: a new `## Client login` section, plus additions to the dev-only file list.
- `CLAUDE.md` and `PROJECT.md`: the user chose "two lines only", so the Scope and Hosting constraint lines were replaced. The description line was left as it was.

## Guard and test fixes (each committed on its own; no assertion loosened)
- f47515d `check-auth docs`: with the `m` flag, the Client login section capture was always empty. It now ends with `(?![\s\S])`.
- d34f18a `auth-browser-test harness`: the harness now probes the origin the CSP allows (taken from js/auth-config.js), not a fixed `probe` origin that the new headers blocked.

## Pre-push gate (TESTED_SHA d34f18a)
13 of 14 guards pass. The one failure is `check-auth config`, on the stand-in js/auth-config.js. The RLS test and live sign-in were NOT RUN. History is clean and there is no uncommitted code. Details are in 07-LIVE-EVIDENCE.md.

## Outstanding
- 07-04 Task 2 (the user creates the project) and Task 3 (real config plus live proof). Change `connect-src` in vercel.json **together** with js/auth-config.js. After that, rerun the gate and write a new Pre-push section.
- No AUTH requirement is marked complete.
