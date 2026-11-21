---
phase: 07-client-login-dashboard
plan: 08
status: complete
key-files:
  - .planning/phases/07-client-login-dashboard/07-LIVE-EVIDENCE.md
---

# 07-08 Summary: preview, then live

Phase 7 is live at https://www.samwhitlockmarketing.com.de and https://tester-five-sage.vercel.app. MAIN_SHA is f7d593d4473f98a4e06afb28119ebff43d7de4de.

- Pre-push gate re-run at 5dd575c: all five gates passed. Two earlier runs timed out in the browser guards because macOS throttled headless Chrome while the display was off. `caffeinate -dimsu` fixed it, with no code or assertion change.
- Task 1/2: the user typed "push branch". The branch was pushed once; production was unchanged (stamp ea4e626 on both hosts).
- Task 3/4: the preview is behind a Vercel login, so the automated check gave NOT RUN (expected). Claude checked it in the user's Chrome and the user replied "preview ok". The only console error was the CSP blocking Vercel's preview-only feedback toolbar, which is expected; the CSP was not widened. Fresh tip run: 14/14 guards, RLS OK, live sign-in OK. PRE_MERGE_SHA 911b34d.
- Task 5/6: the user typed "push main 911b34d". main was fast-forwarded and pushed once. deployed, csp and live sign-in passed on both hosts, and RLS OK.

Deviation: the plan names only the vercel.app host. Every check was also run on the custom domain added on 2026-11-19.

Next: 07-09, the human checkpoint (real inbox, guide walkthrough, security sign-off). AUTH requirements get ticked there.
