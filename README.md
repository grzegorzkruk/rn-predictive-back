# rn-predictive-back

Scratch Android app for developing React Native's predictive back gesture with
`react-native-screens` and `react-navigation`. Nothing is vendored: the
libraries below are symlinked from their local checkouts, so an edit in any of
them shows up on the next rebuild with no publish step.


The launcher is a native activity. Open React Native from there, then
**Brownfield: native host** pushes a third activity that embeds a
`ReactFragment`. Back walks that stack in reverse.

## Setup

The build runs against local checkouts (react-native, react-native-screens,
react-navigation) that must already be set up per their own instructions. The
react-native checkout is picked by `RN_REPO` and defaults to `../react-native`;
for the predictive-back PR worktree, export it in both shells:

```sh
export RN_REPO=~/react-native-pr59292   # react-native#59292, branch predictive-back-swipe-merge
yarn install                            # links the checkout into node_modules
yarn start                              # terminal 1
yarn android                            # terminal 2
```

`yarn install` reads `RN_REPO` (scripts/link.js) and so does `yarn start`
(metro.config.js) — missing it in either one silently builds or bundles from the
fallback checkout, which is a different branch. The Gradle build follows the
node_modules symlink, so it needs no `RN_REPO`.

## Screens in the app

- **Brownfield: native host** — native activity with an embedded
  `ReactFragment`. The fragment is not a `ReactActivity`, so it cannot claim
  the gesture. The host switch does. Off: the system pops back to the React
  Native screen. On: the host receives progress and forwards the commit as
  `hardwareBackPress`.

- **Plain stack screen** — react-navigation native stack over screens; tests whether the
  system-seeked pop animates.
- **Animated progress** — `PredictiveBackProgressView` from
  [rn-predictive-back-progress](../rn-predictive-back-progress) + `Animated.event` (native driver),
  the single recommended JS path for progress.
- **Reanimated progress** — the same host view, consumed with Reanimated `useEvent`
  (UI-thread worklet, no JS per frame).
- **Intercept ownership** — a `hardwareBackPress` listener whose `intercept` option is
  toggled on and off, with an on-screen log of `hardwareBackPress` events.
- **FragmentManager callbacks** — same root `Stack.Host`, with React Native's
  callback left disabled. Activity 1.8 is pinned so FragmentManager can override
  `handleOnBackStarted` / `Progressed` / `Cancelled` and seek the Slide. The
  screen reports whether those methods are actually on the classpath.
- **Stack v5 (root)** — `Stack.Host` mounted at the root of the React tree, so its
  fragments reach the activity's FragmentManager and its `androidx.transition` pop
  can be seeked by FragmentManager.

## Known limitation being proposed for fixing

A listener with `intercept: true` does not reserve the gesture. React Native registers at
the platform default priority, the same priority FragmentManager uses, so whichever
enabled callback registered last wins. FragmentManager registers lazily on each push
transaction, so after a second push it takes the swipe back and a JS-driven view stops
following the finger. The pulse in `RootV5Screen`, turning its listener's `intercept` off
and on again after every push, changes nothing: core only enable/disable-s its callback,
it never re-registers it. The JS-driven card follows the finger because the
`PredictiveBackProgressView` in it re-adds the package's callback when it turns active.

## Device requirement

Predictive back animations need **Android 16 (API 36)** with gesture navigation on.
`enableOnBackInvokedCallback` is set in the manifest.

The `intercept` option only works with React Native's `enablePredictiveBackAndroid`
feature flag on. `MainApplication.kt` turns it on after `loadReactNative`.
