# Vendored supabase-js

- Package: `@supabase/supabase-js@2.119.0` from the npm registry (https://www.npmjs.com/package/@supabase/supabase-js), MIT licence
- File: `package/dist/umd/supabase.js`, copied byte for byte to `assets/js/vendor/supabase.min.js` (unmodified UMD build, renamed so the `*.min.js` glob in `tools/build-site.sh` ships it)
- sha256: `a867edbcfb029370aeec7223dd6180b560b621fbe3bc64c6584fb0369d1b7bce`
- npm tarball integrity: `sha512-MKP49G6bJbPhvsZDegZ/IXS/ITApPgplDCF5+F65KZ5kIArS5Y90WFxwvWYALx2bsxdrSuHvkCiXHYr3dU8+sw==`
- Vendored on: 2026-11-18, with `npm pack @supabase/supabase-js@2.119.0 --ignore-scripts` in a scratch folder (nothing installed in the repo)
- Human confirmation: the user typed "package ok" on 2026-11-18 after seeing the npm data (version 2.119.0, MIT, repo github.com/supabase/supabase-js, maintainers @supabase.io).
- Licence notice: `SUPABASE-LICENSE.txt`, copied to `_site/assets/js/vendor/` by the build.

Loaded as a classic `<script defer>` on the auth pages only (login, set-password, dashboard). Home and Contact never load it.

## Re-vendoring

Repeat the `npm pack` step for the new version, copy `dist/umd/supabase.js` over `supabase.min.js`, and compute the new sha256. Upgrading means deliberately updating the pinned hash in `tools/check-auth.js` and `tools/check-portability.js`, this file, and the version comment in the auth pages.
