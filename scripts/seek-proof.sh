#!/usr/bin/env bash
# Captures the root-mounted Stack v5 pop frame by frame, and separately proves
# the cancel path.
#
#   ./scripts/seek-proof.sh seek     slow swipe that commits; filmstrip of the pop
#   ./scripts/seek-proof.sh cancel   swipe partway then drag back; expect no pop
#
# The seek case is only meaningful because the swipe is slow (5s). If the pop were
# a fixed-duration tween, it would finish within ~350ms and every frame would look
# identical or already-populated. Seeking means the outgoing page's offset tracks
# the finger, so the frames must differ monotonically.
set -u

export PATH="$PATH:$HOME/Library/Android/sdk/platform-tools"
export ANDROID_SERIAL="${ANDROID_SERIAL:-emulator-5554}"
D="$HOME/Library/Android/sdk/platform-tools/adb"
cd "$(dirname "$0")/.." || exit 1

PKG=com.predictiveback
MODE="${1:-seek}"
OUT=/tmp/pb-frames
rm -rf "$OUT" && mkdir -p "$OUT"

$D shell am force-stop $PKG
$D shell am start -n $PKG/.MainActivity >/dev/null
sleep 6
PID=$($D shell pidof $PKG | tr -d '\r' | awk '{print $1}')

./scripts/tap.sh "Stack v5 (root)" 2200
./scripts/tap.sh "Push" 1600
./scripts/tap.sh "Push" 1600

depth() { agent-device snapshot --platform android 2>/dev/null | grep -oE "attached: [0-9]+" | head -1; }
echo "before: $(depth)"

$D logcat -c >/dev/null 2>&1

if [ "$MODE" = cancel ]; then
  # One gesture only. `input swipe` cannot double back -- a second invocation is a
  # *new* pointer stream, not a continuation, so the finger would never return and
  # the framework would still see a long forward drag. Instead: drag slowly to ~20%
  # of the width and release there. Below both the distance and velocity commit
  # thresholds, so the framework should call onBackCancelled.
  adb shell input swipe 2 1200 220 1200 4000 >/dev/null 2>&1 &
  SWIPE=$!
  sleep 2.2
  $D exec-out screencap -p >"$OUT/cancel-mid.png"
  wait $SWIPE
else
  adb shell input swipe 2 1200 950 1200 9000 >/dev/null 2>&1 &
  SWIPE=$!
  # screencap on the emulator costs ~0.3s, so budget ~0.9s per frame to stay
  # inside the 9s gesture instead of overshooting it.
  for i in $(seq -w 0 9); do
    $D exec-out screencap -p >"$OUT/f$i.png"
    sleep 0.6
  done
  # The swipe runs ~9s and the first frame is taken about 50ms in, by which point the
  # system has not necessarily started the gesture yet. Drop leading frames that are
  # byte-identical to the first, so the filmstrip starts at real movement instead of
  # showing the same still screen three times.
  prev=""
  for i in $(seq -w 0 9); do
    sum=$(shasum "$OUT/f$i.png" | awk '{print $1}')
    if [ -n "$prev" ] && [ "$sum" = "$prev" ]; then rm -f "$OUT/f$i.png"; fi
    prev="$sum"
  done
  wait $SWIPE
fi

sleep 2
echo "after : $(depth)"

$D logcat -d --pid="$PID" > /tmp/pb-probe.log 2>&1
echo "handleOnBackStarted    : $(grep -c 'handleOnBackStarted' /tmp/pb-probe.log)"
echo "handleOnBackProgressed : $(grep -c 'handleOnBackProgressed' /tmp/pb-probe.log)"
echo "handleOnBackPressed    : $(grep -c 'handleOnBackPressed' /tmp/pb-probe.log)"
echo "handleOnBackCancelled  : $(grep -c 'handleOnBackCancelled' /tmp/pb-probe.log)"

if [ "$MODE" = seek ]; then
  # The captures are f0..f9 and the dedupe above can leave gaps, so neither a numeric
  # pattern nor a fixed count is reliable here -- glob the survivors in name order.
  # -start_number is irrelevant for glob; tile needs the count up front.
  n=$(ls "$OUT"/f*.png 2>/dev/null | wc -l | tr -d ' ')
  cols=$(( (n + 1) / 2 ))
  [ "$cols" -gt 6 ] && cols=6
  ffmpeg -y -framerate 6 -pattern_type glob -i "$OUT/f*.png" \
    -vf "scale=270:-1,tile=${cols}x2" -frames:v 1 \
    "$OUT/filmstrip.png" >/dev/null 2>&1
  echo "frames kept: $n"
  echo "filmstrip: $OUT/filmstrip.png"
fi
