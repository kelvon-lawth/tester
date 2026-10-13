---
phase: quick-261013-eil
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - contact.html
  - css/styles.css
  - js/main.js
  - REPLACE-ME.md
  - tools/check-contact.js
  - tools/contact-browser-test.js
autonomous: true
requirements: [CON-01, CON-04, CON-05, CON-06]

must_haves:
  truths:
    - "Contact page shows a warm first-person intro from Sam under the existing h1 Let’s talk"
    - "Visitor sees a labelled form with name (required), phone (required, tel), email (required, email) and an optional message"
    - "Submitting empty or invalid fields shows inline error text under each bad field, marks it aria-invalid, and moves focus to the first invalid field"
    - "A valid submit sends nothing and shows a friendly success message that says plainly this is a prototype and nothing was sent"
    - "Placeholder email (mailto:) and phone (tel:) appear beside the form on desktop and below/above it stacked on phone"
    - "All existing guards still pass (portability, contrast, design-system, font metrics, smoke, check-home, home-browser-test)"
  artifacts:
    - path: "contact.html"
      provides: "Intro, form with 4 fields, hidden success panel, direct contact details aside"
      contains: "novalidate"
    - path: "css/styles.css"
      provides: "Contact layout (.contact__grid etc.), textarea and success styles using tokens only"
      contains: ".contact__grid"
    - path: "js/main.js"
      provides: "Separate contact-form IIFE using Constraint Validation API"
      contains: "checkValidity"
    - path: "tools/check-contact.js"
      provides: "Static contract check for the contact page"
    - path: "tools/contact-browser-test.js"
      provides: "Headless Chrome behaviour test for validation and success"
    - path: "REPLACE-ME.md"
      provides: "Rows for contact intro, form labels/errors, success copy, contact details on contact.html"
  key_links:
    - from: "js/main.js"
      to: "form#contact-form in contact.html"
      via: "document.getElementById('contact-form'); early return when null"
      pattern: "getElementById\\(\"contact-form\"\\)"
    - from: "each input in contact.html"
      to: "its error element"
      via: "aria-describedby=\"{field}-error\""
      pattern: "aria-describedby=\"(name|phone|email)-error\""
    - from: "js/main.js submit handler"
      to: "#contact-success (pre-authored, hidden)"
      via: "remove hidden attribute, hide form, focus success heading"
      pattern: "contact-success"
---

<objective>
Build the real content of contact.html: friendly intro, an accessible front-end-only enquiry form (name, phone, email, optional message) validated with the native Constraint Validation API, an honest "prototype, nothing was sent" success state, and direct placeholder contact details in a two-column (desktop) / stacked (phone) layout.

Purpose: Gives the "Let’s talk" CTAs on Home a real destination and delivers the core of Phase 4 early.
Output: Updated contact.html, css/styles.css, js/main.js, REPLACE-ME.md, plus tools/check-contact.js and tools/contact-browser-test.js.

## Locked user decision (2026-10-13) — Phase 4 planning MUST pick this up

D-01: The contact form fields are exactly **name (required), phone (required), email (required), message (optional)**. This REPLACES the roadmap/REQUIREMENTS CON-01 spec (name, email, business name, message) and drops CON-02 (business type picker) and CON-03 (services checkboxes). Phase 4 planning must treat CON-01 as satisfied by this form, treat CON-02/CON-03 as superseded by this decision (not re-add those fields), and must not add business name/type/services fields.

Out of scope for this quick task: CON-07 (stylized area-served map graphic, stays in Phase 4), business type/services fields, any real submission (no fetch, no Formspree, no mailto form action).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@.planning/STATE.md
@.planning/phases/02-shared-shell-static-home/02-UI-SPEC.md
@contact.html
@css/styles.css
@js/main.js
@REPLACE-ME.md
@tools/check-home.js
@tools/home-browser-test.js

<interfaces>
Existing CSS already authored for this (css/styles.css, "Form fields (used in Phase 4)" block ~line 705):
- `.field__label` — block, Label size 14px, semibold, sm margin below
- `.field__input` — block, full width, min 44px tall, tint bg, 2px `--color-field-border`, `--radius-sm`, Body size. Focus = blue border + 3px blue outline. `[aria-invalid="true"]` = `--color-error` border.
- `.field__error` — Label size, `--color-error`, sm margin above
- `.btn.btn--primary` — pill, 44px min, blue fill, white label (works on a `<button>`; `.btn` sets border, font, cursor)
- `.card` — tint bg, `--radius-md`, `--space-lg` padding, `--shadow-card`
- `.label` — small uppercase-ish label style used in footer ("Get in touch")
- `.visually-hidden`, `.flow > * + *` spacing helper, `.section`, `.container`
- Breakpoints in use: 640px and 1024px (min-width). Tokens: `--space-*`, `--fs-body|label|heading`, `--fw-regular|semibold`, `--measure` (64ch), `--color-ink|ink-soft|bg|tint|error|line|navy`.

Guards that constrain this work (read before editing):
- tools/check-design-system.js: outside `:root`, CSS may not use hex, rgb()/hsl() or named colours; `font-size` must be `var(--fs-*)`; `font-weight` must be `var(--fw-*)`; no `font` shorthand; no inline `style=`; forbidden words in CSS: grain, noise, blob, feTurbulence, italic. `var(--color-blue)` may only appear in the allow-listed selectors (do NOT add new selectors that use `--color-blue`). Visible text in contact.html must use typographic apostrophes (’), never `'`, `&#39;` or `&apos;`, including in title/alt/aria-label/content attributes. SHELL:HEADER and SHELL:FOOTER blocks must stay byte-identical with index.html (do not touch them).
- tools/check-home.js shell group: contact.html `<main>` must START with exactly `<section class="section">` > `<div class="container">` > `<h1>Let’s talk</h1>` (regex at line 73). Keep that opening and append new content after the h1 inside the same container. contact.html must not contain `sticky-cta` or `[Name]`.
- tools/check-portability.js: no `fetch(`, no `import`, no `@import`; classic `<script defer>` only (already in head).
- UI-SPEC copy contract: first person, warm, plain-spoken, sentence case, British spelling, contractions fine, no jargon, no exclamation mark in headings, target zero exclamation marks on the page. Coral is never text and never a button.
- Placeholder values (reuse exactly, same as footer): `hello@samwhitlock.example` / `mailto:hello@samwhitlock.example`; `(555) 555-0142` / `tel:+15555550142`; area "Elmhollow, Fenwick Cross and Thornby".
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Contact markup, layout CSS, REPLACE-ME rows and static check</name>
  <files>contact.html, css/styles.css, REPLACE-ME.md, tools/check-contact.js</files>
  <action>
In contact.html, keep the head, SHELL blocks and the opening `<section class="section"><div class="container"><h1>Let’s talk</h1>` exactly as they are. After the h1, inside the same container, add:

1. Intro: `p.contact__intro` (max-inline-size `--measure`, `--color-ink-soft` is fine but ink is also fine) with 2 short first-person sentences as Sam, e.g. "Whether you run a bakery, a gym or the shop on the corner, I’d love to hear what you’re working on. Drop me a note below or give me a ring, and I’ll get back to you within a day or two." Use ’ for every apostrophe. No exclamation marks.

2. `div.contact__grid` containing two children:
   a. `div.contact__form-wrap` holding:
      - `form#contact-form.contact-form` with `novalidate`, `action="#"` and `aria-describedby="contact-form-note"`. Before the fields add `p#contact-form-note.contact-form__note` "Fields marked required are needed so I can get back to you." Each field is a `div.field` containing `label.field__label[for]`, the control with class `field__input`, and `p.field__error` with matching id, `aria-live="polite"`, initially empty. Fields (per D-01, exactly these four, in this order):
        - Name: `input#name name="name" type="text" autocomplete="name" required aria-describedby="name-error"`; label "Your name" plus a `span.field__req` " (required)".
        - Phone: `input#phone name="phone" type="tel" autocomplete="tel" inputmode="tel" required aria-describedby="phone-error"`; label "Phone number (required)". Add `pattern="[0-9+()\-. ]{7,}"` so obviously bad values (letters, too short) fail `patternMismatch`.
        - Email: `input#email name="email" type="email" autocomplete="email" required aria-describedby="email-error"`; label "Email address (required)".
        - Message: `textarea#message name="message" rows="5" class="field__input field__input--textarea"`, label "Message (optional)", NO required, NO error element, add a `p.field__hint#message-hint` "Tell me a bit about your business and what you’d like help with." and `aria-describedby="message-hint"`.
        - Submit: `button.btn.btn--primary type="submit"` labelled "Send message".
      - Pre-authored success panel (no innerHTML anywhere, per task constraint): `div#contact-success.contact-success.card` with `hidden`, `role="status"`, containing `h2#contact-success-title tabindex="-1"` "Thanks, that’s all looking good" and a `p` that says plainly: "This is a prototype, so nothing was actually sent. When the site goes live, this is where your message would reach me. For now, you can email or ring me using the details on this page." No exclamation mark.
   b. `aside.contact__details.card` with `aria-labelledby="contact-details-title"`: `h2#contact-details-title` "Rather talk directly?", a short line "I’m happy to chat by phone or email, whichever suits you.", then a list (`ul.contact__list`, no bullets) with: `.label` "Email" + `a[href="mailto:hello@samwhitlock.example"]` hello@samwhitlock.example; `.label` "Phone" + `a[href="tel:+15555550142"]` (555) 555-0142; `.label` "Based in" + text "Elmhollow, Fenwick Cross and Thornby". Do NOT add a map graphic (CON-07 is Phase 4).

Field-required wording: keep "(required)" inside each label so the requirement is visible and announced; do not rely on an asterisk alone.

In css/styles.css add a new commented block "Contact page" after the existing form-field block (tokens only, obey the guards listed in interfaces):
- `.contact__intro` max-inline-size `var(--measure)`, margin-block-start `var(--space-md)`.
- `.contact__grid` display grid, gap `var(--space-2xl)`, margin-block-start `var(--space-2xl)`, single column by default; at `@media (min-width: 1024px)` `grid-template-columns: minmax(0, 7fr) minmax(0, 5fr)` and `align-items: start`. (Stacked below 1024px means phone and narrow tablet; desktop gets two columns.)
- `.contact-form` display grid, gap `var(--space-lg)`, max-inline-size `var(--measure)`. `.contact-form__note`, `.field__hint` font-size `var(--fs-label)`, colour `var(--color-ink-soft)`. `.field__hint` margin `var(--space-xs) 0 var(--space-sm)` (hint sits between label and textarea or under it, executor's choice; keep consistent).
- `.field__error:empty { display: none; }` so empty error paragraphs take no space.
- `.field__input--textarea` min-block-size `calc(var(--space-3xl) * 2)`, `resize: vertical`, line-height `var(--lh-body)`.
- `.contact-form .btn` justify-self `start`.
- `.contact__details h2` and `.contact-success h2` font-size `var(--fs-heading)`; `.contact__list` list-style none, padding 0, margin `var(--space-lg) 0 0`, display grid gap `var(--space-md)`; links in the list get min-block-size 44px via `display: inline-flex; align-items: center` (44px tap target rule).
- `.contact-success` margin-block-start 0; `.contact-success p` margin-block-start `var(--space-sm)`; `.contact-success h2:focus` outline uses the existing focus ring (no new blue selector: rely on the global `:focus-visible` rule; if a programmatic-focus outline is wanted, use `outline: none` only with `:focus:not(:focus-visible)`).
- Make sure `[hidden]` wins over `.card` display: add `.contact-success[hidden] { display: none; }`.

In REPLACE-ME.md:
- In "Contact details", change the File column for Email and Phone rows to include the contact page aside (`contact.html` `.contact__details`) as a second location (keep the footer location).
- In "Copy blocks", add rows (Done `[ ]`) for: Contact intro (`.contact__intro`), Form field labels and hints (`#contact-form` labels, `#message-hint`, `#contact-form-note`), Form error messages (strings in `js/main.js` contact-form IIFE), Success message (`#contact-success`), Direct contact heading and line (`#contact-details-title` and following line). Quote the current placeholder text in each row.

Create tools/check-contact.js following the check-home.js style (zero deps, `"use strict"`, read helper, named groups, prints PASS/FAIL per group then `CONTACT OK`, exit 0/1, optional group args). Groups:
- `markup`: form#contact-form has `novalidate`; exactly the four controls name/phone/email/message exist and NO `business`, `select`, or `type="checkbox"` inside the form (D-01); name/phone/email have `required`, phone has `type="tel"` and `autocomplete="tel"`, email has `type="email"`; message has no `required`; every control has a `<label for>` matching its id; each of name/phone/email has `aria-describedby="{id}-error"` and a `p.field__error` with that id carrying `aria-live="polite"`; a submit button with `btn btn--primary`.
- `success`: `#contact-success` exists with `hidden` and `role="status"`, its text includes "prototype" and "nothing was actually sent".
- `details`: main contains `mailto:hello@samwhitlock.example` and `tel:+15555550142` outside the footer (check inside `<main>`), and the `.contact__grid` class.
- `js`: js/main.js contains `getElementById("contact-form")`, `checkValidity`, `preventDefault`, `aria-invalid`, `.focus(`, `contact-success`, and does NOT contain `innerHTML`, `insertAdjacentHTML`, `outerHTML`, `fetch(` or `import`. (This group is expected to FAIL until Task 2; Task 1 verify runs only the other groups.)
- `replace`: REPLACE-ME.md mentions `contact__intro`, `contact-success` and `contact__details`.
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/check-contact.js markup success details replace && node tools/check-design-system.js && node tools/check-home.js && node tools/check-portability.js && node tools/check-contrast.js</automated>
  </verify>
  <done>contact.html has intro, 4-field labelled form (D-01), hidden success panel, contact details aside; CSS uses tokens only and lays out two columns at 1024px+, stacked below; REPLACE-ME rows added; check-contact.js non-js groups pass and all existing static guards pass.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Contact form validation IIFE in main.js</name>
  <files>js/main.js</files>
  <behavior>
    - Empty submit: name, phone, email each get aria-invalid="true" and visible error text; focus lands on #name; nothing else happens (no success panel).
    - Name filled, phone "abc", email "not-an-email": only phone and email flagged; focus on #phone; phone error mentions a phone number, email error mentions an email address like name@example.com.
    - Fixing a field and leaving it (blur) or typing into a flagged field clears its error and aria-invalid once valid.
    - All three valid (message empty): preventDefault, form gets hidden, #contact-success loses hidden, focus moves to #contact-success-title. No network request.
    - On index.html (no form) the IIFE returns immediately with no errors.
  </behavior>
  <action>
Append a third, separate IIFE to js/main.js after the sticky-CTA IIFE, with a short header comment ("Contact form (contact.html): native Constraint Validation, no submission. Separate IIFE so it no-ops on pages without the form."). Classic script style matching the file: `"use strict"`, `var`, function expressions, no arrow-function requirement either way but stay consistent with existing code (ES5-style `function`), no innerHTML/insertAdjacentHTML/outerHTML, no fetch, no import.

Logic:
- `var form = document.getElementById("contact-form"); if (!form) { return; }` and look up `#contact-success` and `#contact-success-title`.
- Fields to validate: the controls with ids name, phone, email (query via `form.elements`). Message is optional and never flagged.
- `messageFor(input)`: return a friendly plain-English string from `input.validity`: `valueMissing` -> name: "Please tell me your name.", phone: "Please add a phone number so I can call you back.", email: "Please add your email address."; email `typeMismatch` -> "That email doesn’t look quite right. Try something like name@example.com."; phone `patternMismatch` (or tooShort) -> "That phone number doesn’t look quite right. Use digits, spaces or a + sign."; fallback "Please check this field." Write the curly apostrophe as the `’` escape in JS strings so file encoding can never mangle it. No exclamation marks. Before checking, trim whitespace-only values: if `input.value.trim() === ""` set `input.value = ""` so spaces-only counts as missing.
- `showError(input, msg)`: set `aria-invalid="true"` and the error element's `textContent` (error element = `document.getElementById(input.id + "-error")`). `clearError(input)`: `removeAttribute("aria-invalid")`, `textContent = ""`.
- On `submit`: `event.preventDefault()` always (prototype, nothing is sent). Loop fields; for each invalid one call showError, else clearError; remember the first invalid. If any invalid, `firstInvalid.focus()` and stop. If all valid: set `form.hidden = true`, `success.hidden = false`, then `successTitle.focus()`.
- Live re-validation: on `blur` of a field that already has `aria-invalid="true"`, and on `input` for flagged fields, re-check `checkValidity()` and clear the error when valid (update the message if still invalid on blur only, to avoid noisy announcements while typing).
- Use `input.checkValidity()` / `input.validity` (Constraint Validation API) and `form.noValidate` stays true from markup.

Then run `node tools/check-contact.js` (all groups including `js`) and the existing guards.
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/check-contact.js && node tools/check-portability.js && node tools/check-design-system.js && node tools/check-home.js</automated>
  </verify>
  <done>Third IIFE in js/main.js validates name/phone/email with the Constraint Validation API, shows inline accessible errors, focuses the first invalid field, shows the pre-authored success panel on valid submit with focus moved to its heading, and no-ops on index.html; check-contact.js passes all groups.</done>
</task>

<task type="auto">
  <name>Task 3: Headless browser behaviour test and full guard run</name>
  <files>tools/contact-browser-test.js</files>
  <action>
Create tools/contact-browser-test.js by reusing the Chrome DevTools Protocol harness from tools/home-browser-test.js (same Chrome path/env var, spawn with array args, temp user-data-dir, Node global WebSocket, Runtime.evaluate helper, viewport via Emulation.setDeviceMetricsOverride, cleanup). Target `contact.html` over file://. Groups (CLI args like the home test; no args = all): 
- `validate`: click submit on the empty form (dispatch via `form.requestSubmit()` or clicking the button), then assert name/phone/email have `aria-invalid="true"`, each `#{id}-error` has non-empty text, `document.activeElement.id === "name"`, and `#contact-success` is still hidden. Then fill name "Jo", phone "abc", email "bad", submit; assert only phone/email flagged and activeElement is `phone`.
- `success`: reload, fill name "Jo Baker", phone "(555) 555-0100", email "jo@example.com", leave message empty, submit; assert form.hidden is true, `#contact-success` not hidden, its text contains "nothing was actually sent", and activeElement id is `contact-success-title`. Also assert `location.href` is unchanged (no navigation).
- `layout`: at 1280px wide, `.contact__form-wrap` and `.contact__details` have different left offsets on the same row (two columns); at 375px wide, details top is below form-wrap bottom (stacked) and `document.documentElement.scrollWidth <= 375` (no horizontal scroll).
- `console`: no console errors / exceptions logged during load (Runtime.exceptionThrown / Log entries of level error), and the same check on index.html confirms the contact IIFE no-ops there.
Print PASS/FAIL per group and `CONTACT BROWSER OK` at the end; exit 1 on any failure. Header comment: "Dev-only (removed in Phase 5)", same as the home test.

Then run every guard to prove nothing regressed: check-portability, check-contrast, check-design-system, font-metrics-test, smoke-test, check-home, home-browser-test, check-contact, contact-browser-test. Fix any regressions in the Task 1/2 files (not by weakening guards).
  </action>
  <verify>
    <automated>cd /Users/melvin/Desktop/testing && node tools/contact-browser-test.js && node tools/check-contact.js && node tools/check-portability.js && node tools/check-contrast.js && node tools/check-design-system.js && node tools/font-metrics-test.js && node tools/smoke-test.js && node tools/check-home.js && node tools/home-browser-test.js</automated>
  </verify>
  <done>contact-browser-test.js passes all four groups in headless Chrome over file://, and every pre-existing guard still passes.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| visitor input -> DOM | Form values are read only for validity checks; never echoed into the page |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-q261013-01 | Tampering (XSS) | js/main.js contact IIFE | mitigate | No innerHTML/insertAdjacentHTML/outerHTML; error text set via textContent from fixed strings only; user input never written to the DOM; enforced by check-contact.js `js` group |
| T-q261013-02 | Information disclosure | form data | mitigate | preventDefault on every submit, no fetch/action endpoint, success copy states nothing was sent; enforced by check-portability (no fetch) and contact-browser-test (no navigation) |
| T-q261013-03 | Spoofing (misleading success) | success panel | mitigate | Success copy explicitly says "This is a prototype, so nothing was actually sent" (asserted in check-contact `success` group) |
</threat_model>

<verification>
- All guards in Task 3 verify pass.
- Manual spot check optional: double-click contact.html, submit empty, see errors and focus on Name; fill valid values, see success panel.
</verification>

<success_criteria>
- contact.html contains intro, the D-01 four-field form with visible labels, hidden success panel, and mailto/tel details aside; two columns at 1024px+, stacked below.
- Validation uses the Constraint Validation API with aria-invalid, aria-describedby, aria-live="polite" errors and focus to first invalid field.
- Valid submit shows the honest prototype success message; nothing is sent; no innerHTML/fetch/import.
- REPLACE-ME.md lists the new contact copy and the contact-page locations of email/phone.
- check-contact.js and contact-browser-test.js added; all pre-existing guards still green.
- SUMMARY records D-01 (fields = name, phone, email, optional message; supersedes CON-01 field list, CON-02, CON-03) so Phase 4 planning picks it up; CON-07 map remains for Phase 4.
</success_criteria>

<output>
Create `.planning/quick/261013-eil-contact-page-form-with-name-phone-email-/261013-eil-SUMMARY.md` when done
</output>
