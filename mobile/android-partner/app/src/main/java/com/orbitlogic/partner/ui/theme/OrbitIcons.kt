package com.orbitlogic.partner.ui.theme

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.dp

/**
 * Monochrome, stroke-based vector icons drawn directly with Canvas — no emoji glyphs.
 * Emoji render differently across devices/fonts (color, style, sometimes as tofu boxes)
 * and don't take a tint color, which is why they were replaced here. Each icon draws in
 * whatever `color` is passed in, so it always matches the surrounding UI theme.
 *
 * Usage: OrbitIcon(OrbitIconType.LocationPin, color = OrbitCyan, modifier = Modifier.size(20.dp))
 */
enum class OrbitIconType {
    LocationPin, Camera, Bell, Bolt, Check, Lock,
    Palette, Tie, TheaterMasks, Compass
}

@Composable
fun OrbitIcon(
    type: OrbitIconType,
    color: Color,
    modifier: Modifier = Modifier.size(20.dp),
    strokeWidthDp: Float = 1.8f
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val stroke = Stroke(width = strokeWidthDp.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round)

        when (type) {
            OrbitIconType.LocationPin -> {
                val path = Path().apply {
                    moveTo(w * 0.5f, h * 0.92f)
                    cubicTo(w * 0.5f, h * 0.92f, w * 0.18f, h * 0.55f, w * 0.18f, h * 0.38f)
                    cubicTo(w * 0.18f, h * 0.18f, w * 0.32f, h * 0.06f, w * 0.5f, h * 0.06f)
                    cubicTo(w * 0.68f, h * 0.06f, w * 0.82f, h * 0.18f, w * 0.82f, h * 0.38f)
                    cubicTo(w * 0.82f, h * 0.55f, w * 0.5f, h * 0.92f, w * 0.5f, h * 0.92f)
                    close()
                }
                drawPath(path, color = color, style = stroke)
                drawCircle(color = color, radius = w * 0.11f, center = Offset(w * 0.5f, h * 0.36f), style = stroke)
            }

            OrbitIconType.Camera -> {
                val body = Path().apply {
                    moveTo(w * 0.12f, h * 0.30f)
                    lineTo(w * 0.35f, h * 0.30f)
                    lineTo(w * 0.42f, h * 0.18f)
                    lineTo(w * 0.58f, h * 0.18f)
                    lineTo(w * 0.65f, h * 0.30f)
                    lineTo(w * 0.88f, h * 0.30f)
                    lineTo(w * 0.88f, h * 0.82f)
                    lineTo(w * 0.12f, h * 0.82f)
                    close()
                }
                drawPath(body, color = color, style = stroke)
                drawCircle(color = color, radius = w * 0.16f, center = Offset(w * 0.5f, h * 0.56f), style = stroke)
            }

            OrbitIconType.Bell -> {
                val body = Path().apply {
                    moveTo(w * 0.28f, h * 0.68f)
                    cubicTo(w * 0.28f, h * 0.45f, w * 0.28f, h * 0.20f, w * 0.5f, h * 0.20f)
                    cubicTo(w * 0.72f, h * 0.20f, w * 0.72f, h * 0.45f, w * 0.72f, h * 0.68f)
                    lineTo(w * 0.84f, h * 0.78f)
                    lineTo(w * 0.16f, h * 0.78f)
                    close()
                }
                drawPath(body, color = color, style = stroke)
                val clapper = Path().apply {
                    moveTo(w * 0.40f, h * 0.86f)
                    cubicTo(w * 0.40f, h * 0.92f, w * 0.60f, h * 0.92f, w * 0.60f, h * 0.86f)
                }
                drawPath(clapper, color = color, style = stroke)
            }

            OrbitIconType.Bolt -> {
                val path = Path().apply {
                    moveTo(w * 0.56f, h * 0.06f)
                    lineTo(w * 0.22f, h * 0.58f)
                    lineTo(w * 0.46f, h * 0.58f)
                    lineTo(w * 0.40f, h * 0.94f)
                    lineTo(w * 0.80f, h * 0.38f)
                    lineTo(w * 0.54f, h * 0.38f)
                    close()
                }
                drawPath(path, color = color, style = stroke)
            }

            OrbitIconType.Check -> {
                val path = Path().apply {
                    moveTo(w * 0.18f, h * 0.52f)
                    lineTo(w * 0.42f, h * 0.76f)
                    lineTo(w * 0.84f, h * 0.24f)
                }
                drawPath(path, color = color, style = stroke)
            }

            OrbitIconType.Lock -> {
                val shackle = Path().apply {
                    moveTo(w * 0.30f, h * 0.44f)
                    lineTo(w * 0.30f, h * 0.30f)
                    cubicTo(w * 0.30f, h * 0.14f, w * 0.70f, h * 0.14f, w * 0.70f, h * 0.30f)
                    lineTo(w * 0.70f, h * 0.44f)
                }
                drawPath(shackle, color = color, style = stroke)
                val body = Path().apply {
                    moveTo(w * 0.20f, h * 0.44f)
                    lineTo(w * 0.80f, h * 0.44f)
                    lineTo(w * 0.80f, h * 0.88f)
                    lineTo(w * 0.20f, h * 0.88f)
                    close()
                }
                drawPath(body, color = color, style = stroke)
            }

            OrbitIconType.Palette -> {
                drawCircle(color = color, radius = w * 0.40f, center = Offset(w * 0.5f, h * 0.5f), style = stroke)
                drawCircle(color = color, radius = w * 0.05f, center = Offset(w * 0.35f, h * 0.38f))
                drawCircle(color = color, radius = w * 0.05f, center = Offset(w * 0.62f, h * 0.34f))
                drawCircle(color = color, radius = w * 0.05f, center = Offset(w * 0.68f, h * 0.60f))
            }

            OrbitIconType.Tie -> {
                val collar = Path().apply {
                    moveTo(w * 0.32f, h * 0.14f)
                    lineTo(w * 0.68f, h * 0.14f)
                    lineTo(w * 0.56f, h * 0.34f)
                    lineTo(w * 0.44f, h * 0.34f)
                    close()
                }
                drawPath(collar, color = color, style = stroke)
                val tie = Path().apply {
                    moveTo(w * 0.44f, h * 0.34f)
                    lineTo(w * 0.56f, h * 0.34f)
                    lineTo(w * 0.62f, h * 0.56f)
                    lineTo(w * 0.5f, h * 0.90f)
                    lineTo(w * 0.38f, h * 0.56f)
                    close()
                }
                drawPath(tie, color = color, style = stroke)
            }

            OrbitIconType.TheaterMasks -> {
                drawCircle(color = color, radius = w * 0.28f, center = Offset(w * 0.36f, h * 0.42f), style = stroke)
                drawCircle(color = color, radius = w * 0.28f, center = Offset(w * 0.64f, h * 0.58f), style = stroke)
            }

            OrbitIconType.Compass -> {
                drawCircle(color = color, radius = w * 0.40f, center = Offset(w * 0.5f, h * 0.5f), style = stroke)
                val needle = Path().apply {
                    moveTo(w * 0.5f, h * 0.28f)
                    lineTo(w * 0.60f, h * 0.58f)
                    lineTo(w * 0.5f, h * 0.72f)
                    lineTo(w * 0.40f, h * 0.58f)
                    close()
                }
                drawPath(needle, color = color, style = stroke)
            }
        }
    }
}
