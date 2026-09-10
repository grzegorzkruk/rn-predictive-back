#!/usr/bin/env bash
# Clean predictive-back probe.
#
#   ./scripts/probe.sh [rootv5|nestedv5|plain]
#
# Brings the app up fresh, drives into the named screen, performs a slow
# left-edge swipe, screenshots while the finger is still down, then dumps the
# process's logs via `logcat --pid` (filtering logcat text by a PID string is
# unreliable, because the PID has to be resolved after the launch).
set -u

export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
export ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"
D="$HOME/Library/Android/sdk/platform-tools/adb"
cd "$(dirname "$0")/.." || exit 1

PKG=com.predictiveback
TARGET="${1:-rootv5}"

case "$TARGET" in
  rootv5) ENTRY="Stack v5 (root)"; PUSHES=2 ;;
  nestedv5) ENTRY="Stack v5 (nested)"; PUSHES=2 ;;
  plain) ENTRY="Plain stack screen"; PUSHES=2 ;;
  *) echo "unknown target: $TARGET" >&2; exit 2 ;;
esac

$D shell am force-stop $PKG
$D shell am start -n $PKG/.MainActivity >/dev/null
sleep 6

PID=$($D shell pidof $PKG | tr -d '\r' | awk '{print $1}')
echo "pid=$PID target=$TARGET"

./scripts/tap.sh "$ENTRY" 2200
for _ in $(seq 1 "$PUSHES"); do
  # StackV5 pushes with "Push"; the Plain screen's button reads "Push depth N".
  ./scripts/tap.sh "Push" 1800
done

echo "== before =="
agent-device snapshot --platform android 2>/dev/null |
  grep -oE "attached: [0-9]+|Depth [0-9]+" | head -2

$D logcat -c >/dev/null 2>&1

$D shell input swipe 2 1200 950 1200 5000 >/dev/null 2>&1 &
SWIPE=$!
sleep 3
$D exec-out screencap -p >/tmp/pb-mid.png
echo "mid capture: /tmp/pb-mid.png"
wait $SWIPE
sleep 2

echo "== after =="
agent-device snapshot --platform android 2>/dev/null |
  grep -oE "attached: [0-9]+|Depth [0-9]+|Predictive back" | head -3

$D logcat -d --pid="$PID" > /tmp/pb-probe.log 2>&1

echo "== the decisive counters =="
echo "  FM back callback ENABLED : $(grep -c 'enabled state is true' /tmp/pb-probe.log)"
echo "  FM back callback disabled: $(grep -c 'enabled state is false' /tmp/pb-probe.log)"
echo "  RN consumed the gesture  : $(grep -c 'PredictiveBack: in-app' /tmp/pb-probe.log)"
echo "  system owned the swipe   : $(grep -c 'system back committed' /tmp/pb-probe.log)"
echo "  screens native dismiss   : $(grep -c 'onNativeDismiss\|NativeDismiss' /tmp/pb-probe.log)"
echo "  full log: /tmp/pb-probe.log"

echo "== back-related lines =="
grep -E "PredictiveBack|enabling OnBackPressedCallback|enabled state is true|handleOnBack|RNScreens|not attached to window" /tmp/pb-probe.log |
  tail -30
