#!/usr/bin/env bash
# Tap the first element whose snapshot label contains the given text.
# agent-device refs die after every action, so snapshot+press must happen
# back-to-back; this does exactly that.
#
#   ./scripts/tap.sh "Stack v5"
set -u

MATCH="${1:?need text to match}"
cd "$(dirname "$0")/.." || exit 1

for attempt in 1 2 3; do
  line=$(agent-device snapshot -i --platform android 2>/dev/null | grep -m1 "$MATCH")
  if [ -z "$line" ]; then
    echo "tap.sh: no node matching '$MATCH' (attempt $attempt)" >&2
    sleep 1
    continue
  fi
  ref=$(echo "$line" | grep -oE '@e[0-9]+' | head -1)
  if [ -z "$ref" ]; then
    echo "tap.sh: matched but no ref: $line" >&2
    exit 1
  fi
  if agent-device press "$ref" --platform android --settle "${2:-1800}" >/dev/null 2>&1; then
    echo "tapped $ref for '$MATCH'"
    exit 0
  fi
  echo "tap.sh: press $ref failed, retrying" >&2
done
echo "tap.sh: giving up on '$MATCH'" >&2
exit 1
