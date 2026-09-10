#!/usr/bin/env bash
# Holds an edge-swipe mid-gesture so a screenshot can prove the animation is
# *seeked* (fraction follows the finger) rather than a fixed-duration tween.
#
#   ./scripts/edge-swipe.sh down [x]      start a swipe and hold it open
#   ./scripts/edge-swipe.sh move <x>      move the held finger
#   ./scripts/edge-swipe.sh up [x]        release
#   ./scripts/edge-swipe.sh swipe [dist]  one fast full swipe (commit test)
#
# `down` + `move` + screenshot is the interesting case: if the pop is seeked,
# the outgoing screen sits at a position proportional to x. If it is a tween,
# the gesture either completes instantly or nothing moves at all.
set -u

STATE=/tmp/pb-swipe.state
D="$HOME/Library/Android/sdk/platform-tools/adb"
Y=1200

cmd="${1:-down}"

edge() { $D shell input motionevent "$@" >/dev/null 2>&1; }

read_x() { [ -f "$STATE" ] && head -1 "$STATE" || echo 2; }
write_x() { echo "$1" >"$STATE"; }

case "$cmd" in
  down)
    x="${2:-2}"
    edge DOWN 2 "$Y"
    write_x 2
    sleep 0.3
    ;;
  move)
    x="${2:?need x}"
    from=$(read_x)
    steps=8
    for ((i = 1; i <= steps; i++)); do
      cur=$((from + (x - from) * i / steps))
      edge MOVE "$cur" "$Y"
      sleep 0.04
    done
    write_x "$x"
    ;;
  up)
    x="${2:-$(read_x)}"
    edge UP "$x" "$Y"
    rm -f "$STATE"
    ;;
  swipe)
    dist="${2:-900}"
    edge DOWN 2 "$Y"
    sleep 0.3
    for ((i = 1; i <= 20; i++)); do
      edge MOVE $((2 + dist * i / 20)) "$Y"
      sleep 0.03
    done
    edge UP "$dist" "$Y"
    rm -f "$STATE"
    ;;
  *)
    echo "unknown command: $cmd" >&2
    exit 2
    ;;
esac
