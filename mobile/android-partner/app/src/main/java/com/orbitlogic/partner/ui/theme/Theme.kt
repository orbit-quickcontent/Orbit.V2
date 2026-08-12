package com.orbitlogic.partner.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = OrbitCyan,
    secondary = OrbitPurple,
    background = Color.Black,
    surface = Color.Black,
    onPrimary = Color.Black,
    onSecondary = White,
    onBackground = White,
    onSurface = White,
    outline = OrbitBorder
)

@Composable
fun OrbitTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography,
        content = content
    )
}
