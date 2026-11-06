---
phase: 7
slug: client-login-dashboard
status: approved
reviewed_at: 2026-11-06
shadcn_initialized: false
preset: none
created: 2026-11-06
---

# Phase 7 — UI Design Contract

> Visual and interaction contract for Phase 7: Client Login & Dashboard. Requirements: AUTH-01..AUTH-07. This file INHERITS `01-UI-SPEC.md` and `02-UI-SPEC.md` (tokens, type, spacing, colour, accents, interaction states, tone, plus the quick-task amendments). It does not redefine them. Where it conflicts with `07-CONTEXT.md` (D-01..D-11), CONTEXT.md wins. Pre-populated from: CONTEXT.md (D-01, D-03, D-05, D-08, D-09, D-11), existing specs, `contact.html` (form, error and success pattern) and `css/styles.css`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (plain HTML, one hand-written `css/styles.css`, classic deferred scripts; shadcn gate not applicable) |
| Preset | not applicable |
| Component library | none. Reuse `.container`, `.section`, `.card`, `.card--white`, `.btn`, `.btn--primary`, `.btn--ghost`, `.field`, `.field__label`, `.field__input`, `.field__hint`, `.field__req`, `.field__error`, `.contact-success` (pattern), `.link-cta`, `.visually-hidden`, `.skip-link`, `.site-header`, `.site-nav`, `.site-footer` |
| Icon library | none. No new icons in this phase |
| Font | Inherited: Fraunces 600 (headings) + Figtree 400/600. No new families |
| Theme | Light only (inherited) |

### New tokens
None. No new colours, sizes, radii, shadows or fonts.

### New classes (values from existing tokens only; no hex outside `:root`)
`.page-auth` (body/main modifier, sets `--fs-heading: 1.75rem` like `.page-contact` so form headings stay calm), `.auth` (centred single column wrapper, `max-inline-size: 30rem`, `margin-inline: auto`), `.auth__card` (a `.card.card--white` variant, padding `--space-lg` below 640px and `--space-xl` from 640px), `.auth__links` (stacked secondary links), `.auth__status` (message region, reuses success/error text styling), `.dash`, `.dash__grid`, `.dash__sample` (sample-content tag), `.dash__steps`, `.auth-gate` (pre-session-check wrapper, see Loading). Executor may collapse these into existing classes where identical.

Also new (checker notes, 2026-11-06): `.lede` (no such rule exists yet; only `.hero__lede`) and `.field__toggle` (Show password: text-only, ink colour, 44px target). `.field` has no base rule: reuse the bare `<div class="field">` wrapper from `contact.html`.

**Focal points:** login is the h1 and the "Sign in" button; dashboard is the h1 and the "Next steps" card.

**Amendments from research (2026-11-06; these win over anything below):** the "Send it again" countdown is 60s, matching the server limit. `set-password.html` strips the token from the URL immediately and shows a "Continue" button, which is what uses the link, because email scanners open links in advance. The password minimum comes from a single `PASSWORD_MIN` constant matching the console setting (10). Per D-12, reset copy must not promise that an email reaches every client: tell people to contact the marketer if no email arrives. Add a client-facing path for accounts given a temporary password to change it.

### New JS (contract only)
Auth code loads ONLY on `login.html`, `set-password.html`, `dashboard.html` (D-09). Home and Contact load none. Plan decides the file split.

---

## Pages and anatomy

| File | Purpose | Indexing | Header nav state |
|------|---------|----------|------------------|
| `login.html` | Sign in + "forgotten password" request (two views in one page, see below) | `<meta name="robots" content="noindex, nofollow">` | "Client login" has `aria-current="page"` |
| `set-password.html` | Set a password from an invite or reset link | noindex, nofollow | none current (link still present) |
| `dashboard.html` | Signed-in client dashboard | noindex, nofollow | "Client login" has `aria-current="page"` |

All three use the shared header and footer between the `SHELL:` markers, the skip link, `main#main[tabindex="-1"]`, one `h1`. All three also exist in the allowlist (D-08) and are excluded from the public sitemap if one exists. Titles: `Client login | Sam Whitlock`, `Set your password | Sam Whitlock`, `Your dashboard | Sam Whitlock`. Meta description is omitted on these three (not for search).

Page background white. Auth pages: `section.section` containing `.auth` centred, with a short intro line above a `.card.card--white` (white card on white page uses the existing `--shadow-card`/edge; if the card would disappear, place the section on `--color-tint` as the single tint section on the page). **Decision:** auth pages use `section.section--tint` so the white card reads; dashboard uses white page with white cards on a tint band for the plan/steps area (one tint section only, never two touching). No squiggle, no navy band, no blobs, no hero fields on these pages. Header and footer are the only chrome. Footer on navy is unchanged.

---

## Shared header link (AUTH-01, all pages)

Add a third list item to the existing header nav, identical markup on every page (shared-shell parity rule still applies; `tools/` guards updated to expect three links):

```
nav.site-nav[aria-label="Main"] > ul
  li > a[href="index.html"]    Home
  li > a[href="contact.html"]  Contact
  li > a[href="login.html"]    Client login
```

- **Label: "Client login".** Decided: plain and findable for the clients it is for, and warmer than "Sign in" or "Portal". The warm voice is carried by the page copy ("Welcome back", "Your corner of the site") not the nav word. No icon, no signed-in state, no avatar, no auth code in the header (D-09). The link is always "Client login", even when signed in; the dashboard page itself offers "Sign out".
- Styled exactly like the other nav links (Label type, ink, 44px target, `--space-sm` inline padding, hover `--color-blue-hover` + underline). It is NOT a button and NOT accented, so the primary-CTA hierarchy on Home is untouched.
- Width at 320px: wordmark (~115px) + three links exceeds 288px. Contract: `.site-header__inner` gets `flex-wrap: wrap` below 640px; wordmark row 1, nav row 2 (full width, `justify-content: flex-start`, `gap: var(--space-xs)`); `--header-h` for the sticky header must grow accordingly (executor measures and sets `--header-h` per breakpoint so scroll-padding stays correct). From 640px: single row as today. No hamburger.
- Current page: login and dashboard carry `aria-current="page"` on this link (blue, 2px underline, existing rule). Home and Contact markup differs only in `aria-current`, as before.
- On `index.html` the sticky mobile CTA is unaffected.

---

## Spacing Scale

Inherited unchanged: 4 / 8 / 16 / 24 / 32 / 48 / 64 (`--space-xs`..`--space-3xl`). Breakpoints 640 and 1024 only, mobile-first.

| Where | Value |
|-------|-------|
| Auth section padding | `.section` standard (64px mobile, 96px desktop); on the short auth pages use `padding-block: var(--space-2xl) var(--space-3xl)` below 1024px so the form sits near the top on phones |
| `.auth` max width | 30rem (480px), centred; full width of the gutters below that |
| Intro (h1 + lede) to card | `--space-xl` |
| Card inner padding | `--space-lg` (phones), `--space-xl` (640px+) |
| Between fields | `--space-lg` (existing `.contact-form` rhythm) |
| Label to input | `--space-sm` (existing) |
| Last field to submit button | `--space-xl`; button full width inside the card below 640px, auto width from 640px |
| Secondary links under the button | `--space-lg` above, stacked, `gap: var(--space-xs)`, each 44px tall |
| Dashboard grid | `.grid-12` gap `--space-xl`; cards gap `--space-lg` |
| Dashboard welcome to cards | `--space-2xl` |

Exceptions: 44px minimum tap targets everywhere (inputs, buttons, links, show-password toggle); 2px borders; 3px focus ring. None other.

---

## Typography

Inherited unchanged: exactly 4 sizes (Label 14, Body 18, Heading 28, Display fluid) and 2 weights (400, 600). Line heights 1.4 / 1.5 / 1.2 / 1.1.

| Element | Size | Weight | Family | Colour |
|---------|------|--------|--------|--------|
| h1 on auth pages ("Welcome back", etc.) | Heading (`--fs-heading`, 28px via `.page-auth`) | 600 | Fraunces | ink |
| h1 on dashboard ("Hello, {first name}") | Heading, but allow the Home fluid heading value (not Display) | 600 | Fraunces | ink |
| h2 on dashboard cards ("Your plan", "Next steps") | Body 18px | 600 | Fraunces | ink (same as the h3 card-title rule in Phase 2) |
| Lede, helper text, card body | Body 18px | 400 | Figtree | ink (lede may be ink-soft on white, 7.53:1) |
| Field labels | Label 14px | 600 | Figtree | ink |
| Field hint / "(required)" | Label 14px | 400 | Figtree | ink-soft |
| Field error text | Label 14px | 600 | Figtree | `--color-error` |
| Form status / banner text | Body 18px | 400 | Figtree | ink; heading line Body 600 |
| Buttons, secondary links | Label 14px | 600 | Figtree | per existing |
| "Sample content" tag | Label 14px | 600 | Figtree | ink on tint pill (`--radius-pill`) |

Form input text is Body 18px (prevents iOS zoom). No italics, caps or new sizes.

---

## Color

Inherited 60/30/10: white dominant, tint secondary (the one tint band per page, plus field backgrounds), accent blue, navy footer only. Coral is NOT used on these pages (no decorative accent is needed; the squiggle and underline are reserved for Home).

Accent (blue) reserved for on these pages: (1) primary buttons ("Sign in", "Send reset link", "Save password", "Try again" when primary), (2) inline text links and the current-page nav indicator, (3) keyboard focus ring and field focus border, (4) nothing else. Not used on: banners, tags, step markers, card titles.

Error: `--color-error` (#C62828) for field errors, the wrong-credentials/failure banner border and its heading icon-free text; always accompanied by text (never colour alone). 5.62:1 on white, 5.15:1 on tint. Banner surface: white (`--color-bg`) with 2px `--color-error` left/all border and ink body text, so the error colour only carries a border and a short bold heading line (5.62:1 on white). If a banner sits on the tint band, put it inside the white `.card`.

Success/neutral status: ink text, 2px `--color-blue` border on a white card (the existing `.contact-success` look). No green is introduced.

New pairings to add to `tools/check-contrast.js` if not already covered: error on white (5.62), error on tint (5.15), ink on tint pill (15.31), blue link on white/tint (5.12/4.69). All already verified; none new.

---

## Component Contracts

### Login (`login.html`) — state `signin`
```
main#main.page-auth > section.section.section--tint > div.auth
  h1                      "Welcome back"
  p.lede                  "Sign in to see your plan and what’s coming next."
  div.card.card--white.auth__card
    div#auth-status.auth__status[role="status"][aria-live="polite"][hidden]   (banners, see States)
    form#login-form[novalidate][method="post"][action="#"]
      .field: label "Email address"   input[type=email][autocomplete=username email][required][aria-describedby]
      .field: label "Password"        input[type=password][autocomplete=current-password][required]
              button.field__toggle  "Show password" (aria-pressed; Label type, ink, 44px target, text only, no icon)
      button.btn.btn--primary[type=submit][disabled until JS ready]   "Sign in"
    div.auth__links
      a/button.link-cta  "Forgotten your password?"   (switches to the reset view)
  p.auth__note  "Clients only. If you’d like to work together, " + a[href=contact.html] "get in touch"
```
- Same field look as `contact.html`: tint field background, 2px `--color-field-border`, radius 8px, 44px, focus 2px blue + ring, `aria-invalid="true"` + error border.
- Submit disabled until the session SDK is ready and the page is on a supported origin (mirrors the Contact form pattern). While submitting: button gets `aria-busy="true"`, label becomes "Signing in…", inputs stay editable but the form ignores a second submit. No spinner graphic (no new accents); the text change is the indicator.
- Client-side validation (before any request), inline per field via `.field__error` with `aria-describedby` and `aria-live="polite"`, focus moves to the first invalid field, `aria-invalid` set. Empty email: "Please add your email address." Malformed email: "That email doesn’t look quite right. Check for a typo and try again." Empty password: "Please enter your password."
- Already signed in and visits `login.html`: after the session check, redirect to `dashboard.html` (use `location.replace`).
- Reduced motion: no animation on this page beyond the existing 0.01ms transition collapse. No entrance animation at all (keeps the page fast and avoids flash). Motion on these pages: only button/link colour transitions.

### Forgotten password request — state `reset-request` (same page, view swap)
Same card; `#login-form` is hidden and `#reset-form` shown (or, if the executor prefers, `login.html#reset` with the h1 and card swapped by JS; without the SDK both are inert anyway). Heading changes to the h1 below and focus moves to it (`tabindex="-1"`).
```
h1   "Let’s get you back in"
p    "Pop your email in and I’ll send a link to set a new password."
form#reset-form: label "Email address" + input[type=email]; button.btn.btn--primary "Send reset link"
a.link-cta "Back to sign in"
```
- After submit (success OR unknown email, identical): form is replaced by a status block (`role="status"`, focus moved to its heading):
  - Heading: "Check your inbox"
  - Body: "If that email belongs to a client, a reset link is on its way. It can take a few minutes, and it’s worth checking your spam folder."
  - Link: "Back to sign in". Secondary: a "Send it again" text button, disabled for 30 seconds after a send, label "Send it again in {n}s" counting down (a plain text update, throttled to announce only at start and end, not each second), then enabled.
- Never reveals whether the account exists. Service rate-limit response: "That’s a lot of tries in a short time. Please wait a few minutes and try again."

### Set password (`set-password.html`, from invite or reset link)
```
h1   invite: "Welcome, let’s set your password"      reset: "Choose a new password"
p    "Pick something you’ll remember. At least {N} characters." (N from the service minimum; plan sets it; default shown as 10)
form#password-form:
  .field label "New password"        input[type=password][autocomplete=new-password][required][minlength][aria-describedby=hint,error] + Show password toggle
  .field label "Type it again"       input[type=password][autocomplete=new-password][required]
  button.btn.btn--primary "Save password"
```
- Which heading to show is decided from the link type the SDK reports (invite vs recovery); if unknown, use the reset heading.
- Validation messages: too short "That’s a bit short. Please use at least {N} characters." Mismatch: "Those two don’t match yet. Please type the same password in both boxes." Service rejects (for example a known-breached or weak password): show the service reason in plain words in a field-level error under the first field, falling back to "That password can’t be used. Please try a different one."
- Success: replace form with status (focus to heading): "All set" / "Your password is saved and you’re signed in." and a primary button "Go to my dashboard" (`dashboard.html`). Auto-redirect is NOT used (keeps control with the user and avoids a surprise navigation).
- The password never appears in the URL, history, logs, console or on-screen text. No password strength meter (no new graphics).

### Dashboard (`dashboard.html`) — state `ready`
```
main#main.page-auth.page-dashboard
  section.section > div.container
    div.dash__head
      h1 "Hello, {first name}"                   (falls back to "Hello there" if no name on the row)
      p  "Here’s where things stand with your marketing."
      p.dash__sample (tag) "Sample content for this prototype"
      button.btn.btn--ghost "Sign out"           (top right from 640px, below the heading on phones)
  section.section.section--tint > div.container > div.dash__grid
    article.card.card--white  h2 "Your plan"      (spans 5 of 12 at 1024px+; full width below)
       dl: Plan name / What’s included (short list, 3 items) / Check-in (for example "Every second Friday")
    article.card.card--white  h2 "Next steps"     (spans 7 of 12 at 1024px+)
       ol.dash__steps (3 items, each: step title in Body 600 + one-sentence detail + due text in Label ink-soft)
```
- All values come from the client's row (placeholder strings). Insert with `textContent` only (never `innerHTML`) so row content cannot inject markup.
- **Sample-content marking (D-11):** a visible tag under the lede, `.dash__sample`, tint pill, Label 600, reading "Sample content for this prototype". The seeded rows use clearly fictional values: plan "Sample Starter Plan", steps like "Sample step: choose your favourite photos", business names from the existing fictional set (Rise & Crumb Bakery etc.), `.example` addresses. Footer's existing "Prototype — sample content" note also remains. Every placeholder string is listed in `REPLACE-ME.md`.
- Step list is an ordered list with no decorative numbered badges (no blue badges here, so the Phase 2 reserved list is not extended); numerals via native `ol` markers in ink.
- Sign out: ghost button (2px ink border). On click: `aria-busy`, label "Signing out…", then redirect to `login.html` with a status line "You’ve been signed out. See you soon." (shown in `#auth-status`, `role="status"`, via a one-shot `sessionStorage` flag so it does not persist in the URL). If sign-out request fails: still clear local session, redirect, and show the same message.
- Focus: on load, once ready, focus is NOT stolen (page load is a normal navigation); the h1 is the first heading in reading order.
- No charts, no tables, no avatars, no upload, no messaging (out of scope).
- Sample-content dashboard cards are static (no hover lift).

---

## States Catalogue (all screens)

Every state below renders inside the standard card/section for its page, announced with `role="status"` (polite) except errors that block, which use `role="alert"` once. Copy is first person where Sam speaks, plain, no codes, no blame, British spelling, typographic apostrophes (U+2019), no exclamation marks.

| State | Where | Visual | Copy (heading / body) | Action |
|-------|-------|--------|-----------------------|--------|
| **Checking session (loading)** | `dashboard.html`, `login.html`, `set-password.html` before result | See "No flash" rule below. Shows only a card with heading line and a one-line message, ink on white, no spinner graphic, no skeleton of protected data | "One moment" / "Checking you’re signed in…" | none |
| **Signed out redirect** | `dashboard.html` | Redirect via `location.replace("login.html")` as soon as the check returns no session; login shows an info status | Login status: "Please sign in to see your dashboard." | form focus on email |
| **Wrong credentials** | login | Banner in `#auth-status` above the form (white, 2px error border, error-coloured Body-600 heading); password field cleared, email kept, focus to the email field. Same message for unknown email, wrong password and unconfirmed state | "That didn’t work" / "That email and password don’t match. Check them and try again, or use “Forgotten your password?” below." | retry |
| **Too many attempts** | login | Same banner style | "Let’s slow down a moment" / "There have been a few tries in a row. Please wait a few minutes and try again." | wait |
| **Network or service failure** | any auth action, dashboard fetch | Banner with error border; form data preserved; button re-enabled. Not shown as wrong credentials | "I couldn’t reach the sign-in service" / "That’s on my side, not yours. Check your connection and try again in a moment. If it keeps happening, email {mailto}." | "Try again" (primary button, re-runs the last action) |
| **Expired or invalid link** | `set-password.html` (and login if the link lands there) | Card replaces the form. Error text on ink body; heading uses ink (the error border only) | "This link has expired" / "Links like this only work for a short time, and once. No harm done, I can send you a fresh one." | Primary "Send me a new link" (goes to the reset-request view) + text link "Back to sign in" |
| **Signed in but no dashboard row yet** | dashboard | Standard heading and a single white card; no empty plan/steps cards, no sample tag | h1 "Hello there" / h2 "Your dashboard isn’t ready yet" / "I’m still setting things up for you. Check back soon, or email me and I’ll get it moving." | "Email Sam" (`mailto:`, text link) + Sign out button remains |
| **Dashboard data fetch fails (signed in)** | dashboard | Same as network failure, inside the grid area; Sign out stays available | as "Network or service failure" | Try again |
| **Not on the hosted site (file://)** | all three auth pages | Detected before any SDK call (`location.protocol === "file:"` or unsupported origin). The form is replaced (or hidden) by a plain card; header/footer still work; no console noise | "Sign-in only works on the live site" / "You’ve opened this page straight from a file, so the sign-in service can’t reach it. Open the hosted site instead: {site URL}. The Home and Contact pages work fine from a file." | text link to hosted URL (the live site URL, as a normal inline link) |
| **No JavaScript** | all three auth pages | `<noscript>` card above or in place of the form, same style as `.contact__noscript`; JS-dependent form is `hidden` by default and shown by script (`.js` class), so the submit is never usable without script | "Sign-in needs JavaScript" / "Your browser has JavaScript turned off, and signing in can’t work without it. Please turn it on and reload, or email me at {email} and I’ll help." | mailto link |
| **Signed out confirmation** | login after sign out | Info status (blue border card) | "You’ve been signed out. See you soon." | none |
| **Password reset email sent** | login reset view | Status block | "Check your inbox" (see above) | Back to sign in |
| **Password saved** | set-password | Status block | "All set" / "Your password is saved and you’re signed in." | "Go to my dashboard" |
| **Sign-in success (transition)** | login | Button label "Signing in…" then redirect; no success page | n/a | n/a |
| **Browser blocks storage** | login | Treated as service failure with extra line | "Your browser is blocking what I need to keep you signed in. Try turning off private mode or allowing site data, then try again." | Try again |

### "No flash of protected UI" rule (binding for AUTH-04)
- `dashboard.html` ships with the protected content region (`.dash`) absent from the DOM or `hidden`, and ONLY the "Checking session" card visible. No client name, plan or step markup exists in the static HTML (D-07: the file holds no client data; the sample strings are only inserted after a verified session and a successful row read).
- Order: page paints "Checking…" card → script resolves session → (no session) `location.replace("login.html")` / (session) fetch row → render content → remove the card and `hidden`. If the check takes longer than about 8 seconds, swap the one-liner for the network-failure state.
- The same wrapper (`.auth-gate`) is used on `login.html` so a signed-in visitor never sees a flashing form before redirect: form region `hidden` until the session check says "no session". Without JS (class `no-js` still on `<html>`), the `<noscript>` message shows and the gated region stays hidden.
- No `visibility` tricks that leave focusable controls in the tab order: hidden regions use the `hidden` attribute.
- The "Checking…" state respects reduced motion by having no animation at all.

---

## Interaction Contract

| Element | Behaviour |
|---------|-----------|
| Inputs | Tint background, 2px field border, 44px; focus = 2px blue border + ring; invalid = error border + error text below with `aria-describedby`; text stays visible when error shown |
| Show password toggle | Text button "Show password" / "Hide password", `aria-pressed`, toggles `type` between password and text; resets to hidden after submit or view change; 44px target; sits below the input, right-aligned from 640px |
| Submit | Disabled until ready; `aria-busy` + label change while working; Enter submits; double-submit ignored |
| Banners | Appear above the form in `#auth-status`; wrong-credentials and failure use `role="alert"` (once per attempt), info/success use `role="status"`. Focus does not move for banners except where noted (reset sent, password saved, expired link: focus moves to the new heading with `tabindex="-1"`) |
| Errors | Field-level errors first focus the first invalid field; screen readers hear the message via `aria-live="polite"` and `aria-describedby` |
| Autofill | `autocomplete` attributes set as above so password managers work; no `autocomplete="off"`; no blocking of paste |
| Links | Existing blue underlined links, 44px |
| Back/forward | After sign-out, going Back must not show protected content: dashboard re-runs the session check on `pageshow` (including `persisted`) and renders the gate again if signed out |
| Session loss mid-use | If a later request returns unauthorised, redirect to login with "Your session has ended. Please sign in again." |
| Reduced motion | No motion is added by this phase; the global rule collapses transitions. Nothing here depends on animation, nothing auto-updates except the 30s resend countdown text |
| Keyboard | Logical tab order: skip link, header, form, secondary links, footer. Focus ring on every control |

### Accessibility baseline
Landmarks `header`, `nav[aria-label="Main"]`, `main#main`, `footer`. One `h1` per page. Labels on every input (visible, not placeholder-only; no placeholders carrying meaning). Error text associated by `aria-describedby`. Status via live regions. AA contrast for every pairing above. 44px targets. Works at 320px with no horizontal scroll (card width is the gutter width, buttons full width on phones). Page `lang="en"` kept. Banner colour never the only signal (heading text always names the problem).

### Indexing and privacy surface
`<meta name="robots" content="noindex, nofollow">` on `login.html`, `set-password.html`, `dashboard.html`. Links to `login.html` from Home/Contact use plain `href` (no `rel="nofollow"` needed; the page itself is noindex). `robots.txt`/sitemap, if added later, must not list these pages. No analytics or third-party scripts on these pages. The SDK is the only external dependency, vendored and pinned per D-10 (plan decides filename; a version comment sits at the top of the include).

---

## Copywriting Contract

Tone: Phase 1/2 voice (first person, warm, plain, sentence case, British spelling, typographic apostrophes, zero exclamation marks).

| Element | Copy |
|---------|------|
| Header nav label | Client login |
| Login title tag | Client login \| Sam Whitlock |
| Login h1 / lede | Welcome back / Sign in to see your plan and what’s coming next. |
| Primary CTA (login) | Sign in |
| Field labels | Email address / Password |
| Password toggle | Show password / Hide password |
| Secondary link | Forgotten your password? |
| Not-a-client note | Clients only. If you’d like to work together, get in touch (link to Contact) |
| Reset h1 / lede / CTA | Let’s get you back in / Pop your email in and I’ll send a link to set a new password. / Send reset link |
| Reset sent | Check your inbox / If that email belongs to a client, a reset link is on its way. It can take a few minutes, and it’s worth checking your spam folder. |
| Back link | Back to sign in |
| Set password h1 (invite / reset) | Welcome, let’s set your password / Choose a new password |
| Set password CTA | Save password |
| Password saved | All set / Your password is saved and you’re signed in. / Go to my dashboard |
| Dashboard h1 / lede | Hello, {first name} / Here’s where things stand with your marketing. |
| Sample tag | Sample content for this prototype |
| Dashboard card headings | Your plan / Next steps |
| Sign out | Sign out (busy: Signing out…) |
| Signed out message | You’ve been signed out. See you soon. |
| Empty state heading | Your dashboard isn’t ready yet |
| Empty state body | I’m still setting things up for you. Check back soon, or email me and I’ll get it moving. |
| Error state (wrong credentials) | That didn’t work / That email and password don’t match. Check them and try again, or use “Forgotten your password?” below. |
| Error state (service) | I couldn’t reach the sign-in service / That’s on my side, not yours. Check your connection and try again in a moment. If it keeps happening, email me. |
| Expired link | This link has expired / Links like this only work for a short time, and once. No harm done, I can send you a fresh one. / Send me a new link |
| file:// | Sign-in only works on the live site / You’ve opened this page straight from a file, so the sign-in service can’t reach it. Open the hosted site instead. The Home and Contact pages work fine from a file. |
| No JS | Sign-in needs JavaScript / Your browser has JavaScript turned off, and signing in can’t work without it. Please turn it on and reload, or email me and I’ll help. |
| Loading | One moment / Checking you’re signed in… |
| Destructive confirmation | None required. Sign out is reversible (sign back in) and is a single click with no confirm dialog. There are no delete or reset-data actions in this phase |

Fictional dashboard sample content (inserted by seed SQL, all marked sample): plan "Sample Starter Plan"; included: "Sample: monthly social posts", "Sample: Google profile tune-up", "Sample: one small local ad"; check-in "Sample: every second Friday"; steps "Sample step: pick your favourite shop photos" (due "Sample date: this week"), "Sample step: approve the first week of posts", "Sample step: chat about next month’s offer". Business names only from the existing fictional set; emails only `.example`. Real client data is out of scope until the human security check passes (D-11).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |
| Third-party registries | none | not applicable |

Third-party assets entering the project: the vendored, version-pinned browser build of the auth SDK (D-10), loaded only on the three auth pages. Only the publishable client key may appear in the repo; never the service-role key (D-07). No new fonts, icons or scripts.

---

## Decisions Applied / Assumptions

Locked upstream: D-01 clients log in, D-03 simple dashboard (welcome, plan, next steps, placeholders), D-05 invite-only so no sign-up UI, D-08 pages `login.html`, `dashboard.html`, plus a set-password page, D-09 header gets only a plain link and Home/Contact load no auth code, D-11 sample content clearly fictional.

Decided by the researcher (defaults, override welcome):
1. Header label "Client login", a plain third nav item, wrap to two rows below 640px instead of a hamburger.
2. Auth pages on one tint band with a white card; one tint section per page. No coral, squiggles, navy bands or animation.
3. Reset request is a view of `login.html`, not a separate page; set-password is its own page (`set-password.html`).
4. Same message for unknown email and wrong password; same reset-sent message whether or not the email exists.
5. Dashboard step list uses native ordered-list markers, so the blue-accent reserved list is not extended.
6. Sign out has no confirm dialog; it shows a one-shot "signed out" message on login.
7. Loading state is a text card with no spinner; protected markup is absent until a verified session and row read.
8. Password minimum shown in copy is a placeholder (10) to be set from the service's actual rule in planning.
9. No auto-redirect after saving a password; the user clicks "Go to my dashboard".

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** pending
