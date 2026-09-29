package com.predictiveback

import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedCallback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.module.annotations.ReactModule

/**
 * Reports whether the activity library on the classpath has the predictive-back
 * methods FragmentManager overrides. Those methods do not exist on activity 1.7.
 */
@ReactModule(name = ActivityBackInfoModule.NAME)
class ActivityBackInfoModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    override fun getName(): String = NAME

    override fun getConstants(): Map<String, Any> =
        mapOf("hasProgressCallbacks" to hasProgressCallbacks())

    companion object {
        const val NAME = "ActivityBackInfo"

        fun hasProgressCallbacks(): Boolean =
            try {
                OnBackPressedCallback::class.java.getMethod(
                    "handleOnBackProgressed",
                    BackEventCompat::class.java,
                )
                true
            } catch (_: NoSuchMethodException) {
                false
            }
    }
}
