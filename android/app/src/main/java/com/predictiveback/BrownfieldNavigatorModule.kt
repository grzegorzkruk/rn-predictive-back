package com.predictiveback

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

/** Opens the native host activity from the React Native screen. */
@ReactModule(name = BrownfieldNavigatorModule.NAME)
class BrownfieldNavigatorModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = NAME

  @ReactMethod
  fun openNativeHost() {
    val activity = reactApplicationContext.currentActivity ?: return
    activity.runOnUiThread {
      activity.startActivity(Intent(activity, NativeHostActivity::class.java))
    }
  }

  companion object {
    const val NAME = "BrownfieldNavigator"
  }
}
