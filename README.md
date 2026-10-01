# rn-predictive-back

Scratch Android app for developing React Native's predictive back gesture with
`react-native-screens` and `react-navigation`. Nothing is vendored: the
libraries below are symlinked from their local checkouts, so an edit in any of
them shows up on the next rebuild with no publish step.


The launcher is a native activity. Open React Native from there, then
**Brownfield: native host** pushes a third activity that embeds a
`ReactFragment`. Back walks that stack in reverse.

## Screens in the app

- **Brownfield: native host** — native activity with an embedded
  `ReactFragment`. The fragment is not a `ReactActivity`, so it cannot claim
  the gesture. The host switch does. Off: the system pops back to the React
  Native screen. On: the host receives progress and forwards the commit as
  `hardwareBackPress`.

- **Plain stack screen** — react-navigation native stack over screens; tests whether the
  system-seeked pop animates (needs RN's back callback disabled in `MainActivity.kt`,
  commented in).
- **Animated progress** — `PredictiveBackAnimatedView` + `Animated.event` (native driver),
  the single recommended JS path for progress.
- **Reanimated progress** — the same host view, consumed with Reanimated `useEvent`
  (UI-thread worklet, no JS per frame).
- **Intercept ownership** — `BackHandler.setInterceptEnabled(true/false)` toggle with an
  on-screen log of `hardwareBackPress` events.
- **FragmentManager callbacks** — same root `Stack.Host`, with React Native's
  callback left disabled. Activity 1.8 is pinned so FragmentManager can override
  `handleOnBackStarted` / `Progressed` / `Cancelled` and seek the Slide. The
  screen reports whether those methods are actually on the classpath.
- **Stack v5 (root)** — `Stack.Host` mounted at the root of the React tree, so its
  fragments reach the activity's FragmentManager and its `androidx.transition` pop
  can be seeked by FragmentManager.

## Known limitation being proposed for fixing

`setInterceptEnabled(true)` does not reserve the gesture. React Native registers at
the platform default priority, the same priority FragmentManager uses, so whichever
enabled callback registered last wins. FragmentManager registers lazily on each push
transaction, so after a second push it takes the swipe back and a JS-driven view stops
following the finger. `RootV5Screen` works around this by dropping and re-adding the
callback after every push — that pulse is the workaround under discussion, not the
intended design.

## Device requirement

Predictive back animations need **Android 16 (API 36)** with gesture navigation on.
`enableOnBackInvokedCallback` is set in the manifest.
