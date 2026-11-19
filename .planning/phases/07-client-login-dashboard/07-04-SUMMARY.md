---
phase: 07-client-login-dashboard
plan: 04
status: complete
key-files:
  - supabase/schema.sql
  - supabase/seed-test-clients.sql
  - supabase/email-templates.md
  - supabase/SETUP.md
  - js/auth-config.js
  - vercel.json
  - .planning/phases/07-client-login-dashboard/07-LIVE-EVIDENCE.md
---

# 07-04 Summary: Supabase project, real config and live security proof

The live test now ends with **RLS OK**, and that line was written by the test itself. The human security check in 07-09 still has to be done.

## What was done
- Task 1 (ce7cd0b): wrote the schema, seed SQL, email templates and the plain-language SETUP.md.
- Task 2: the user chose to have Claude configure the project through the Supabase Management API, using a personal access token they supplied, instead of following the console steps. Settings were read back after saving: sign-up off, password minimum 10, email confirmation on, site URL and redirect allow-list set to the Vercel site. The SQL checks passed: RLS is on, there is one SELECT-own policy for authenticated users, and authenticated has the SELECT grant only.
- Task 3 (c34a976): the real `js/auth-config.js` (publishable key) and the matching `connect-src` in vercel.json. `check-auth sql config secrets` passes.

## Deviations (each approved by the user)
- **Custom SMTP.** On a free project, Supabase won't change the email templates without custom SMTP, and probe P2 failed: the reset endpoint showed whether an account exists. The user picked Resend on samwhitlockmarketing.com.de. Claude added the four DNS records in Cloudflare through the user's own browser and Resend verified the domain. The user entered the SMTP password themselves.
- **Templates applied by API.** Invite and recovery emails now link to `set-password.html?token_hash=...&type=invite|recovery`.
- **Test account addresses.** Resend refuses `@example.com` recipients, so a reset for a known account returned 500 while an unknown one returned 200. The two live test accounts were moved to Resend test-recipient addresses. `.env.local` was updated, and `supabase/seed-test-clients.sql` still names the fictional example.com addresses. The test was not changed.

## Results
- R1 to R9 and S1: PASS (own row only, no cross-reads, signed-out and forged reads 401, writes 401/403, rows unchanged, sign-up 422).
- P1 (A4): PASS, invalid_credentials. P2 (A3): PASS, known and unknown addresses both 200. P3 (A8): PASS, otp_expired.
- A5: labels n/a, set by API. A6: an invite with sign-up off returned 200 and the email was accepted; the throwaway invited user was deleted.

## Outstanding
- 07-08: rerun the pre-push gate, then two user approvals (preview push, then merge to main).
- 07-09: real-inbox and human security check. Tick AUTH-05 there, from the latest RLS-RUN line.
- The user should delete the Supabase personal access token when the work is finished.
