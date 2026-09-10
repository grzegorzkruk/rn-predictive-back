#!/usr/bin/env bash
# Checks that the incremental build survives an edit inside react-native-screens.
#
# Kotlin IC mis-resolves the symlinked library and poisons itself, which surfaces as dozens of
# "Cannot access ...: it is internal in file" errors in files nobody touched. This appends a
# comment to StackHostBackOwnership.kt and rebuilds; a regression means the build needs
# `:react-native-screens:clean` in between edits, i.e. the loop is back to being slow.
#
# The file is restored from a byte copy, never from git -- it carries uncommitted work.
set -u

cd "$(dirname "$0")/.." || exit 1

F=../react-native-screens/android/src/main/java/com/swmansion/rnscreens/stack/host/StackHostBackOwnership.kt
BACKUP=$(mktemp)
cp "$F" "$BACKUP"
restore() { [ -f "$BACKUP" ] && cp "$BACKUP" "$F" && rm -f "$BACKUP"; return 0; }
trap restore EXIT

printf '\n// touched by incremental-build-check\n' >>"$F"

out=$(cd android && ./gradlew :app:assembleDebug 2>&1)
if echo "$out" | grep -q "BUILD SUCCESSFUL"; then
  echo "PASS: incremental build after a library edit"
else
  echo "FAIL: rebuild needs a clean"
  echo "$out" | grep -E "^e: " | head -3
fi

restore
trap - EXIT
(cd android && ./gradlew :app:assembleDebug -q >/dev/null 2>&1)
echo "restored"
