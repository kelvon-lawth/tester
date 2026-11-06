# Phase 7: Client Login & Dashboard - Research

**Researched:** 2026-11-06
**Domain:** Static-site auth against a hosted Backend-as-a-Service (Supabase Auth + Postgres RLS), Vercel static hosting
**Confidence:** MEDIUM-HIGH (stack and SQL HIGH; a few dashboard-UI labels and exact email behaviours MEDIUM/ASSUMED, listed in the Assumptions Log)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (user, 2026-11-06)
- **D-01 Who:** clients of the marketer log in.
- **D-02 Real login:** a real hosted auth service, not a demo. Passwords are handled by the service.
- **D-03 After login:** a simple dashboard: welcome, their plan, next steps, with placeholder content.

### Implementation defaults, open to change
- **D-04 Service:** Supabase (Auth plus Postgres with Row Level Security), because the dashboard data needs protection as well as sign-in, and it needs no server of ours. Research must verify this against Clerk, including current free-plan limits, and flag anything that changes the choice.
- **D-05 Invite-only:** public sign-up off. The marketer invites clients and edits dashboard rows in the Supabase console. No custom admin panel.
- **D-06 Credentials:** email and password with a reset email. Research must check the service's default email limits and whether custom SMTP is needed.
- **D-07 Security model:** `dashboard.html` is a public static file, so it holds no client data and redirecting signed-out visitors is only a convenience. Protection comes from Row Level Security, tested with direct requests as a signed-out visitor and as a second client. Only the publishable client key may appear in the repo or site; the service-role key must never appear.
- **D-08 Pages:** add `login.html` and `dashboard.html`, plus any page needed to set a password from an invite or reset. Add them to the `tools/build-site.sh` allowlist and `tools/check-deploy.js`.
- **D-09 No effect on public pages:** Home and Contact load no auth code, so they keep the file:// and page-weight guarantees. Their shared header gets a plain link to login with no signed-in state.
- **D-10 No toolchain:** classic `<script defer>` with a vendored browser build of the SDK, pinned, matching the GSAP pattern. No ES modules or build step. Research must confirm such a build exists for the current SDK.
- **D-11 Placeholders:** the site remains a prototype. Sample dashboard content must be clearly fictional, and real client data is out of scope until the human security check passes.

### Human steps the plan must include
The user must create the Supabase project, turn off public sign-up, set the allowed redirect URLs to `https://tester-five-sage.vercel.app`, and supply the project URL and publishable key. Never ask for the service-role key or a password in chat. Schema SQL should be supplied for the user to run in the console.

### Things to update
`CLAUDE.md` still says "Exactly two pages" and "Static only"; `tools/` guards assert the current two-page shell. Plan changes to the guards. Raise the `CLAUDE.md` wording with the user rather than editing it silently. Our hosting stays static; the service is external.

### Related open work
Phase 6 is paused only on disabling GitHub Pages. This phase does not depend on that. While Pages lives, it serves a frozen older copy with no login.

### Out of scope (Deferred)
Self-service sign-up, social login, 2FA, billing, real reports or charts, file uploads, messaging, custom admin panel, custom domain.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Login reachable from shared header on every page | Plain link; guards must expect 3 nav links (see Architecture, guard changes) |
| AUTH-02 | Invited client signs in/out; session survives reload | supabase-js 2.119.0 UMD, `persistSession` default (localStorage); Q2, Q5 |
| AUTH-03 | Reset forgotten password by email | `resetPasswordForEmail` + token_hash email template + `verifyOtp` + `updateUser`; Q5, Q6 |
| AUTH-04 | Dashboard per client; signed-out redirected | RLS table + select-own policy; gate pattern; Q7 |
| AUTH-05 | Data enforced by the service, even via direct calls | RLS SQL, REST test matrix; Q7, Q8 |
| AUTH-06 | Invite-only; marketer edits in console | "Allow new users to sign up" off; console invite; Q4 |
| AUTH-07 | Home/Contact load no auth code; file:// message | Separate script set; `location.protocol === "file:"` check; Q10 |
</phase_requirements>

## Summary

Supabase remains the right choice (D-04 confirmed). Clerk's free tier is generous on users (50,000 monthly retained users) but Clerk is identity-only: it has no database or per-row protection, so the dashboard data would need a second service plus a way to pass Clerk JWTs into it. Supabase gives sign-in and protected rows in one free project with 50,000 MAU, 500 MB DB, and nothing the prototype needs is paid. Two things materially change the plan, neither of which flips the choice: (1) the built-in email server sends 2 emails per hour and only to members of the Supabase organisation team, so invite and reset emails to real clients will not arrive without custom SMTP, and custom SMTP providers normally want a sending domain which this project does not have (custom domain is out of scope); (2) free projects pause after 7 days of low activity.

A classic-script browser build exists: `@supabase/supabase-js@2.119.0` ships `dist/umd/supabase.js` (219,856 bytes, ~56 KB gzipped, already minified, MIT, `var supabase=` global exposing `supabase.createClient`). Default auth flow in this SDK is `implicit`, so no PKCE verifier problem exists for console-sent invites. However the default Supabase invite/reset links are single-use and are consumed by email-security link scanners; the robust static-site pattern is a custom email template that links to `set-password.html?token_hash=...&type=invite|recovery`, where the page shows a button and calls `verifyOtp` on click. This needs no redirect allow-list matching at all, works across devices/browsers, and is scanner-proof.

Security: the session lives in `localStorage`, so XSS is the main theft route. The site has zero inline scripts and zero inline styles today, so a strict `Content-Security-Policy` (`script-src 'self'`, `connect-src 'self' https://<ref>.supabase.co`) can go in `vercel.json` cheaply. Since 30 October 2026, new `public` tables on all Supabase projects need explicit `GRANT`s before the Data API can see them, so the SQL must grant `select` to `authenticated` only.

**Primary recommendation:** Supabase, UMD build vendored as `assets/js/vendor/supabase.min.js` (v2.119.0, pinned with sha256), invite and reset via `token_hash` email templates + click-to-verify, one RLS table with grant `select` to `authenticated` only, strict CSP in `vercel.json`, custom SMTP set up before any real client is invited, and an env-var-driven REST test for RLS.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Credential storage, password hashing, email send | External auth service (Supabase Auth) | — | D-02: service handles passwords |
| Per-client data access control | Database (Postgres RLS) | — | D-07: protection is in RLS, not in the page |
| Sign-in form, validation, session check, redirect | Browser | — | Static pages + `supabase-js` |
| Dashboard rendering | Browser | Database | Reads own row via REST after session verified |
| Invite / admin edits | Supabase console (human) | — | D-05, no custom admin |
| Security headers (CSP, Referrer-Policy) | CDN / Static (Vercel `vercel.json`) | — | Static host header rules |
| Static pages, vendored SDK | CDN / Static | — | `_site/` allowlist build |
| Route guarding (`dashboard.html`) | Browser (convenience only) | Database (real guard) | D-07 |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js (UMD file `dist/umd/supabase.js`) | 2.119.0 (npm `latest`, modified 2026-11-04) | Auth + PostgREST client in a classic script | Official SDK; has `jsdelivr`/`unpkg` fields pointing at the UMD file `[VERIFIED: npm view + inspected tarball]` |
| Supabase hosted project (Free plan) | n/a | Auth + Postgres + RLS | See D-04 analysis |

No other runtime dependencies. Node 24.21.0 is installed locally (for the existing `tools/` guards, zero-dependency).

### Verified facts about the browser build (Q2)
- Package: `@supabase/supabase-js` 2.119.0, license **MIT** (Copyright 2020 Supabase), repository github.com/supabase/supabase-js, `postinstall` script: none `[VERIFIED: npm view, tarball inspection]`.
- File: `package/dist/umd/supabase.js`; 219,856 bytes raw, 56,213 bytes gzip; single minified bundle (10 lines), no `sourceMappingURL`; sha256 `a867edbcfb029370aeec7223dd6180b560b621fbe3bc64c6584fb0369d1b7bce` (tarball downloaded to the scratchpad only, nothing added to the repo) `[VERIFIED: local inspection]`. npm tarball integrity: `sha512-MKP49G6bJbPhvsZDegZ/IXS/ITApPgplDCF5+F65KZ5kIArS5Y90WFxwvWYALx2bsxdrSuHvkCiXHYr3dU8+sw==`.
- Global: begins `var supabase=(function(e){...` so the page gets a global `supabase` namespace; use `supabase.createClient(url, key, options)` `[VERIFIED: file head; createClient is the documented UMD entry, MEDIUM: not executed in a browser by me]`.
- Default `flowType` is `implicit` (auth-js 2.119.0 `GoTrueClient` default settings) `[VERIFIED: tarball source]`; Supabase docs also say "The implicit flow is the default in JavaScript" `[CITED: supabase.com/docs/guides/auth/passwords?flow=pkce]`.
- Also falls back to in-memory storage when `localStorage` is unusable (session then does not survive reload) `[VERIFIED: UMD source]`. That is the "browser blocks storage" state in the UI spec; detect it by writing/reading a test key before sign-in.
- How to vendor (human-free, executor step): `npm pack @supabase/supabase-js@2.119.0` into a temp dir, extract, copy `package/dist/umd/supabase.js` to `assets/js/vendor/supabase.min.js` (the `.min.js` suffix makes the existing `cp assets/js/vendor/*.min.js` glob in `tools/build-site.sh` include it), copy `package/LICENSE` to `assets/js/vendor/SUPABASE-LICENSE.txt`, write `assets/js/vendor/SUPABASE-VERSION.md` (modelled on `GSAP-VERSION.md`) with version, source URL, sha256 and date. Extend `build-site.sh` to copy the licence file too (MIT requires the notice to ship).
- Name collision pitfall: the UMD declares global `supabase`; never name your client variable `supabase` at top level of a classic script (use `sb`/`authClient`, wrap code in an IIFE).
- Weight: ~56 KB gzip on the three auth pages only. Home/Contact unaffected (D-09).

Install: **none** (no npm install in the repo). Vendoring is a copy.

### Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| @supabase/supabase-js | npm | created 2020-01-17 (6+ yrs) | not queried | github.com/supabase/supabase-js | not run: install of slopcheck was blocked in this environment | Approved on strength of official docs naming it (Supabase docs); tagged `[ASSUMED]` per the gate's degradation rule, so planner should keep a `checkpoint:human-verify` before vendoring |

**Packages removed:** none. **Flagged [SUS]:** none. No `postinstall` script (field absent). The package is named directly in Supabase's own documentation and is the official client, so the practical risk is low, but slopcheck could not run.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase | Clerk Hobby | 50,000 monthly retained users, invitations and waitlist mode on free, but no database or RLS (it "describes Clerk's user management... plus webhooks and JWT templates for syncing data to external systems"), custom email templates and blocklists are Pro `[CITED: clerk.com/pricing]`. You would add a second data service and JWT wiring. Does not meet D-07 on its own |
| Supabase CDN `<script src>` | Vendored file | D-10 and CSP (`script-src 'self'`) both want vendored |

### Free plan facts (Q1)
- Free: 50,000 MAU, 500 MB database, 2 active projects, "Free projects pause after 7 days of inactivity" `[CITED: supabase.com/pricing]`.
- Pause trigger: "low activity over a 7-day period"; a few requests per day avoids it; restore from dashboard "up to 1 year after it was paused" `[CITED: supabase.com/docs/guides/platform/free-project-pausing]` (search snippets showed 90 days on a stale copy; trust the 1-year page, MEDIUM). Pausing means login and dashboard fail until the human clicks Resume in the dashboard. Mitigation for a demo: human visits the dashboard weekly, or a scheduled GitHub Action pings the REST endpoint with the publishable key (optional, not required; do not add without asking). Paid projects cannot be paused.
- Free plan has no backups worth relying on (third-party claim, LOW); real client data is out of scope (D-11) anyway.
- Pro-only items relevant here: leaked-password protection (HaveIBeenPwned) `[CITED: supabase.com/docs/guides/auth/password-security]`; time-boxed/inactivity session limits `[CITED: supabase.com/docs/guides/auth/sessions]`.

### Key naming and safety (Q3)
- Publishable key `sb_publishable_...`: intended for browsers, maps to Postgres role `anon`/`authenticated`, only reaches what RLS and grants allow. Not a JWT.
- Secret key `sb_secret_...`: bypasses RLS, backend only, never in browser/source/chat/URLs.
- Legacy `anon` and `service_role` are long JWTs starting `eyJ`; Supabase says they are being deprecated "by the end of 2026"; creating new keys does not disable legacy ones `[CITED: supabase.com/docs/guides/api/api-keys]`.
- Publishable key exposure "doesn't protect against reverse engineering, network inspection, or XSS/CSRF" so RLS is the only guard.
- Plan: use only `sb_publishable_` in `js/auth-config.js`. Add a guard that fails if the repo or `_site/` contains `sb_secret_`, `service_role`, or any `eyJ`-prefixed JWT-looking string (the legacy anon key is also public-safe but the guard keeps the rule simple and catches a pasted service-role JWT).
- New publishable keys are not JWTs, so do not send them as `Authorization: Bearer`; send as `apikey` header only for signed-out requests, and `Authorization: Bearer <user access_token>` plus `apikey` for signed-in ones `[ASSUMED, matches key doc statements; confirm in REST test]`.

## Architecture Patterns

### System Architecture Diagram

```
Marketer (console, human)                         Client (browser)
 Supabase Dashboard                                 |
  - Auth > Users > Invite                           | (1) opens invite email link
  - Table Editor: client_dashboards row             v
        |                              set-password.html?token_hash=..&type=invite
        | emails (custom SMTP)                      | shows "Continue" button (scanner-proof)
        v                                           | click -> sb.auth.verifyOtp({token_hash,type})
  Supabase Auth  <---- (2) POST /auth/v1/verify ----|   returns session (stored in localStorage)
   - sign-up OFF                                    | history.replaceState strips token
   - password rules                                 | sb.auth.updateUser({password})
        ^                                           v
        |                                      login.html (session check -> no session: show form)
        | POST /auth/v1/token?grant_type=password   |  signInWithPassword
        |-------------------------------------------| session ok -> location.replace
        |                                           v
  PostgREST + Postgres RLS  <-- GET /rest/v1/client_dashboards?select=* (Bearer access_token)
   policy: auth.uid() = user_id                     |
        '--- returns 0 or 1 row ------------------> dashboard.html renders with textContent
                                                    |
 Vercel static host (_site/) serves HTML/CSS/JS + vendored SDK + CSP headers
```

### Recommended Project Structure
```
login.html, set-password.html, dashboard.html     # new, noindex
js/auth-config.js        # SUPABASE_URL + publishable key + PASSWORD_MIN (only values safe to publish)
js/auth-common.js        # file:// detection, client init, error mapping, gate helpers
js/login.js, js/set-password.js, js/dashboard.js  # one file per page (planner may merge)
assets/js/vendor/supabase.min.js, SUPABASE-VERSION.md, SUPABASE-LICENSE.txt
supabase/schema.sql      # SQL for the user to run in the console (NOT deployed; not in build allowlist)
supabase/email-templates.md   # invite + recovery template HTML to paste
tools/check-auth.js (static guard), tools/auth-rls-test.js (env-driven REST test), tools/auth-browser-test.js
```
Script loading on auth pages: `<script defer src="assets/js/vendor/supabase.min.js">`, then `js/auth-config.js`, `js/auth-common.js`, page script. Home/Contact keep only `js/main.js` etc. A guard must assert index/contact contain no reference to `supabase`, `auth-`, or `sb_`.

### Pattern 1: Client init (no module, no collisions)
```html
<!-- supabase-js 2.119.0 UMD, MIT -->
<script defer src="assets/js/vendor/supabase.min.js"></script>
```
```js
// js/auth-common.js (classic script)
(function () {
  "use strict";
  var cfg = window.AUTH_CONFIG; // from auth-config.js
  if (location.protocol === "file:") { window.AuthApp = { unsupported: true }; return; }
  var sb = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { flowType: "implicit", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true }
  });
  window.AuthApp = { sb: sb, unsupported: false };
})();
```
`detectSessionInUrl: false` because we never rely on tokens in the URL fragment; we verify explicitly with `token_hash`. (`detectSessionInUrl` described as "automatically detect OAuth grants in the URL" `[CITED: supabase.com/docs/reference/javascript/initializing]`.)

### Pattern 2: Invite and recovery via token_hash + click-to-verify
Email templates (Dashboard > Authentication > Email Templates; "Invite user" and "Reset password"). Variables: `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .ConfirmationURL }}`, `{{ .RedirectTo }}` `[CITED: supabase.com/docs/guides/auth/auth-email-templates]`.
```html
<!-- Invite user -->
<h2>You're invited</h2>
<p><a href="{{ .SiteURL }}/set-password.html?token_hash={{ .TokenHash }}&type=invite">Set your password</a></p>
<!-- Reset password -->
<p><a href="{{ .SiteURL }}/set-password.html?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
```
```js
// set-password.js: on page load read params, then IMMEDIATELY remove from URL
var p = new URLSearchParams(location.search);
var tokenHash = p.get("token_hash"), type = p.get("type");
history.replaceState(null, "", location.pathname);
// show heading by type (invite vs recovery); show "Continue" button; do NOT verify on load
continueBtn.addEventListener("click", async function () {
  var r = await sb.auth.verifyOtp({ token_hash: tokenHash, type: type }); // type: 'invite' | 'recovery'
  if (r.error) return showExpired();            // any error here -> "This link has expired" view
  showPasswordForm();                            // session now exists
});
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  var u = await sb.auth.updateUser({ password: pw });
  if (u.error) return showFieldError(u.error);   // map reason text, fall back to UI-spec copy
  showSaved();
});
```
`EmailOtpType` includes `'invite'` and `'recovery'` `[VERIFIED: auth-js 2.119.0 types.d.ts]`. `verifyOtp` with `token_hash` is Supabase's documented non-PKCE alternative to default links `[CITED: supabase.com/docs/guides/auth/auth-email-templates, .../auth-email-passwordless]`. Why not the default link: links are single use and email scanners prefetch them, producing "Email link is invalid or has expired" before the user clicks `[CITED: supabase.com/docs/guides/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0]`; Supabase's own mitigation is "a custom link that opens a page where a person presses a button". The UI spec already says expired-link state exists; add the "Continue" button state to the spec (spec amendment: one extra neutral step).

Request side: `sb.auth.resetPasswordForEmail(email)` with NO `redirectTo`, since the template builds the link from `SiteURL` (Supabase: with `redirectTo` use `{{ .RedirectTo }}`, otherwise links go to Site URL `[CITED: .../auth/redirect-urls]`). Always show the generic "Check your inbox" result for success and not-found (that unknown emails return success is `[ASSUMED]`; test it).

Sign-in: `sb.auth.signInWithPassword({email, password})`. Sign out: `sb.auth.signOut()`; even on error clear local keys. Session check: `sb.auth.getSession()` is a local read; for "real" verification before rendering, the data fetch itself (RLS) is the proof, and `sb.auth.getUser()` hits the server if needed. Re-run on `pageshow` (spec).

### Pattern 3: Dashboard read
```js
var r = await sb.from("client_dashboards").select("*").maybeSingle(); // RLS returns only own row
// r.data === null -> "dashboard isn't ready yet" state; r.error -> failure state
// render with textContent only
```

### Redirect URLs and Site URL (Q5)
- Site URL = `https://tester-five-sage.vercel.app` (fallback for all email links; critical for invites/resets) `[CITED: .../auth/redirect-urls]`.
- With the token_hash templates, links are built directly from Site URL and do not pass the redirect allow-list; keep the allow-list entry `https://tester-five-sage.vercel.app/**` anyway (matches the human step in CONTEXT; docs advise exact paths for production, so `https://tester-five-sage.vercel.app/set-password.html` and `/login.html`, but `**` is acceptable for a prototype) plus `http://localhost:3000/**` only if a local server is used for testing.
- Wildcards: `*` single segment, `**` multiple segments, `.` and `/` are separators; Vercel preview pattern is `https://*-<team-or-account-slug>.vercel.app/**` `[CITED: .../redirect-urls]`. Recommendation: do NOT add preview wildcards. Emails always link to Site URL (production), so a preview deployment can never complete an invite/reset; test auth against production only, or local `http://localhost` with a separate test project.
- Session storage: `localStorage` key `sb-<project-ref>-auth-token` (supabase-js default; `storage` option overridable) `[CITED: .../auth/sessions says storage is overridable and HTTP-only cookies are not feasible for client-side JS apps]`. Tokens: access token 1 hour default; refresh tokens single-use, reuse detection kills the session `[CITED: .../auth/sessions]`.
- Expired/invalid link: `verifyOtp` returns an error (typically code `otp_expired`, HTTP 403) `[ASSUMED code name from Supabase troubleshooting article; treat any verify error as expired]`. Default email OTP validity is 1 hour for magic links `[CITED: .../auth-email-passwordless]`; invite expiry not stated in docs; the human should check "Email OTP expiration" under Auth settings and raise it (e.g. to 24 h) for invites `[ASSUMED setting name]`.

### Anti-Patterns to Avoid
- Putting client data or names in `dashboard.html` (D-07).
- Verifying the token on page load (scanner burns it).
- `innerHTML` with row data (use `textContent`).
- Using `user_metadata` in any policy or UI authorisation.
- Leaving `detectSessionInUrl` true while also reading `token_hash` (two code paths).
- Loading the SDK from a CDN (breaks CSP `script-src 'self'` and D-10).
- Naming a variable `supabase`.
- Logging tokens or passwords; putting tokens in URLs after verify.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password storage/hashing, token issue, refresh | custom crypto | Supabase Auth | D-02 |
| Email validity beyond `type=email` | regex | `input.validity` + service errors | Matches `contact.html` |
| Row protection | JS checks on rows | Postgres RLS | D-07 |
| Rate limiting | counters in JS | Service limits (below) | JS limits are bypassable |
| Session persistence/refresh | manual token handling | SDK defaults | Reuse-detection logic is in the SDK/service |
| Admin panel | custom UI | Supabase console | D-05 |

## Runtime State Inventory
Not a rename/refactor phase. Omitted.

## Common Pitfalls

### Pitfall 1: Built-in email will not reach real clients
**What goes wrong:** Invites/resets to non-team addresses fail with "Email address not authorized"; the whole project gets 2 emails per hour, no SLA.
**Why:** Default SMTP is for team members only `[CITED: supabase.com/docs/guides/auth/auth-smtp; .../rate-limits]`.
**How to avoid:** Custom SMTP is required for any real client (answer to Q6: yes, even for one client who is not on the Supabase org team). Once configured the default limit is 30 emails/hour (adjustable under Rate Limits). Suggested providers named by Supabase: Resend, AWS SES, Postmark, SendGrid, ZeptoMail, Brevo; Supabase advises DKIM/DMARC/SPF and a separate sending domain, which implies owning a domain (out of scope, custom domain deferred). `[CITED: auth-smtp]`. Free tiers of those providers: not checked (LOW). Note: no custom domain exists yet, so the realistic prototype choices are: (a) human adds the demo client's email as an organisation team member (works with the built-in sender, 2/hour), or (b) human picks an SMTP provider that supports single-sender verification and accepts weaker deliverability, or (c) the marketer creates the user in the console with a password and shares it out-of-band (no email at all; "Create new user" with auto-confirm in Auth > Users, `[ASSUMED]` dashboard option labels). Flag as Open Question 1 for the user. Reset-by-email will not work for non-team addresses until SMTP exists; the UI copy "If that email belongs to a client..." remains accurate but delivery fails silently.
**Warning signs:** 429 `over_email_send_rate_limit`; no email arrives.

### Pitfall 2: Resend timer mismatch
Per-user limit on reset/OTP requests is one per 60 seconds, signups/sign-ins/recover per IP 30 per 5 minutes, token endpoint 150 per 5 minutes per IP `[CITED: .../auth/rate-limits]`. The UI spec's 30-second "Send it again" is shorter than the 60-second server limit: set the countdown to 60 s. Map HTTP 429 to the spec's "Let's slow down" / "That's a lot of tries" copy.

### Pitfall 3: New tables not reachable (grants), and over-granting
Since 30 October 2026 new `public` tables are not exposed to the Data API without explicit `GRANT`s; missing grants give error `42501` before any policy runs `[CITED: supabase.com/changelog/45329-...]`. Supabase's own example grants `select` to `anon` and all DML to `authenticated`; do NOT copy that. Grant only `select` to `authenticated`. If the project predates the change and still auto-grants, the explicit `revoke` in the SQL below makes the result the same either way.

### Pitfall 4: RLS enabled but policy trusts user-editable data
`user_metadata` is editable by the user; never reference `raw_user_meta_data`/`auth.jwt()->'user_metadata'` in policies `[CITED: .../auth/users; .../row-level-security]`. Use `auth.uid()` only. Do not put the plan or first name in `user_metadata`; keep them in the table.

### Pitfall 5: Free project paused
Login fails after 7 idle days. Add to the human checklist and the UI failure state is the existing "couldn't reach the sign-in service" copy. Consider copy "check back" for the prototype. Resume from dashboard.

### Pitfall 6: Weak password minimum
Hosted default minimum is believed to be 6 characters (only a third-party audit source says so, LOW); Supabase docs advise at least 8 and allow setting a larger minimum plus required character classes in Auth settings `[CITED: .../auth/password-security]`. Leaked-password protection is Pro-only. Recommendation: human sets minimum length to 10 in Auth settings (matches the UI spec placeholder), and `auth-config.js` carries `PASSWORD_MIN = 10`. The service is the authority; client check is only convenience. Do not rely on character-class rules for UX copy ("At least 10 characters" only).

### Pitfall 7: Sign-in error leaks
Wrong password gives `invalid_credentials`; unconfirmed email gives a different code (`email_not_confirmed`) `[ASSUMED code names]`. Map both (and any 400 on the token endpoint) to the one "That didn't work" banner per spec. Distinguish network errors (`AuthRetryableFetchError`/fetch failure) from credential errors.

### Pitfall 8: Back/forward cache and stale gates
Spec already requires `pageshow` re-check. Also: after sign-out call `signOut()` before redirect and remove `sb-*-auth-token` keys in a `finally`.

### Pitfall 9: file:// and storage
On `file:`, origin is opaque; do not call the SDK at all (detect with `location.protocol === "file:"` before constructing the client). `[ASSUMED]` that the SDK would otherwise mostly work in Chrome but not guaranteed (CORS from `null` origin, localStorage differences in Safari/Firefox); I did not test, and detection makes it moot. The existing smoke test opens pages via file://, so it will exercise this state: it must expect the message, no console errors, no network calls.

### Pitfall 10: Guards assume two pages
`tools/check-deploy.js` `REQUIRED` list and "unexpected file" rule, nav-parity checks, `check-portability`, `check-design-system`, `smoke-test.js` default page list, and header link-count checks all need updating (see Validation, Wave 0). Also `vercel.json` guard must allow a `headers` key. `build-site.sh` mkdir/cp lines and the `sed` loop over `index.html contact.html` and the "Prototype — sample content" grep loop must include the new pages (the prototype note should also be on the new pages per UI spec footer).

### Pitfall 11: CSP breaking existing features
Existing pages: no inline `<script>`, no `style=`, no `<style>`, fonts local, images local, one `data:` favicon and `data:` SVG mask in CSS. CSP must allow `img-src 'self' data:`. JS-set `element.style` (GSAP) is not blocked by `style-src 'self'` (only markup `style` attributes/`setAttribute('style')` are). Verify with the headless browser tests (no CSP violation console messages).

## Code Examples

### vercel.json headers (adds to existing keys; do not remove buildCommand/outputDirectory/framework)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "sh tools/build-site.sh",
  "outputDirectory": "_site",
  "framework": null,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://PROJECTREF.supabase.co; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
        { "key": "Referrer-Policy", "value": "same-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```
Header syntax (`source` path pattern `/(.*)`, `headers` array of `key`/`value`) `[CITED: vercel.com/docs/project-configuration/vercel-json#headers]`. `PROJECTREF` is only known after the human creates the project, so the plan has the executor add the header after receiving the project URL (public value, fine to share in chat). Add `Cache-Control: no-store` for `set-password.html`? Optional; the token is stripped from the URL immediately. Also consider `Cache-Control: no-cache` on the three auth pages so a stale gate is not served; low priority. `cleanUrls` must stay unset (guard asserts it). Test CSP in headless Chrome by capturing `Log.entryAdded`/console "Content Security Policy" violations on every page.

### Schema SQL (human runs in SQL Editor; Q7)
```sql
-- One row per client. user_id is the owner and the only thing policies look at.
create table public.client_dashboards (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  plan_name  text not null,
  plan_items text[] not null default '{}',
  check_in   text,
  steps      jsonb not null default '[]'::jsonb,   -- [{ "title":..., "detail":..., "due":... }]
  is_sample  boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.client_dashboards enable row level security;

-- Explicit grants (required since 30 Oct 2026; also removes any legacy auto-grants).
revoke all on public.client_dashboards from anon, authenticated;
grant select on public.client_dashboards to authenticated;

-- Read-own policy. No insert/update/delete policy and no such grants: clients cannot write.
create policy "clients read own dashboard"
  on public.client_dashboards
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Verification (run in the SQL editor as the postgres owner):
-- 1) RLS on:
select relrowsecurity from pg_class where oid = 'public.client_dashboards'::regclass;     -- expect t
-- 2) Policies present (expect exactly one, cmd = SELECT, roles = {authenticated}):
select policyname, cmd, roles from pg_policies where tablename = 'client_dashboards';
-- 3) Grants (expect only SELECT for authenticated; nothing for anon):
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'client_dashboards' and grantee in ('anon','authenticated');

-- Sample rows for the two TEST users, created in Auth > Users first:
-- insert into public.client_dashboards (user_id, first_name, plan_name, plan_items, check_in, steps)
-- select id, 'Sample Alex', 'Sample Starter Plan',
--   array['Sample: monthly social posts','Sample: Google profile tune-up','Sample: one small local ad'],
--   'Sample: every second Friday',
--   '[{"title":"Sample step: pick your favourite shop photos","detail":"...","due":"Sample date: this week"}]'::jsonb
-- from auth.users where email = 'test-client-a@example.com';
```
Notes: the table is `on delete cascade` so removing a user removes the row. `(select auth.uid())` wrapped for per-statement caching `[CITED: .../row-level-security]`. `to authenticated` stops the expression running for `anon`. Default-deny: with RLS on and no policy for a role, the API returns no rows `[CITED: .../row-level-security]`. Console edits by the marketer use the privileged `postgres` role, so no insert policy is needed (D-05). Do not use `force row level security` (it would apply to the owner role and could block console edits). Because `user_id` is the primary key, it is already indexed for the policy filter. Also tell the human: Dashboard > Authentication > Policies/Security Advisor ("RLS disabled" lint) should show nothing for this table.

### REST test (Q8) sketch, Node 24 global fetch, zero dependencies
```js
// tools/auth-rls-test.js — reads env, never prints secrets, SKIPS (exit 0, loud message) if env absent
const URL_ = process.env.SUPABASE_URL, KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
async function signIn(email, password) {
  const r = await fetch(`${URL_}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }) });
  return (await r.json()).access_token;
}
const get = (path, token) => fetch(`${URL_}/rest/v1/${path}`, {
  headers: Object.assign({ apikey: KEY }, token ? { Authorization: `Bearer ${token}` } : {}) });
// Cases: A reads own row (200, 1 row, user_id = A); A filtered to B's user_id -> []; signed-out -> 401/403 or [];
// A/B POST/PATCH/DELETE -> 401/403 and row unchanged (re-read); signup attempt -> error (sign-ups off);
// sanity: only sb_publishable_ key used.
```
Env vars (set by the human in their own shell or an untracked `.env.local`; `.gitignore` must list `.env*`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `TEST_CLIENT_A_EMAIL`, `TEST_CLIENT_A_PASSWORD`, `TEST_CLIENT_B_EMAIL`, `TEST_CLIENT_B_PASSWORD`. The test accounts are created by the human in the console (Auth > Users, with password, email auto-confirmed) using `.example` addresses; passwords never go through chat or the repo. Add a guard that fails if any committed file contains those variable values pattern or `.env` files are tracked.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `anon` / `service_role` JWT keys | `sb_publishable_` / `sb_secret_` keys | rollout 2025-26; legacy deprecated by end of 2026 | Use publishable key; disable legacy keys in dashboard once the new ones work (human step) |
| New public tables auto-exposed | Explicit `GRANT` required | all existing projects 2026-10-30 | SQL must include grants |
| Default confirm links | `token_hash` links for scanner safety | Supabase docs/troubleshooting | Use click-to-verify page |

**Deprecated:** legacy JWT API keys (end of 2026). Do not put them in the repo.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | slopcheck could not be run; `@supabase/supabase-js` legitimacy rests on official Supabase docs naming it | Package Legitimacy | Low; planner keeps a human-verify checkpoint |
| A2 | Hosted default minimum password length is 6 | Pitfall 6 | Low; plan sets 10 explicitly anyway and human verifies the setting |
| A3 | `resetPasswordForEmail` returns success for unknown emails | Pattern 2 | Spec copy still safe, but test must confirm no enumeration |
| A4 | Sign-in error code names (`invalid_credentials`, `email_not_confirmed`, `otp_expired`, `over_email_send_rate_limit`) | Pitfalls 7, Pattern 2 | Map by HTTP status/any error instead; verify in browser test |
| A5 | Dashboard labels: "Allow new users to sign up", "Email OTP expiration", Auth > Users > Add user (Send invitation / Create new user with auto-confirm), Email Templates names | Human steps | Human may find slightly different labels; steps should say "or similar" |
| A6 | Dashboard invites still work with sign-up off (third-party sources only; official docs say invite is an admin action via Dashboard or secret key and are silent on the toggle) | Q4 | Medium: if wrong, AUTH-06 conflicts with invites; human step 5 verifies before relying on it |
| A7 | Invite link validity default equals OTP expiry (1 h) | Pattern 2 | Invites may expire before a client clicks; fallback is the expired-link state, marketer re-invites |
| A8 | Publishable key must not be sent as `Authorization: Bearer` | Key naming | Test will show; low |
| A9 | UMD global exposes `supabase.createClient` (not executed in a browser by me) | Q2 | Low; first browser test catches it |
| A10 | Free-tier pricing of SMTP providers and whether they accept an unverified domain | Pitfall 1 | Medium; human decision, flagged as Open Question |
| A11 | Project restore window 1 year (docs) vs 90 days (stale copy) | Free plan | Low |

## Open Questions (RESOLVED)

1. **Email delivery for non-team clients (needs user decision).**
   - Known: built-in SMTP only mails org team members at 2/hour; custom SMTP needs a provider and normally a sending domain.
   - Unclear: whether the user will set up SMTP now, or demo with team-member emails / console-created passwords.
   - Recommendation: plan the code for email flows regardless; human-step list includes SMTP as "required before inviting a real client", with option (c) console-created user for the prototype demo. Ask the user which route.
   - RESOLVED: D-12. No custom email service for now; the marketer creates accounts with a temporary password, and invite and reset are tested with a Supabase team member's address.
2. **CLAUDE.md wording** ("Exactly two pages", "Static only"): raise with user, per CONTEXT. Do not edit silently.
   - RESOLVED: D-13. The user approved the update, applied in 07-07.
3. **Free-project pausing**: accept for prototype or add a keep-alive? Recommend accept and document.
   - RESOLVED: D-14. Pausing accepted for the prototype with no keep-alive; the check before a demo is documented in CLIENT-GUIDE.md (07-07).
4. **Spec amendments** for the UI checker: 60 s resend countdown, extra "Continue" step on set-password, `PASSWORD_MIN` constant.
   - RESOLVED: the amendments in 07-UI-SPEC.md, implemented in 07-06.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node | guards, REST test | yes | v24.21.0 (global `fetch`/`WebSocket`) | — |
| npm | one-time vendoring | yes | present | download tarball manually |
| Google Chrome | headless browser tests | yes | `/Applications/Google Chrome.app` | `CHROME_PATH` env |
| Supabase project | everything live | no (human creates) | — | static/stubbed tests only until created |
| Custom SMTP | real-client email | no | — | team-member emails / console-created user |
| slopcheck | package gate | no (install blocked) | — | `[ASSUMED]` tag + human-verify |

**Blocking until human acts:** Supabase project, URL, publishable key, test accounts, schema run.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Zero-dependency Node scripts under `tools/` (existing convention); headless Chrome via CDP |
| Config file | none |
| Quick run command | `node tools/check-auth.js` (static) and existing `node tools/check-deploy.js` |
| Full suite command | existing guards + `node tools/check-auth.js && node tools/auth-rls-test.js && node tools/auth-browser-test.js` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Header has third link `login.html` on all pages incl. new ones; parity holds | static | `node tools/check-auth.js` (and updated `check-design-system.js`) | Wave 0 |
| AUTH-02 | Sign in/out, session survives reload | live browser (real project, env creds) | `node tools/auth-browser-test.js live` | Wave 0 |
| AUTH-02 | Form validation, busy states, no-session redirect, gate hidden | stubbed browser (route-intercept `*.supabase.co` via CDP `Fetch.enable`, canned responses) | `node tools/auth-browser-test.js stub` | Wave 0 |
| AUTH-03 | Reset request generic message; token_hash page: no verify on load, verify on click, expired view, token stripped from URL | stubbed browser | `node tools/auth-browser-test.js stub` | Wave 0 |
| AUTH-03 | Real email delivery | manual (needs SMTP/inbox) | human checklist | manual-only: email delivery is external |
| AUTH-04 | No client markup in static `dashboard.html`; renders row via `textContent`; empty and failure states | static + stubbed | `check-auth.js`, `auth-browser-test.js stub` | Wave 0 |
| AUTH-05 | RLS: A reads own; A cannot read B; signed-out gets none; no writes; sign-up refused | live REST | `node tools/auth-rls-test.js` | Wave 0 |
| AUTH-06 | Public sign-up off | live REST (signup call fails) + manual console check | `auth-rls-test.js`, human step | Wave 0 |
| AUTH-07 | Home/Contact contain no auth refs/scripts; weights within budget; file:// smoke passes; auth pages on file:// show the message with no console errors and no network calls | static + existing smoke | `check-auth.js`, `node tools/smoke-test.js`, `check-portability.js` | partly existing |
| Security | No `sb_secret_`/`service_role`/`eyJ` strings in repo or `_site`; `.env*` untracked; CSP header present and page loads with no violations | static + browser | `check-auth.js`, `check-deploy.js` | Wave 0 |

Live vs stubbed: headless Chrome against the REAL project can do sign-in, reload persistence, sign-out, dashboard rendering and the file:// message, using env credentials typed into the page via CDP (never logged, never in argv). Anything involving email (invite, reset delivery, token_hash links) is stubbed by intercepting requests, or manual. CORS/CSP and the real `connect-src` are only truly proven on the deployed Vercel URL, so one post-deploy check is manual or run the browser test with `BASE_URL=https://tester-five-sage.vercel.app` (CDP against the deployed site; credentials still via env). Live tests must skip loudly, not pass, when env vars are missing.

### Sampling Rate
- **Per task commit:** `node tools/check-auth.js && node tools/check-deploy.js`
- **Per wave merge:** all static guards + stubbed browser tests
- **Phase gate:** full suite incl. live RLS and live browser tests green with env set, then human security check

### Wave 0 Gaps
- [ ] `tools/check-auth.js` (static guard: secrets scan, no-auth-on-public-pages, noindex, nav parity, no inline script/style, `.env` ignored)
- [ ] `tools/auth-rls-test.js` (env-driven REST)
- [ ] `tools/auth-browser-test.js` (stub + live groups, CDP)
- [ ] Updates: `tools/check-deploy.js` (new REQUIRED files, allowed `headers`, nav count), `tools/build-site.sh` (new pages, js, vendor, licence), `check-design-system.js`, `smoke-test.js` page list, `check-portability.js`, `.gitignore` (`.env*`)
- [ ] Framework install: none

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth; password min set to 10 in Auth settings; invite-only; generic errors |
| V3 Session Management | yes | SDK session (localStorage), 1 h access token, single-use refresh tokens with reuse detection; sign-out clears keys |
| V4 Access Control | yes | Postgres RLS + explicit grants; select-own only |
| V5 Input Validation | yes | Native validation + `textContent` rendering; service validates |
| V6 Cryptography | yes | Never hand-roll; service-side hashing; HTTPS only |
| V14 Config | yes | CSP, Referrer-Policy, no secret key anywhere |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS stealing localStorage session | Information disclosure | Strict CSP (`script-src 'self'`), no inline JS, vendored SDK, `textContent` only, no third-party scripts on auth pages. Cannot be fully removed because localStorage is readable by any script that runs; accept and note (docs say HTTP-only cookies are not feasible for client-side JS apps) |
| Token in URL leakage (referrer/history/logs) | Information disclosure | `history.replaceState` immediately; `Referrer-Policy: same-origin`; verify only on click |
| Email-scanner burning links | Denial of service | token_hash + click-to-verify |
| Brute force / credential stuffing | Spoofing | Service rate limits (token endpoint 150 per 5 min per IP, resets 1/60 s per user) `[CITED: rate-limits]`; CAPTCHA (hCaptcha/Turnstile) exists but adds a third-party script, out of scope, mention only |
| Account enumeration | Information disclosure | Same message for wrong email/password and for reset |
| Over-broad RLS/grants | Elevation of privilege | Revoke-then-grant, REST test matrix, security advisor check |
| Service-role key leak | Elevation of privilege | Guard scans; never in chat; if ever leaked, rotate |
| Open sign-up | Elevation | Toggle off + REST test that `/auth/v1/signup` fails |
| Clickjacking | Tampering | `frame-ancestors 'none'`, `X-Frame-Options: DENY` |

## Human Setup Steps (in order; user never pastes a password or secret key into chat)

1. Create a Supabase account/project (free plan). Choose a region near the audience. Set a database password and store it in a password manager; it is not needed by us.
2. Authentication settings: turn OFF "Allow new users to sign up" (label may differ slightly). Set minimum password length to 10 (and optionally require lower+upper+digit). Check "Confirm email" is on. Raise email OTP expiry for invites if offered (e.g. 24 h).
3. Authentication > URL Configuration: Site URL `https://tester-five-sage.vercel.app`; Redirect URLs: `https://tester-five-sage.vercel.app/**` (no preview wildcards).
4. Authentication > Email Templates: paste the Invite and Reset templates from `supabase/email-templates.md` (token_hash links).
5. Decide email route (Open Question 1): custom SMTP now, or add the demo client email as an organisation team member / create the user with a password in the console. Only then invite.
6. SQL Editor: run `supabase/schema.sql`; then run the three verification queries and confirm results.
7. Create two TEST users (`.example`-style or personal test addresses) in Auth > Users with passwords, email confirmed; insert two sample rows (seed snippet).
8. Project Settings > API Keys: copy the Project URL and the **publishable** key (`sb_publishable_...`) into chat. Never the secret key, never a password. Optionally disable the legacy `anon`/`service_role` keys once the new ones work.
9. Set test credentials in your own terminal environment (or an untracked `.env.local`), not in chat: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `TEST_CLIENT_A_EMAIL/PASSWORD`, `TEST_CLIENT_B_EMAIL/PASSWORD`.
10. After deploy: real-inbox check (invite, reset, expired link), then the human security check before any real client data (D-11): try the REST test, view-source for secrets, confirm sign-up refused.

## Sources

### Primary (HIGH confidence)
- npm registry: `npm view @supabase/supabase-js` (2.119.0, MIT, modified 2026-11-04); inspected tarball `dist/umd/supabase.js`, auth-js 2.119.0 source (default flowType implicit, EmailOtpType)
- https://supabase.com/docs/guides/api/api-keys (key naming, deprecation)
- https://supabase.com/docs/guides/auth/auth-smtp (2/hour, team-only, 30/hour custom)
- https://supabase.com/docs/guides/auth/rate-limits (limits table)
- https://supabase.com/docs/guides/database/postgres/row-level-security (policies, user_metadata warning, default deny)
- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically (grants, 2026-10-30)
- https://supabase.com/docs/guides/platform/free-project-pausing (7 days, 1 year restore)
- https://supabase.com/pricing (50k MAU, 500 MB, 7-day pause)
- https://supabase.com/docs/guides/auth/auth-email-templates (template variables, token_hash)
- https://supabase.com/docs/guides/auth/redirect-urls (allow-list, wildcards, Vercel previews)
- https://supabase.com/docs/guides/auth/passwords?flow=pkce (implicit default in JS, updateUser)
- https://supabase.com/docs/guides/auth/sessions (1 h JWT, refresh reuse, Pro-only session limits)
- https://supabase.com/docs/guides/auth/password-security (min length advice, leaked-password Pro)
- https://vercel.com/docs/project-configuration/vercel-json (headers syntax)

### Secondary (MEDIUM)
- https://supabase.com/docs/guides/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0 (prefetch cause, button mitigation)
- https://supabase.com/docs/guides/auth/general-configuration ("Allow new users to sign up")
- https://clerk.com/pricing (Hobby limits; no DB)

### Tertiary (LOW)
- Third-party blogs: invites work with sign-ups disabled; default min password 6; free-tier no backups.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH (version and file inspected directly)
- Architecture (token_hash flow): MEDIUM-HIGH (documented pattern; not executed against a live project)
- RLS SQL: HIGH (matches official guidance and new-grant rules)
- Email/SMTP: HIGH on limits, LOW on provider free tiers and domain requirement
- Dashboard UI labels and invite-with-signup-off: MEDIUM/LOW (verify in step list)

**Research date:** 2026-11-06
**Valid until:** 2026-12-06 (Supabase key/grant changes are moving; recheck the changelog before executing)
