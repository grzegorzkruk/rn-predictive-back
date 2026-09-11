package com.predictiveback

import android.os.SystemClock
import android.util.Log
import com.facebook.react.PredictiveBackEvent
import com.facebook.react.PredictiveBackHandler
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

/**
 * Demo-only plugin on React Native's predictive-back callback.
 *
 * This is the *plugin* path, not the *yield* path:
 *   - yield: screens disables RN's callback so FragmentManager owns the swipe
 *   - plugin: this handler is registered *on* RN; RN consumes the gesture and
 *     forwards start / progress / cancel / commit here
 *
 * Registering this handler is enough for RN to consume the swipe
 * (`setInterceptEnabled` is not required). It will fight a root-mounted v5
 * stack the same way intercept does: FragmentManager never sees progress.
 *
 * JS drives register / unregister so the handler is not permanent. Progress
 * is throttled on the way to JS; the native callbacks themselves still run
 * every frame (see logcat tag [PBHandler]).
 */
@ReactModule(name = DemoPredictiveBackHandlerModule.NAME)
class DemoPredictiveBackHandlerModule(
    reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext),
    PredictiveBackHandler {
    @Volatile
    private var registered = false

    @Volatile
    private var consumeCommit = false

    private var progressCount = 0
    private var lastJsEmitAt = 0L

    override fun getName(): String = NAME

    @ReactMethod
    fun setRegistered(next: Boolean) {
        reactApplicationContext.runOnUiQueueThread {
            val activity = reactApplicationContext.currentActivity as? ReactActivity ?: return@runOnUiQueueThread
            if (next == registered) {
                return@runOnUiQueueThread
            }
            registered = next
            if (next) {
                progressCount = 0
                activity.addPredictiveBackHandler(this)
                Log.i(TAG, "addPredictiveBackHandler")
            } else {
                activity.removePredictiveBackHandler(this)
                Log.i(TAG, "removePredictiveBackHandler")
            }
            emit("registered", progress = 0f, swipeEdge = PredictiveBackEvent.EDGE_NONE, force = true)
        }
    }

    @ReactMethod
    fun setConsumeCommit(next: Boolean) {
        consumeCommit = next
        Log.i(TAG, "consumeCommit=$next")
        emit("consumeCommit", progress = 0f, swipeEdge = PredictiveBackEvent.EDGE_NONE, force = true)
    }

    override fun onPredictiveBackStarted(event: PredictiveBackEvent) {
        progressCount = 0
        lastJsEmitAt = 0L
        Log.i(TAG, "STARTED edge=${event.swipeEdge} progress=${event.progress}")
        emit("started", event.progress, event.swipeEdge, event.touchX, event.touchY, force = true)
    }

    override fun onPredictiveBackProgressed(event: PredictiveBackEvent) {
        progressCount += 1
        emit("progress", event.progress, event.swipeEdge, event.touchX, event.touchY, force = false)
    }

    override fun onPredictiveBackCancelled() {
        Log.i(TAG, "CANCELLED after $progressCount progress events")
        emit("cancelled", progress = 0f, swipeEdge = PredictiveBackEvent.EDGE_NONE, force = true)
    }

    override fun onPredictiveBackCommitted(): Boolean {
        Log.i(TAG, "COMMITTED consume=$consumeCommit after $progressCount progress events")
        emit("committed", progress = 1f, swipeEdge = PredictiveBackEvent.EDGE_NONE, force = true)
        return consumeCommit
    }

    private fun emit(
        type: String,
        progress: Float,
        swipeEdge: Int,
        touchX: Float = 0f,
        touchY: Float = 0f,
        force: Boolean,
    ) {
        if (!force) {
            val now = SystemClock.uptimeMillis()
            if (now - lastJsEmitAt < JS_PROGRESS_MIN_INTERVAL_MS) {
                return
            }
            lastJsEmitAt = now
        }
        val map = Arguments.createMap().apply {
            putString("type", type)
            putDouble("progress", progress.toDouble())
            putInt("swipeEdge", swipeEdge)
            putDouble("touchX", touchX.toDouble())
            putDouble("touchY", touchY.toDouble())
            putInt("progressCount", progressCount)
            putBoolean("registered", registered)
            putBoolean("consumeCommit", consumeCommit)
        }
        reactApplicationContext.emitDeviceEvent(EVENT, map)
    }

    override fun invalidate() {
        reactApplicationContext.runOnUiQueueThread {
            val activity = reactApplicationContext.currentActivity as? ReactActivity
            if (registered && activity != null) {
                activity.removePredictiveBackHandler(this)
            }
            registered = false
        }
        super.invalidate()
    }

    companion object {
        const val NAME = "DemoPredictiveBackHandler"
        const val EVENT = "DemoPredictiveBackHandler"
        private const val TAG = "PBHandler"
        private const val JS_PROGRESS_MIN_INTERVAL_MS = 50L
    }
}
