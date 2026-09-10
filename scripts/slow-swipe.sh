#!/usr/bin/env bash
# A swipe that takes long enough to screenshot while the finger is still down.
#
#   ./scripts/slow-swipe.sh [durationMs] [endX] [shotAtMs]
#
# If the pop is *seeked*, the mid-gesture capture shows the outgoing page
# partway across the screen and it stays there. A fixed-duration tween, or no
# owner at all, looks different: either nothing moves, or it runs to completion
# the moment the gesture starts.
set -u

D="$HOME/Library/Android/sdk/platform-tools/adb"
cd "$(dirname "$0")/.." || exit 1

DUR="${1:-4000}"
END_X="${2:-950}"
SHOT_AT_MS="${3:-2200}"

MODE="${4:-log}"
if [ "$MODE" = log ]; then
  $D logcat -c >/dev/null 2>&1
fi

# shellcheck disable=SC2022
adb shell input swipe 2 1200 "$END_X" 1200 "$DUR" >/dev/null 2>&1 &
SWIPE_PID=$!

sleep "$(awk "BEGIN{print $SHOT_AT_MS/1000}")"
$D exec-out screencap -p >/tmp/pb-mid.png
echo "mid-gesture capture: /tmp/pb-mid.png"

wait $SWIPE_PID
sleep 2
echo "=== state after release ==="
agent-device snapshot --platform android 2>/dev/null | grep -oE "attached: [0-9]+|depth [0-9]+" | head -5

if [ "$MODE" = log ]; then
  PID=$($D shell pidof com.predictiveback | tr -d '\r')
  echo "=== logs (pid=$PID) ==="
  $D logcat -d 2>&1 |
    grep -E " ${PID} " |
    grep -E "PredictiveBack|FragmentManager|WindowOnBackDispatcher|RNScreens|SpecialEffects" |
    grep -vE "computeExpectedState|moveto |performSave|onBackPressed\(\)" |
    tail -40
fi
