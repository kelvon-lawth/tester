---
quick_id: 261119-oyt
slug: point-auth-links-custom-domain
date: 2026-11-19
---

# Point auth fallback links and setup docs at the custom domain

The site is now served at https://www.samwhitlockmarketing.com.de (apex 308 -> www; vercel.app still works). Supabase site_url and allow list were already updated by API.

## Task 1
- login.html, set-password.html, dashboard.html: file:// notice link and text -> www.samwhitlockmarketing.com.de
- js/auth-common.js: LIVE_SITE -> https://www.samwhitlockmarketing.com.de/login.html
- supabase/SETUP.md and REPLACE-ME.md: Site URL / redirect URLs describe the custom domain
- Verify: no tester-five-sage left in these files; node tools/check-auth.js passes; tools/run-guards.sh passes.
