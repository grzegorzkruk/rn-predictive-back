# rn-predictive-back

Scratch Android app for developing React Native's predictive back gesture with
`react-native-screens` and `react-navigation`. Nothing is vendored: the
libraries below are symlinked from their local checkouts, so an edit in any of
them shows up on the next rebuild with no publish step.


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
