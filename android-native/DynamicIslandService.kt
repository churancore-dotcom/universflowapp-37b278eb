package com.universeflow.app.island

import android.animation.ValueAnimator
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import java.net.URL

/**
 * Universflow Dynamic Island — a true system-wide overlay (TYPE_APPLICATION_OVERLAY)
 * that floats above other apps while music plays.
 *
 * Style: "Minimal Onyx" — pure black pill, white text, tiny rose (#FF2D55) accent.
 * Expands on tap into a compact card with prev / play-pause / next + slim progress bar.
 *
 * All visuals are built programmatically — no XML, no drawables — so the plugin
 * works without any extra resources being bundled in the host project.
 */
class DynamicIslandService : Service() {

    companion object {
        const val ACTION_SHOW = "com.universeflow.island.SHOW"
        const val ACTION_UPDATE = "com.universeflow.island.UPDATE"
        const val ACTION_HIDE = "com.universeflow.island.HIDE"

        private const val ROSE = 0xFFFF2D55.toInt()
        private const val WHITE_70 = 0xB3FFFFFF.toInt()
        private const val WHITE_40 = 0x66FFFFFF.toInt()
        private const val WHITE_10 = 0x1AFFFFFF.toInt()
    }

    private var wm: WindowManager? = null
    private var root: FrameLayout? = null
    private var lp: WindowManager.LayoutParams? = null

    private var artwork: ImageView? = null
    private var title: TextView? = null
    private var artist: TextView? = null
    private var roseDot: View? = null
    private var playBtn: ImageButton? = null
    private var prevBtn: ImageButton? = null
    private var nextBtn: ImageButton? = null
    private var closeBtn: ImageButton? = null
    private var progressBar: View? = null
    private var progressTrack: View? = null
    private var compactRow: LinearLayout? = null
    private var expandedRow: LinearLayout? = null

    private var expanded = false
    private var isPlaying = true
    private var lastCoverUrl: String? = null
    private var lastTitle: String = ""
    private var lastArtist: String = ""
    private var positionMs = 0
    private var durationMs = 0
    private val main = Handler(Looper.getMainLooper())
    private var dotAnim: ValueAnimator? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> {
                lastTitle = intent.getStringExtra("title") ?: ""
                lastArtist = intent.getStringExtra("artist") ?: ""
                isPlaying = intent.getBooleanExtra("isPlaying", true)
                val cover = intent.getStringExtra("cover")
                ensureView()
                applyMeta(lastTitle, lastArtist)
                applyPlayingState(isPlaying)
                if (cover != null && cover != lastCoverUrl) {
                    lastCoverUrl = cover
                    loadArtwork(cover)
                }
            }
            ACTION_UPDATE -> {
                if (intent.hasExtra("isPlaying")) {
                    isPlaying = intent.getBooleanExtra("isPlaying", isPlaying)
                    applyPlayingState(isPlaying)
                }
                if (intent.hasExtra("position")) positionMs = intent.getIntExtra("position", 0) * 1000
                if (intent.hasExtra("duration")) durationMs = intent.getIntExtra("duration", 0) * 1000
                applyProgress()
            }
            ACTION_HIDE -> {
                teardown()
                stopSelf()
                return START_NOT_STICKY
            }
        }
        return START_STICKY
    }

    private fun dp(v: Float): Int = TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics
    ).toInt()

    private fun ensureView() {
        if (root != null) return
        val ctx = this
        wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else
            @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

        lp = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = dp(8f)
        }

        root = FrameLayout(ctx)

        // Pill background — pure black with hairline white border.
        val pillBg = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(28f).toFloat()
            setColor(Color.BLACK)
            setStroke(dp(0.5f), WHITE_10)
        }

        val container = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            background = pillBg
            setPadding(dp(8f), dp(8f), dp(8f), dp(8f))
            elevation = dp(12f).toFloat()
        }

        // Row 1 — compact pill content
        compactRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        artwork = ImageView(ctx).apply {
            val s = dp(40f)
            layoutParams = LinearLayout.LayoutParams(s, s).apply {
                rightMargin = dp(10f)
            }
            scaleType = ImageView.ScaleType.CENTER_CROP
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(10f).toFloat()
                setColor(0xFF111111.toInt())
            }
            clipToOutline = true
        }

        val textCol = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(dp(150f), LinearLayout.LayoutParams.WRAP_CONTENT)
        }
        title = TextView(ctx).apply {
            setTextColor(Color.WHITE)
            textSize = 13f
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
            typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        }
        artist = TextView(ctx).apply {
            setTextColor(WHITE_70)
            textSize = 11f
            maxLines = 1
            ellipsize = android.text.TextUtils.TruncateAt.END
        }
        textCol.addView(title)
        textCol.addView(artist)

        // Rose dot indicator — pulses when playing.
        roseDot = View(ctx).apply {
            val s = dp(7f)
            layoutParams = LinearLayout.LayoutParams(s, s).apply {
                leftMargin = dp(10f)
                rightMargin = dp(6f)
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(ROSE)
            }
        }

        compactRow!!.addView(artwork)
        compactRow!!.addView(textCol)
        compactRow!!.addView(roseDot)
        container.addView(compactRow)

        // Row 2 — expanded controls (hidden until tap)
        expandedRow = LinearLayout(ctx).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            setPadding(dp(4f), dp(10f), dp(4f), dp(2f))
        }

        val controls = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
        }
        prevBtn = mkBtn("⏮") { DynamicIslandPlugin.emitAction("prev") }
        playBtn = mkBtn(if (isPlaying) "⏸" else "▶") {
            isPlaying = !isPlaying
            applyPlayingState(isPlaying)
            DynamicIslandPlugin.emitAction(if (isPlaying) "play" else "pause")
        }
        nextBtn = mkBtn("⏭") { DynamicIslandPlugin.emitAction("next") }
        controls.addView(prevBtn)
        controls.addView(spacer(dp(20f)))
        controls.addView(playBtn)
        controls.addView(spacer(dp(20f)))
        controls.addView(nextBtn)

        // Slim progress track
        val trackHolder = FrameLayout(ctx).apply {
            layoutParams = LinearLayout.LayoutParams(
                dp(240f), dp(2f)
            ).apply { topMargin = dp(10f); gravity = Gravity.CENTER_HORIZONTAL }
        }
        progressTrack = View(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(1f).toFloat()
                setColor(WHITE_10)
            }
        }
        progressBar = View(ctx).apply {
            layoutParams = FrameLayout.LayoutParams(
                dp(2f), FrameLayout.LayoutParams.MATCH_PARENT
            )
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(1f).toFloat()
                setColor(ROSE)
            }
        }
        trackHolder.addView(progressTrack)
        trackHolder.addView(progressBar)

        // Close (X) — top-right of the expanded card
        closeBtn = mkBtn("×") {
            DynamicIslandPlugin.emitAction("close")
            collapse()
            teardown()
            stopSelf()
        }.apply {
            layoutParams = LinearLayout.LayoutParams(dp(28f), dp(28f))
        }
        val topBar = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END
            addView(closeBtn)
        }

        expandedRow!!.addView(topBar)
        expandedRow!!.addView(controls)
        expandedRow!!.addView(trackHolder)

        container.addView(expandedRow)

        // Tap pill (not buttons) → toggle expand. Long-press on pill → open app.
        compactRow!!.setOnClickListener { toggleExpand() }
        compactRow!!.setOnLongClickListener {
            DynamicIslandPlugin.emitAction("open")
            openHostApp()
            true
        }

        root!!.addView(container)

        try {
            wm!!.addView(root, lp)
        } catch (t: Throwable) {
            root = null
            return
        }

        startDotPulse()
    }

    private fun mkBtn(label: String, onClick: () -> Unit): ImageButton {
        val ctx = this
        val btn = ImageButton(ctx)
        val s = dp(36f)
        btn.layoutParams = LinearLayout.LayoutParams(s, s)
        btn.background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(0x14FFFFFF)
        }
        // Render label glyph as a bitmap (works with ImageButton without fonts).
        btn.setImageBitmap(textGlyph(label, dp(18f).toFloat(), Color.WHITE))
        btn.setOnClickListener { onClick() }
        return btn
    }

    private fun spacer(w: Int): View {
        val v = View(this)
        v.layoutParams = LinearLayout.LayoutParams(w, 1)
        return v
    }

    private fun textGlyph(s: String, size: Float, color: Int): Bitmap {
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            this.color = color
            textSize = size
            textAlign = Paint.Align.CENTER
            typeface = android.graphics.Typeface.create("sans-serif-medium", android.graphics.Typeface.NORMAL)
        }
        val bounds = Rect()
        paint.getTextBounds(s, 0, s.length, bounds)
        val w = (paint.measureText(s) + dp(8f)).toInt().coerceAtLeast(dp(20f))
        val h = (bounds.height() + dp(10f))
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
        val c = Canvas(bmp)
        val fm = paint.fontMetrics
        val baseline = h / 2f - (fm.ascent + fm.descent) / 2f
        c.drawText(s, w / 2f, baseline, paint)
        return bmp
    }

    private fun applyMeta(t: String, a: String) {
        title?.text = if (t.isNotBlank()) t else "Now Playing"
        artist?.text = a
    }

    private fun applyPlayingState(playing: Boolean) {
        playBtn?.setImageBitmap(textGlyph(if (playing) "⏸" else "▶", dp(18f).toFloat(), Color.WHITE))
        if (playing) startDotPulse() else stopDotPulse()
    }

    private fun applyProgress() {
        val track = progressTrack ?: return
        val bar = progressBar ?: return
        val w = track.width
        if (w <= 0 || durationMs <= 0) return
        val pct = (positionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f)
        val lp = bar.layoutParams as FrameLayout.LayoutParams
        lp.width = (w * pct).toInt().coerceAtLeast(dp(2f))
        bar.layoutParams = lp
    }

    private fun startDotPulse() {
        if (dotAnim?.isRunning == true) return
        dotAnim = ValueAnimator.ofFloat(0.55f, 1f).apply {
            duration = 850
            repeatMode = ValueAnimator.REVERSE
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener {
                val v = it.animatedValue as Float
                roseDot?.alpha = v
            }
            start()
        }
    }

    private fun stopDotPulse() {
        dotAnim?.cancel()
        dotAnim = null
        roseDot?.alpha = 0.35f
    }

    private fun toggleExpand() {
        if (expanded) collapse() else expand()
    }

    private fun expand() {
        expanded = true
        expandedRow?.visibility = View.VISIBLE
        applyProgress()
    }

    private fun collapse() {
        expanded = false
        expandedRow?.visibility = View.GONE
    }

    private fun openHostApp() {
        try {
            val launch = packageManager.getLaunchIntentForPackage(packageName)
            launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
            if (launch != null) startActivity(launch)
        } catch (_: Throwable) {}
    }

    private fun loadArtwork(url: String) {
        Thread {
            try {
                val conn = URL(url).openConnection()
                conn.connectTimeout = 6000
                conn.readTimeout = 6000
                val bmp = BitmapFactory.decodeStream(conn.getInputStream())
                if (bmp != null) {
                    val rounded = roundedBitmap(bmp, dp(10f).toFloat())
                    main.post { artwork?.setImageBitmap(rounded) }
                }
            } catch (_: Throwable) {}
        }.start()
    }

    private fun roundedBitmap(src: Bitmap, radius: Float): Bitmap {
        val size = minOf(src.width, src.height)
        val sq = Bitmap.createBitmap(
            src,
            (src.width - size) / 2,
            (src.height - size) / 2,
            size, size
        )
        val out = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(out)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        val rect = RectF(0f, 0f, size.toFloat(), size.toFloat())
        canvas.drawRoundRect(rect, radius, radius, paint)
        paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(sq, 0f, 0f, paint)
        return out
    }

    private fun teardown() {
        stopDotPulse()
        try {
            if (root != null) wm?.removeView(root)
        } catch (_: Throwable) {}
        root = null
    }

    override fun onDestroy() {
        teardown()
        super.onDestroy()
    }
}
