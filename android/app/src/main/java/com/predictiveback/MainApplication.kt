package com.predictiveback

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by
      lazy(LazyThreadSafetyMode.NONE) {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                  // Libraries that cannot be autolinked go here.
                },
        )
      }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
