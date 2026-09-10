#!/usr/bin/env bash
# Verifies react-native-screens' back-gesture ownership, with React Native's own
# back callback left at its default (enabled) in MainActivity.
#
#   1. depth 3 -> one swipe  : screens claims, FM seeks, pop commits (3 -> 2)
#   2. depth 2 -> one swipe  : still owned, pop again (2 -> 1)
#   3. depth 1 -> one swipe  : nothing left to pop, screens must release, so the
#                              system owns the swipe and the app exits
#
# Step 3 is the one that catches a leak: if the claim were never released, RN's
# callback would stay disabled with nothing to pop and the back gesture would do
# nothing at all.
set -u

export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
export ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"
D="$HOME/Library/Android/sdk/platform-tools/adb"
cd "$(dirname "$0")/.." || exit 1

PKG=com.predictiveback

$D shell am force-stop $PKG
$D shell am start -n $PKG/.MainActivity >/dev/null
sleep 6
PID=$($D shell pidof $PKG | tr -d '\r' | awk '{print $1}')
echo "pid=$PID"

./scripts/tap.sh "Stack v5 (root)" 2200 >/dev/null
./scripts/tap.sh "Push" 1600 >/dev/null
./scripts/tap.sh "Push" 1600 >/dev/null

depth() { agent-device snapshot --platform android 2>/dev/null | grep -oE "attached: [0-9]+" | head -1; }
focused() { $D shell dumpsys window | grep -oE "mCurrentFocus=Window\{[^ ]* u0 [^/]*" | sed 's/.*u0 //'; }

$D logcat -c >/dev/null 2>&1

for step in 1 2 3; do
  before=$(depth)
  $D shell input swipe 2 1200 950 1200 4000 >/dev/null 2>&1
  sleep 2
  prog=$($D logcat -d --pid="$PID" 2>&1 | grep -c "handleOnBackProgressed")
  echo "step $step: ${before:-none} -> $(depth || true) | progress=$prog | focus=$(focused)"
  $D logcat -c >/dev/null 2>&1
done

echo "== screens ownership log =="
$D logcat -d 2>&1 | grep -E "back gesture|back callback" | tail -6
