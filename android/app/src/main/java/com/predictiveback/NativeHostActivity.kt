package com.predictiveback

import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.widget.LinearLayout
import android.widget.Switch
import android.widget.TextView
import androidx.activity.BackEventCompat
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.fragment.app.FragmentContainerView
import com.facebook.react.ReactFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * Step 3 of the brownfield stack. A normal activity: native chrome on top, a
 * [ReactFragment] filling the rest.
 *
 * The fragment does not own the back gesture. [ReactFragment] is not a
 * [com.facebook.react.ReactActivity], so `BackHandler.setInterceptEnabled`
 * cannot see this dispatcher. The host decides. The callback starts disabled,
 * and the system pops this activity back to the React Native screen. Turning
 * the switch on claims the gesture: progress is reported here, and the commit
 * is forwarded to the fragment as `hardwareBackPress`.
 */
class NativeHostActivity : AppCompatActivity(), DefaultHardwareBackBtnHandler {

  private lateinit var progressLabel: TextView

  private val backCallback =
      object : OnBackPressedCallback(false) {
        override fun handleOnBackStarted(backEvent: BackEventCompat) {
          showProgress("started ${format(backEvent.progress)}")
        }

        override fun handleOnBackProgressed(backEvent: BackEventCompat) {
          showProgress("progress ${format(backEvent.progress)}")
        }

        override fun handleOnBackCancelled() {
          showProgress("cancelled")
        }

        override fun handleOnBackPressed() {
          val consumed = embeddedFragment()?.onBackPressed() == true
          if (consumed) {
            showProgress("JS kept this screen")
            return
          }
          isEnabled = false
          onBackPressedDispatcher.onBackPressed()
        }
      }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(buildContent())
    onBackPressedDispatcher.addCallback(this, backCallback)
    if (savedInstanceState == null) {
      supportFragmentManager
          .beginTransaction()
          .add(
              R.id.brownfield_fragment,
              ReactFragment.Builder().setComponentName(COMPONENT).build(),
          )
          .commit()
    }
  }

  override fun onKeyUp(keyCode: Int, event: KeyEvent): Boolean {
    if (embeddedFragment()?.onKeyUp(keyCode, event) == true) {
      return true
    }
    return super.onKeyUp(keyCode, event)
  }

  override fun invokeDefaultOnBackPressed() {
    backCallback.isEnabled = false
    onBackPressedDispatcher.onBackPressed()
  }

  private fun embeddedFragment(): ReactFragment? =
      supportFragmentManager.findFragmentById(R.id.brownfield_fragment) as? ReactFragment

  private fun showProgress(text: String) {
    progressLabel.text = text
  }

  private fun buildContent(): LinearLayout {
    val root =
        LinearLayout(this).apply {
          orientation = LinearLayout.VERTICAL
          setBackgroundColor(BACKGROUND)
          val pad = dp(16)
          setPadding(pad, pad, pad, 0)
        }

    root.addView(label("Native host", 22f, Color.WHITE))
    root.addView(
        label(
            "Not a ReactActivity. The fragment below shares this dispatcher, " +
                "it does not register its own.",
            13f,
            MUTED,
        ).apply { setPadding(0, dp(6), 0, dp(8)) },
    )

    progressLabel =
        label("gesture: system owns it", 14f, Color.WHITE).apply {
          setPadding(0, 0, 0, dp(8))
        }
    root.addView(progressLabel)

    val row =
        LinearLayout(this).apply {
          orientation = LinearLayout.HORIZONTAL
          gravity = Gravity.CENTER_VERTICAL
          setPadding(0, 0, 0, dp(12))
        }
    row.addView(
        label("Embedded RN consumes", 15f, Color.WHITE).apply {
          layoutParams =
              LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        },
    )
    row.addView(
        Switch(this).apply {
          setOnCheckedChangeListener { _, checked ->
            backCallback.isEnabled = checked
            showProgress(if (checked) "gesture: host callback on" else "gesture: system owns it")
          }
        },
    )
    root.addView(row)

    root.addView(
        FragmentContainerView(this).apply {
          id = R.id.brownfield_fragment
          setBackgroundColor(BACKGROUND)
          layoutParams =
              LinearLayout.LayoutParams(
                  LinearLayout.LayoutParams.MATCH_PARENT,
                  0,
                  1f,
              )
        },
    )
    return root
  }

  private fun label(text: String, sizeSp: Float, color: Int): TextView =
      TextView(this).apply {
        this.text = text
        setTextColor(color)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, sizeSp)
      }

  private fun dp(value: Int): Int =
      TypedValue.applyDimension(
              TypedValue.COMPLEX_UNIT_DIP,
              value.toFloat(),
              resources.displayMetrics,
          )
          .toInt()

  private fun format(progress: Float): String = "%.2f".format(progress)

  private companion object {
    const val COMPONENT = "BrownfieldEmbed"
    const val BACKGROUND = 0xFF0B1020.toInt()
    const val MUTED = 0xFFCBD5F5.toInt()
  }
}
