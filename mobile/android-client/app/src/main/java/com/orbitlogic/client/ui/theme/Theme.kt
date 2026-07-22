package com.orbitlogic.client.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = OrbitCyan,
    secondary = OrbitPurple,
    background = SpaceNavy,
    surface = SpaceNavyLight,
    onPrimary = SpaceNavy,
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
