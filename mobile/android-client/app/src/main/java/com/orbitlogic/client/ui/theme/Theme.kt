package com.orbitlogic.client.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf

// ─── CompositionLocal — lets any child composable know the active theme ──────
val LocalOrbitIsLight = staticCompositionLocalOf { false }

// Helper read inside any composable: val isLight = LocalOrbitIsLight.current

// ─── Dark Colour Scheme ───────────────────────────────────────────────────────
private val DarkColorScheme = darkColorScheme(
    primary        = OrbitCyan,
    secondary      = OrbitPurple,
    background     = SpaceNavy,
    surface        = SpaceNavyLight,
    onPrimary      = SpaceNavy,
    onSecondary    = White,
    onBackground   = White,
    onSurface      = White,
    outline        = OrbitBorder,
    error          = Destructive
)

// ─── Light Colour Scheme ──────────────────────────────────────────────────────
private val LightColorScheme = lightColorScheme(
    primary        = LightPrimary,
    secondary      = LightPurple,
    background     = LightBg,
    surface        = LightSurface,
    onPrimary      = White,
    onSecondary    = White,
    onBackground   = LightTextPrimary,
    onSurface      = LightTextPrimary,
    outline        = LightBorder,
    error          = LightError
)

// ─── OrbitTheme — wraps app with the chosen theme ────────────────────────────
@Composable
fun OrbitTheme(
    useLightTheme: Boolean = false,
    content: @Composable () -> Unit
) {
    CompositionLocalProvider(LocalOrbitIsLight provides useLightTheme) {
        MaterialTheme(
            colorScheme = if (useLightTheme) LightColorScheme else DarkColorScheme,
            typography  = Typography,
            content     = content
        )
    }
}

// ─── Adaptive colour helper — use from any composable ────────────────────────
// Usage: val bg = adaptiveColor(dark = Color.Black, light = LightBg)
@Composable
fun adaptiveColor(dark: androidx.compose.ui.graphics.Color, light: androidx.compose.ui.graphics.Color): androidx.compose.ui.graphics.Color {
    return if (LocalOrbitIsLight.current) light else dark
}
