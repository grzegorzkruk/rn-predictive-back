#!/usr/bin/env bash
# Points the installed app at this project's Metro, without touching any other
# Metro that may already own port 8081 on the host (e.g. RNTester's).
#
#   METRO_PORT=8082 ./scripts/device-setup.sh
#
set -euo pipefail

METRO_PORT="${METRO_PORT:-8082}"
APP_ID="com.predictiveback"
SERIAL="${ANDROID_SERIAL:-}"
ADB="${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools/adb"
[[ -n "$SERIAL" ]] && ADB+=(-s "$SERIAL")

PREFS_DIR="/data/data/${APP_ID}/shared_prefs"

"${ADB[@]}" shell am force-stop "$APP_ID"

# The file must be <package>_preferences.xml and the root element must be <map>,
# otherwise the legacy PreferenceManager silently ignores it.
"${ADB[@]}" shell "run-as ${APP_ID} sh -c 'mkdir -p ${PREFS_DIR}; printf \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\" standalone=\\\"yes\\\" ?>\n<map>\n<string name=\\\"debug_http_host\\\">localhost:8081</string>\n</map>\n\" > ${PREFS_DIR}/${APP_ID}_preferences.xml'"

# The app always asks for localhost:8081; forward it to this project's Metro.
"${ADB[@]}" reverse tcp:8081 "tcp:${METRO_PORT}"

echo "device localhost:8081 -> host ${METRO_PORT}"
"${ADB[@]}" shell am start -n "${APP_ID}/.MainActivity" >/dev/null
echo "launched ${APP_ID}"
