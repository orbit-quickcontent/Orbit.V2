package com.orbitlogic.partner.ui.theme

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─── Theme Colors ─────────────────────────────────────────────────────────────

val SkeuLightBg = Color(0xFFECEFF3)
val SkeuLightSurface = Color(0xFFF7F9FC)
val SkeuDarkBg = Color(0xFF0F172A)
val SkeuDarkSurface = Color(0xFF111827)
val SkeuDarkElevated = Color(0xFF1F2937)

val SkeuTextPrimary = Color(0xFF111827)
val SkeuTextSecondary = Color(0xFF6B7280)
val SkeuAccentBlue = Color(0xFF2563EB)
val SkeuAccentPurple = Color(0xFF7C3AED)
val SkeuSuccessGreen = Color(0xFF10B981)

// ─── 1. OrbitSkeuButton ───────────────────────────────────────────────────────

@Composable
fun OrbitSkeuButton(
    label: String,
    onTap: () -> Unit,
    modifier: Modifier = Modifier,
    icon: OrbitIconType? = null,
    accent: Color = SkeuAccentBlue,
    isSecondary: Boolean = false,
    enabled: Boolean = true
) {
    val haptic = LocalHapticFeedback.current
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()

    val translationY by animateFloatAsState(
        targetValue = if (isPressed) 3f else 0f,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "buttonPressTranslation"
    )

    val shadowElevation by animateDpAsState(
        targetValue = if (isPressed) 2.dp else 8.dp,
        animationSpec = tween(durationMillis = 180, easing = FastOutSlowInEasing),
        label = "buttonShadow"
    )

    Surface(
        modifier = modifier
            .graphicsLayer { this.translationY = translationY }
            .shadow(shadowElevation, shape = RoundedCornerShape(18.dp))
            .clickable(
                interactionSource = interactionSource,
                indication = null,
                enabled = enabled
            ) {
                haptic.performHapticFeedback(HapticFeedbackType.LongPress)
                onTap()
            },
        shape = RoundedCornerShape(18.dp),
        color = Color.Transparent,
        border = BorderStroke(
            1.dp,
            if (isPressed) Color(0xFF9CA3AF)
            else if (isSecondary) Color(0xFFD1D5DB)
            else accent.copy(alpha = 0.6f)
        )
    ) {
        Box(
            modifier = Modifier
                .background(
                    if (!enabled) {
                        Brush.verticalGradient(listOf(Color(0xFFE5E7EB), Color(0xFFD1D5DB)))
                    } else if (isSecondary) {
                        Brush.verticalGradient(
                            if (isPressed) listOf(Color(0xFFE5E7EB), Color(0xFFF9FAFB))
                            else listOf(Color(0xFFFDFDFD), Color(0xFFE7ECF2))
                        )
                    } else {
                        Brush.verticalGradient(
                            if (isPressed) listOf(accent, accent.copy(alpha = 0.85f))
                            else listOf(accent.copy(alpha = 0.95f), accent)
                        )
                    }
                )
                .padding(horizontal = 22.dp, vertical = 15.dp),
            contentAlignment = Alignment.Center
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                icon?.let {
                    OrbitIcon(
                        type = it,
                        color = if (isSecondary) accent else Color.White,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                }
                Text(
                    text = label,
                    color = if (!enabled) Color.Gray else if (isSecondary) SkeuTextPrimary else Color.White,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.W700,
                    letterSpacing = 0.2.sp
                )
            }
        }
    }
}

// ─── 2. OrbitSkeuCard ─────────────────────────────────────────────────────────

@Composable
fun OrbitSkeuCard(
    modifier: Modifier = Modifier,
    backgroundColor: Color = SkeuLightSurface,
    borderColor: Color = Color(0xFFE5E7EB),
    elevation: Dp = 8.dp,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        shape = RoundedCornerShape(24.dp),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = elevation),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            content = content
        )
    }
}

// ─── 3. OrbitSkeuPill ─────────────────────────────────────────────────────────

@Composable
fun OrbitSkeuPill(
    isOnline: Boolean,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(50.dp),
        color = if (isOnline) SkeuSuccessGreen.copy(alpha = 0.15f) else Color(0xFFF3F4F6),
        border = BorderStroke(1.dp, if (isOnline) SkeuSuccessGreen.copy(alpha = 0.5f) else Color(0xFFE5E7EB))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(if (isOnline) SkeuSuccessGreen else SkeuTextSecondary)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = if (isOnline) "ONLINE" else "OFFLINE",
                color = if (isOnline) SkeuSuccessGreen else SkeuTextSecondary,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.8.sp
            )
        }
    }
}
