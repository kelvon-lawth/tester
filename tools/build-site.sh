#!/bin/sh
# Builds _site/ with only the public files (allowlist, not exclusion).
# Used by Vercel (vercel.json buildCommand) and by .github/workflows/pages.yml.
# Works from any directory on Linux and macOS (plain sed to a temp file, portable).
set -eu

cd "$(dirname "$0")/.."

rm -rf _site
mkdir -p _site/css _site/js _site/assets/fonts _site/assets/js/vendor _site/assets/img

cp index.html contact.html _site/
cp css/styles.css _site/css/
cp js/main.js _site/js/
cp assets/fonts/*.woff2 _site/assets/fonts/
cp assets/fonts/OFL-*.txt _site/assets/fonts/
cp assets/js/vendor/*.min.js _site/assets/js/vendor/
cp -R assets/img/. _site/assets/img/

# Strip the dev footer link from the deployed copies only (local files keep it).
for page in index.html contact.html; do
  sed '/href="styleguide.html"/d' "_site/$page" > "_site/$page.tmp"
  mv "_site/$page.tmp" "_site/$page"
done

if grep -qi 'styleguide' _site/index.html _site/contact.html; then
  echo "Style guide reference still present in deployed pages" >&2
  exit 1
fi
if grep -q '\.sg-' _site/css/styles.css; then
  echo ".sg- rules still present in deployed CSS" >&2
  exit 1
fi
for page in index.html contact.html; do
  if ! grep -q 'Prototype — sample content' "_site/$page"; then
    echo "Prototype note missing from $page" >&2
    exit 1
  fi
done

# Build stamp: lets a push be proven live from outside, since some changes
# (such as removing pages.yml) alter no deployed file. Letters and digits only.
STAMP=$(printf '%s' "${VERCEL_GIT_COMMIT_SHA:-${GITHUB_SHA:-}}" | tr -cd 'A-Za-z0-9')
[ -n "$STAMP" ] || STAMP=local
printf '<!-- build %s -->\n' "$STAMP" >> _site/index.html
