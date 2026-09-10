#!/usr/bin/env bash
# Runs an edge swipe and prints only the lines that tell us *who* handled it:
#   - "PredictiveBack:"      -> ReactActivity's own callbacks (RN consuming)
#   - FragmentManager ...    -> androidx trying / refusing the gesture
#   - WindowOnBackDispatcher -> which callback the window dispatched to
#   - RNScreens              -> screens' dismiss callbacks
set -u

D="$HOME/Library/Android/sdk/platform-tools/adb"
cd "$(dirname "$0")/.." || exit 1

PKG=com.predictiveback

MODE="${1:-swipe}"
$D logcat -c >/dev/null 2>&1

if [ "$MODE" = hold ]; then
  ./scripts/edge-swipe.sh down
  ./scripts/edge-swipe.sh move "${2:-380}"
  out=/tmp/pb-hold.png
  $D exec-out screencap -p >"$out"
  echo "hold screenshot: $out"
else
  ./scripts/edge-swipe.sh swipe "${2:-950}"
  sleep 2
fi

PID=$($D shell pidof $PKG | tr -d '\r')
echo "pid=$PID"

$D logcat -d 2>&1 |
  grep -E "(^| )${PID:-NONE} " |
  grep -E "PredictiveBack|FragmentManager|WindowOnBackDispatcher|RNScreens|SpecialEffects|OnBackPressed" |
  grep -vE "computeExpectedState|moveto |performSave" |
  tail -45
