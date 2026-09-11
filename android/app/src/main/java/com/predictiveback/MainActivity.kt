package com.predictiveback

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript.
   */
  override fun getMainComponentName(): String = "PredictiveBack"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    // Required by react-native-screens: fragments restored by the system after process
    // death cannot be reused (they hold no Fabric state), so they must self-remove.
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)

    // No back handling here, and that is the point: an app should not have to opt out of
    // React Native's back callback to get a seekable stack pop.
    //
    // The *plugin* path is the opposite and lives in DemoPredictiveBackHandlerModule: JS
    // registers a PredictiveBackHandler on this activity for as long as that demo screen
    // is focused. That is addPredictiveBackHandler, not a yield.
    //
    // It used to. Disabling it via getBackPressedCallback() was the app-level workaround, and
    // screens' FabricExample did the same thing by reflecting on ReactActivity's private
    // mBackPressedCallback field. Both are now unnecessary -- react-native-screens claims and
    // releases the gesture itself (StackHostBackOwnership), for exactly as long as its
    // root-mounted Stack.Host has something to pop, and puts the callback back afterwards.
    //
    // Measured, to rule out the cheaper alternatives:
    //   - Registration order does not decide this. FragmentManager registers on its first
    //     transaction, later than onCreate, and still loses. An enabled callback that does not
    //     implement the animation interface suppresses progress regardless of recency: 0
    //     onBackProgressed events while React Native's callback is enabled, 528 across a slow
    //     swipe once screens claims it.
    //   - Dropping React Native to PRIORITY_SYSTEM_NAVIGATION_OBSERVER instead of disabling it
    //     is not an option either -- per AOSP, observer-priority callbacks are kept outside the
    //     normal stack and only hear onBackInvoked when the system itself owns the gesture, so
    //     they never receive progress.
  }
}
