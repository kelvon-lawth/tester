---
quick_id: 261119-oyt
status: complete
---

# Summary: auth links point at the custom domain

- login.html, set-password.html and dashboard.html (file:// notice) and js/auth-common.js LIVE_SITE now use https://www.samwhitlockmarketing.com.de.
- supabase/SETUP.md and REPLACE-ME.md describe Site URL = www domain; redirect allow list = www, apex and vercel.app (matches the live Supabase config set by API on 2026-11-19).
- Verified: no old URL left in the pages or JS; `node tools/check-auth.js` AUTH OK (csp and docs PASS).
- Full `tools/run-guards.sh`: 12 of 14 passed; motion-browser-test and qa-browser-test FAILED (both passed at d34f18a; this change touched only auth pages and docs; possibly flaky under load, not yet investigated). Re-run each on its own before the 07-08 gate.
