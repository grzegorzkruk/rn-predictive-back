package com.predictiveback

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "PredictiveBack"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  //
  // Predictive back switches to try from here.
  //
  // 1. RN owns the gesture (default). JS calls
  //    BackHandler.setInterceptEnabled(true) and RN delivers start / progress /
  //    cancel / commit. See the JS screens in src/.
  //
  // 2. Let Android / FragmentManager own the gesture, which is what
  //    react-native-screens Stack v5 needs for a system-seeked pop. Uncomment:
  //
  //    override fun onCreate(savedInstanceState: Bundle?) {
  //      getBackPressedCallback().isEnabled = false
  //      super.onCreate(savedInstanceState)
  //    }
  //
  //    Note: with the callback disabled, JS BackHandler can no longer prevent
  //    back. Only one owner per swipe.
  //
}
