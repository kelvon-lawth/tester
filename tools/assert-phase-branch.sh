#!/bin/sh
# Fails unless the PRIMARY checkout is on phase-07-client-login and main has not moved.
# Usage: sh tools/assert-phase-branch.sh [--main-moved]
set -u
PRIMARY=$(git worktree list --porcelain | sed -n 's/^worktree //p' | head -n 1)
BRANCH=$(git -C "$PRIMARY" branch --show-current)
if [ "$BRANCH" != "phase-07-client-login" ]; then
  echo "FAIL: primary checkout is on '$BRANCH', expected phase-07-client-login" >&2
  exit 1
fi
if [ "${1:-}" = "--main-moved" ]; then
  echo "branch ok (main check skipped)"
  exit 0
fi
COMMON=$(git rev-parse --path-format=absolute --git-common-dir)
BASE_FILE="$COMMON/phase-07-main-base"
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
