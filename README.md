# rn-predictive-back

Scratch Android app for developing React Native's predictive back gesture with
`react-native-screens` and `react-navigation`. Nothing is vendored: the
libraries below are symlinked from their local checkouts, so an edit in any of
them shows up on the next rebuild with no publish step.

## Repo layout expected

```
CALLSTACK/
  rn-predictive-back/        <- this app
  react-native/              <- RN monorepo (branch with the predictive back work)
  react-native-screens/      <- screens monorepo
  react-navigation/          <- navigation monorepo
  react-native-reanimated/   <- Reanimated monorepo (for the Reanimated progress screen)
```

## How the linking works

`yarn install` installs **published** versions of everything (the exact versions
the checkouts are cut from), which is what lets the React Native CLI and Gradle
autolinking discover the libraries and their codegen configs. Then
`scripts/link.js` (a `postinstall` hook) **replaces the installed folders with
symlinks to the local checkouts**, so the actual build uses local source.
Reanimated and Worklets are `link:` dependencies pointing at the local monorepo
(those packages are unpublished `-main` versions):

| Package                                | Resolves to                                  |
| -------------------------------------- | -------------------------------------------- |
| `react-native`                         | `../react-native/packages/react-native`      |
| `react-native-screens`                 | `../react-native-screens`                    |
| `react-native-reanimated`              | `../react-native-reanimated/packages/react-native-reanimated` |
| `react-native-worklets`                | `../react-native-reanimated/packages/react-native-worklets` |
| `@react-navigation/native`, `native-stack`, `core`, `elements`, `routers` | `../react-navigation/packages/*` |
| `@react-native/codegen`, `metro-config`, `babel-preset`, `gradle-plugin`, … | `../react-native/packages/*` (these are unpublished `-main` versions) |

Native side: `android/settings.gradle` uses `includeBuild` + dependency
substitution, so `com.facebook.react:react-android` and `hermes-android` are
**compiled from `../react-native` source**, not consumed as AARs. Verified via
`./gradlew :app:dependencies`:

```
com.facebook.react:react-android -> project :react-native:packages:react-native:ReactAndroid
com.facebook.react:hermes-android -> project :react-native:packages:react-native:ReactAndroid:hermes-engine
```

JS side: `metro.config.js` adds the checkouts to `watchFolders` and maps
`@react-navigation/*` imports to their `src/` (the packages ship a
`@react-navigation/source` export condition; the RN example apps use the same
trick). Verified by inspecting the dev-bundle sourcemap — it contains files
from all three local repos.

## Commands

```sh
yarn install        # also runs scripts/link.js
yarn link           # re-run linking alone (e.g. after switching branches)
yarn start          # Metro
yarn android        # build + install (first run compiles RN + Hermes from source: ~10-20 min)
cd android && ./gradlew --stop   # if Gradle daemons go stale after RN edits
```

Incremental debug builds after the first one are fast (~35s), because
`ndk.abiFilters` is pinned to `arm64-v8a` in `android/app/build.gradle`.

Once installed, `ANDROID_SERIAL=emulator-5554 ./scripts/device-setup.sh` points the
app at this project's Metro and relaunches it (see "Running it against the emulator").

Rebuild loop after native changes:

- `react-native` Java/Kotlin/C++ changed -> `yarn android` (Gradle picks it up incrementally)
- `react-native-screens` Android changed -> `yarn android`
- JS in any of the three repos changed -> Metro reload only

## Screens in the app

- **Plain stack screen** — react-navigation native stack over screens; tests whether the
  system-seeked pop animates (needs RN's back callback disabled in `MainActivity.kt`,
  commented in).
- **Animated progress** — `PredictiveBackAnimatedView` + `Animated.event` (native driver),
  the single recommended JS path for progress.
- **Reanimated progress** — the same host view, consumed with Reanimated `useEvent`
  (UI-thread worklet, no JS per frame).
- **Intercept ownership** — `BackHandler.setInterceptEnabled(true/false)` toggle with an
  on-screen log of `hardwareBackPress` events.

## Device requirement

Predictive back animations need **Android 16 (API 36)** with gesture navigation on.
`enableOnBackInvokedCallback` is set in the manifest.

## Verified / not yet verified

Verified on the emulator with a debug build (JS served from Metro):

- the app boots, bundles and renders using RN main + local screens + local navigation
- `PredictiveBackAnimatedView` mounts and `BackHandler.setInterceptEnabled` is callable
  (the Animated progress screen renders with no JS exceptions)
- back navigation works, and JS can veto/pop (commit path reaches `hardwareBackPress`)

Not yet verified:

- **the gesture itself**. `adb shell input swipe`/`motionevent` did not register as a
  system back gesture on this emulator, so the actual edge-swipe animation, the
  cancel-on-release behaviour and the progress values driven by a real swipe still
  need a manual test with a finger (or `-no-window` with `emu input` touch events).
- **the FragmentManager-seeked pop** (Path A): requires uncommenting the callback
  disable in `MainActivity.kt`, and screens does not seek the pop from RN's callback
  yet — that is the open integration work, not a wiring problem in this app.
- the `@react-navigation/stack` link (JS stack navigator) is set up but unused; the
  app currently exercises native-stack only.

## Compatibility fixes for RN main (react-native at 1000.0.0 / 0.87-main)

Two third-party Android modules do not compile against RN main, because APIs they
used in 0.85/0.86 are gone. Both are **not** related to the predictive back work:

- `react-native-safe-area-context` <5.8.0 calls `UIManagerModule.uiImplementation`,
  removed on RN main. Fixed by depending on `5.8.0` in this app.
- `@react-navigation/native`'s `MaterialSymbolModule.kt` used the deprecated
  `currentActivity` property form of `ReactContextBaseJavaModule.getCurrentActivity()`,
  which is `protected fun` on RN main. Patched in
  `../react-navigation/packages/native/android/.../MaterialSymbolModule.kt` to use
  `reactApplicationContext.currentActivity ?: reactApplicationContext`, which is the
  replacement RN itself recommends. **This edit is in the react-navigation checkout**,
  so it is worth upstreaming there.

## Running it against the emulator

The app was verified on the `Medium_Phone` AVD (Android 17 / API 37, arm64).

If something else (e.g. RNTester's Metro) already owns port 8081 on the host, don't
kill it. Run this app's Metro on another port and point the app at it:

```sh
node ./node_modules/react-native/cli.js start --port 8082 --reset-cache
adb -s emulator-5554 reverse tcp:8081 tcp:8082     # device 8081 -> this Metro
```

`adb reverse` only forwards the device's *localhost*, and RN defaults an emulator to
`10.0.2.2`, which would reach the other Metro. Tell this app to use localhost by
writing its debug prefs (debuggable builds only):

```sh
adb -s emulator-5554 shell "run-as com.predictiveback sh -c 'printf \"<?xml version=\\\"1.0\\\" encoding=\\\"utf-8\\\" standalone=\\\"yes\\\" ?>\n<map>\n<string name=\\\"debug_http_host\\\">localhost:8081</string>\n</map>\n\" > /data/data/com.predictiveback/shared_prefs/com.predictiveback_preferences.xml'"
```

The root element must be `<map>` (not `<preferences>`) or SharedPreferences ignores
the file. `adb reverse` does not survive an emulator restart.

## Metro gotcha: stale watchman crawl

Because every linked package is a symlink pointing outside the app, Metro's file map
can go stale after an install or a branch switch, and you get
`Unable to resolve module react-native ... could not be found within the project`
even though the file exists. Fix:

```sh
watchman watch-del-all && yarn start --reset-cache
```

## Known environment fixes (already applied on this machine)

- The legacy `tools/bin/sdkmanager` in this Android SDK is broken on modern JDKs
  (`NoClassDefFoundError: javax/xml.bind`), so it cannot auto-install CMake 3.30.5
  for the Hermes build. CMake 3.30.5 was installed manually into
  `~/Library/Android/sdk/cmake/3.30.5/` from `dl.google.com`. If the Hermes task
  complains again, re-run that step or install `cmdline-tools` via Android Studio.
- Node: use nvm's Node 24 (the RN monorepo requires ^22.13 || ^24.3).
- If Gradle caches corrupt after pulling RN changes: `yarn gradle-stop`, delete
  `~/.gradle/caches/<ver>/transforms` and `react-native/packages/react-native/ReactAndroid/.cxx`.
