/* Supabase project settings for the client login.

   These values are public by design: the project URL and the publishable key are shipped to
   every browser. Protection comes from row level security in the database, not from hiding
   these. The secret key must never appear in this repository.

   If the project changes, update the connect-src origin in vercel.json at the same time
   (`node tools/check-auth.js csp` fails if they drift). */
window.AUTH_CONFIG = {
  url: "https://jrnhvattwppdlpbqnvar.supabase.co",
  publishableKey: "sb_publishable_qkwSkLG5HPjASRjTgryxVQ_eX_b_1E6",
  PASSWORD_MIN: 10
};
