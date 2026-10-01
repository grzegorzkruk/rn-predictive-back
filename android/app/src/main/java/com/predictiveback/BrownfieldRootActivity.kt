package com.predictiveback

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.TypedValue
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

/**
 * Step 1 of the brownfield stack. No React Native is mounted, so the back
 * gesture belongs to the system. From here that finishes the task.
 */
class BrownfieldRootActivity : AppCompatActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(buildContent())
  }

  private fun buildContent(): LinearLayout {
    val root =
        LinearLayout(this).apply {
          orientation = LinearLayout.VERTICAL
          setBackgroundColor(BACKGROUND)
          val pad = dp(20)
          setPadding(pad, pad, pad, pad)
        }

    root.addView(
        label("Native screen", 28f, Color.WHITE).apply {
          setPadding(0, dp(24), 0, dp(12))
        },
    )
    root.addView(
        label(
            "Nothing from React Native is mounted. A swipe or the back button " +
                "is the system predictive-back animation, and it leaves the app.",
            15f,
            MUTED,
        ),
    )
    root.addView(
        label(
            "Next: a full React Native screen. From that screen, open the native " +
                "host. That host is a normal activity with a ReactFragment embedded in it.",
            15f,
            MUTED,
        ).apply { setPadding(0, dp(12), 0, dp(20)) },
    )
    root.addView(
        Button(this).apply {
          text = "Open React Native screen"
          setOnClickListener {
            startActivity(Intent(this@BrownfieldRootActivity, MainActivity::class.java))
          }
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

  private companion object {
    const val BACKGROUND = 0xFF0B1020.toInt()
    const val MUTED = 0xFFCBD5F5.toInt()
  }
}
