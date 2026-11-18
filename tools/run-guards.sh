#!/bin/sh
# Runs every offline guard, one at a time, to the end, and prints a summary.
# Agents: start this with run_in_background, a full run can pass the Bash tool's time limit.
# Guards run one at a time because check-deploy and the browser test both rebuild and delete _site/.
# It does not run live tests or tools/auth-rls-test.js. Those report separately, so a missing
# credential can never look like an offline failure, or the other way around.
cd "$(dirname "$0")/.." || exit 1

GUARDS="smoke-test check-portability check-design-system check-contrast font-metrics-test check-home home-browser-test motion-browser-test check-contact contact-browser-test qa-browser-test check-deploy check-auth auth-browser-test"

total=0
failed=0
failed_names=""
for g in $GUARDS; do
  total=$((total + 1))
  echo "=== $g ==="
  node "tools/$g.js"
  code=$?
  if [ "$code" -eq 0 ]; then
    echo "GUARD $g: PASS"
  else
    echo "GUARD $g: FAIL (exit $code)"
    failed=$((failed + 1))
    failed_names="$failed_names $g"
  fi
done

echo "---"
echo "$((total - failed)) of $total guards passed"
if [ "$failed" -eq 0 ]; then
  echo "ALL GUARDS PASS"
  exit 0
fi
echo "Failed:$failed_names"
exit 1
