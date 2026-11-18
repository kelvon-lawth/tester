/* PLACEHOLDER STAND-IN. These are NOT real values. They must be replaced with the real
   project URL and publishable key in plan 07-04 Task 3 before anything is pushed.
   `node tools/check-auth.js config` fails on purpose while this stand-in is in place.

   Once real, these values are public by design: the project URL and the publishable key are
   shipped to every browser. Protection comes from row level security in the database, not from
   hiding these. The secret key must never appear in this repository. */
window.AUTH_CONFIG = {
  url: "https://standin.supabase.co",
  publishableKey: "sb_publishable_standin",
  PASSWORD_MIN: 10
};
