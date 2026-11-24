package com.predictiveback

import android.os.SystemClock
import android.util.Log
import androidx.activity.ComponentActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import io.github.martinglova.predictivebackprogress.PredictiveBackHandler
import io.github.martinglova.predictivebackprogress.PredictiveBackProgress
import io.github.martinglova.predictivebackprogress.PredictiveBackState

/**
 * Demo-only native handler on the rn-predictive-back-progress package.
 *
 * This is the *handler* path, not the *yield* path:
 *   - yield: screens disables RN's callback so FragmentManager owns the swipe
 *   - handler: this module registers with the package, which then owns the
 *     gesture and forwards start / progress / cancel / commit here
 *
 * React Native core is not involved until the commit: if this handler does not
 * keep it, the package passes back on, and RN's callback receives it while a
 * listener has `intercept: true`. It will fight a root-mounted v5 stack the
 * same way intercept does: FragmentManager never sees progress.
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
            val activity = reactApplicationContext.currentActivity as? ComponentActivity ?: return@runOnUiQueueThread
            if (next == registered) {
                return@runOnUiQueueThread
            }
            registered = next
            if (next) {
                progressCount = 0
                PredictiveBackProgress.addHandler(activity, this)
                Log.i(TAG, "addHandler")
            } else {
                PredictiveBackProgress.removeHandler(activity, this)
                Log.i(TAG, "removeHandler")
            }
            emit("registered", progress = 0f, swipeEdge = PredictiveBackState.EDGE_NONE, force = true)
        }
    }

    @ReactMethod
    fun setConsumeCommit(next: Boolean) {
        consumeCommit = next
        Log.i(TAG, "consumeCommit=$next")
        emit("consumeCommit", progress = 0f, swipeEdge = PredictiveBackState.EDGE_NONE, force = true)
    }

    override fun onPredictiveBackStarted(state: PredictiveBackState) {
        progressCount = 0
        lastJsEmitAt = 0L
        Log.i(TAG, "STARTED edge=${state.swipeEdge} progress=${state.progress}")
        emit("started", state.progress, state.swipeEdge, state.touchX, state.touchY, force = true)
    }

    override fun onPredictiveBackProgressed(state: PredictiveBackState) {
        progressCount += 1
        emit("progress", state.progress, state.swipeEdge, state.touchX, state.touchY, force = false)
    }

    override fun onPredictiveBackCancelled() {
        Log.i(TAG, "CANCELLED after $progressCount progress events")
        emit("cancelled", progress = 0f, swipeEdge = PredictiveBackState.EDGE_NONE, force = true)
    }

    override fun onPredictiveBackCommitted(): Boolean {
        Log.i(TAG, "COMMITTED consume=$consumeCommit after $progressCount progress events")
        emit("committed", progress = 1f, swipeEdge = PredictiveBackState.EDGE_NONE, force = true)
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
            val activity = reactApplicationContext.currentActivity as? ComponentActivity
            if (registered && activity != null) {
                PredictiveBackProgress.removeHandler(activity, this)
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
