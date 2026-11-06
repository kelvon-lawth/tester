# Phase 7: Client Login & Dashboard - Context

**Gathered:** 2026-11-06

## Decisions (user, 2026-11-06)

- **D-01 Who:** clients of the marketer log in.
- **D-02 Real login:** a real hosted auth service, not a demo. Passwords are handled by the service.
- **D-03 After login:** a simple dashboard: welcome, their plan, next steps, with placeholder content.

## Decisions (implementation defaults, open to change)

- **D-04 Service:** Supabase (Auth plus Postgres with Row Level Security), because the dashboard data needs protection as well as sign-in, and it needs no server of ours. Research must verify this against Clerk, including current free-plan limits, and flag anything that changes the choice.
- **D-05 Invite-only:** public sign-up off. The marketer invites clients and edits dashboard rows in the Supabase console. No custom admin panel.
- **D-06 Credentials:** email and password with a reset email. Research must check the service's default email limits and whether custom SMTP is needed.
- **D-07 Security model:** `dashboard.html` is a public static file, so it holds no client data and redirecting signed-out visitors is only a convenience. Protection comes from Row Level Security, tested with direct requests as a signed-out visitor and as a second client. Only the publishable client key may appear in the repo or site; the service-role key must never appear.
- **D-08 Pages:** add `login.html` and `dashboard.html`, plus any page needed to set a password from an invite or reset. Add them to the `tools/build-site.sh` allowlist and `tools/check-deploy.js`.
- **D-09 No effect on public pages:** Home and Contact load no auth code, so they keep the file:// and page-weight guarantees. Their shared header gets a plain link to login with no signed-in state.
- **D-10 No toolchain:** classic `<script defer>` with a vendored browser build of the SDK, pinned, matching the GSAP pattern. No ES modules or build step. Research must confirm such a build exists for the current SDK.
- **D-11 Placeholders:** the site remains a prototype. Sample dashboard content must be clearly fictional, and real client data is out of scope until the human security check passes.

## Human steps the plan must include

The user must create the Supabase project, turn off public sign-up, set the allowed redirect URLs to `https://tester-five-sage.vercel.app`, and supply the project URL and publishable key. Never ask for the service-role key or a password in chat. Schema SQL should be supplied for the user to run in the console.

## Things to update

`CLAUDE.md` still says "Exactly two pages" and "Static only"; `tools/` guards assert the current two-page shell. Plan changes to the guards. Raise the `CLAUDE.md` wording with the user rather than editing it silently. Our hosting stays static; the service is external.

## Related open work

Phase 6 is paused only on disabling GitHub Pages. This phase does not depend on that. While Pages lives, it serves a frozen older copy with no login.

## Out of scope

Self-service sign-up, social login, 2FA, billing, real reports or charts, file uploads, messaging, custom admin panel, custom domain.
