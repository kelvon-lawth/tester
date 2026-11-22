#!/bin/sh
# Fails unless the PRIMARY checkout is on the phase branch and main has not moved.
# Default branch is phase-07.1-dashboard. Phase 7's finished plans can still be
# re-checked with PHASE_BRANCH=phase-07-client-login, but their old base file
# (phase-07-main-base) is not reused.
# Usage: sh tools/assert-phase-branch.sh [--main-moved]
set -u
EXPECTED="${PHASE_BRANCH:-phase-07.1-dashboard}"
if [ "$EXPECTED" = "main" ]; then
  echo "FAIL: expected branch is main" >&2
  exit 1
fi
PRIMARY=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -n 1)
BRANCH=$(git -C "$PRIMARY" branch --show-current)
if [ "$BRANCH" != "$EXPECTED" ]; then
  echo "FAIL: primary checkout is on '$BRANCH', expected $EXPECTED" >&2
  exit 1
fi
if [ "${1:-}" = "--main-moved" ]; then
  echo "branch ok (main check skipped)"
  exit 0
fi
COMMON=$(git rev-parse --path-format=absolute --git-common-dir)
SAFE=$(printf '%s' "$EXPECTED" | tr '/' '-')
BASE_FILE="$COMMON/phase-main-base-$SAFE"
NOW=$(git rev-parse main)
if [ ! -f "$BASE_FILE" ]; then
  printf '%s\n' "$NOW" > "$BASE_FILE"
fi
BASE=$(cat "$BASE_FILE")
if [ "$NOW" != "$BASE" ]; then
  echo "FAIL: main moved from $BASE to $NOW" >&2
  exit 1
fi
echo "branch ok, main unmoved"
