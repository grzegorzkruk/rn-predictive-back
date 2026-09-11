package com.predictiveback

import android.app.Application
import com.facebook.react.BaseReactPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by
      lazy(LazyThreadSafetyMode.NONE) {
        getDefaultReactHost(
            context = applicationContext,
            packageList =
                PackageList(this).packages.apply {
                  add(
                      object : BaseReactPackage() {
                        override fun getModule(
                            name: String,
                            reactContext: ReactApplicationContext,
                        ): NativeModule? =
                            if (name == DemoPredictiveBackHandlerModule.NAME) {
                              DemoPredictiveBackHandlerModule(reactContext)
                            } else {
                              null
                            }

                        override fun getReactModuleInfoProvider(): ReactModuleInfoProvider =
                            ReactModuleInfoProvider {
                              mapOf(
                                  DemoPredictiveBackHandlerModule.NAME to
                                      ReactModuleInfo(
                                          DemoPredictiveBackHandlerModule.NAME,
                                          DemoPredictiveBackHandlerModule::class.java.name,
                                          false,
                                          false,
                                          false,
                                          false,
                                      ),
                              )
                            }
                      },
                  )
                },
        )
      }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
