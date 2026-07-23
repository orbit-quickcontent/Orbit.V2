package com.orbitlogic.core.ui

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ─── Orbit Brand Tokens ───────────────────────────────────────────────────────

val OrbitCyan = Color(0xFF00BFFF)
val OrbitPurple = Color(0xFFA020F0)
val SpaceNavy = Color(0xFF000000)
val SpaceNavyLight = Color(0xFF0A0A0A)
val SpaceNavyLighter = Color(0xFF111111)
val OrbitBorder = Color(0xFF1A1A2E)
val MutedText = Color(0xFF7EB8E0)
val Destructive = Color(0xFFFF4444)

val OrbitGradientBrush = Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))
val OrbitPurpleCyanBrush = Brush.linearGradient(listOf(OrbitPurple, OrbitCyan))

// ─── 1. Orbit Buttons ─────────────────────────────────────────────────────────

@Composable
fun OrbitGradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        enabled = enabled,
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        contentPadding = PaddingValues(),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.height(50.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (enabled) OrbitGradientBrush
                    else Brush.linearGradient(listOf(Color.DarkGray, Color.Gray))
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(text = text, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

// ─── 2. Orbit Cards (Glassmorphism on Black) ───────────────────────────────

@Composable
fun OrbitGlassCard(
    modifier: Modifier = Modifier,
    borderColor: Color = OrbitBorder,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, borderColor, RoundedCornerShape(16.dp))
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            content = content
        )
    }
}

@Composable
fun OrbitCardStrong(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SpaceNavyLighter),
        shape = RoundedCornerShape(16.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, OrbitCyan.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            content = content
        )
    }
}

// ─── 3. Orbit Text Fields & Search Inputs ───────────────────────────────────

@Composable
fun OrbitInput(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    singleLine: Boolean = true,
    minLines: Int = 1
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier.fillMaxWidth(),
        singleLine = singleLine,
        minLines = minLines,
        keyboardOptions = keyboardOptions,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = OrbitCyan,
            unfocusedBorderColor = OrbitBorder,
            focusedLabelColor = OrbitCyan,
            unfocusedLabelColor = MutedText
        )
    )
}

@Composable
fun OrbitSearchBar(
    query: String,
    onQueryChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = { Text("Search Orbit catalog...", color = MutedText) },
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(24.dp)),
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = OrbitCyan,
            unfocusedBorderColor = OrbitBorder,
            containerColor = SpaceNavyLight
        )
    )
}

// ─── 4. Orbit Headers & Top Bars ──────────────────────────────────────────────

@Composable
fun OrbitTopBar(title: String, subtitle: String? = null) {
    Column(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
        Text(
            text = title,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        subtitle?.let {
            Text(
                text = it,
                fontSize = 14.sp,
                color = MutedText,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}

// ─── 5. Orbit Navigation Pill (`orbit-nav-pill`) ─────────────────────────────

@Composable
fun OrbitBottomNavigation(
    tabs: List<Pair<String, String>>,
    currentTab: String,
    onSelectTab: (String) -> Unit
) {
    Surface(
        color = SpaceNavyLight,
        tonalElevation = 12.dp,
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
            .border(1.dp, OrbitBorder)
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            tabs.forEach { (label, key) ->
                val isSelected = currentTab == key
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier
                        .clickable { onSelectTab(key) }
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = label,
                        fontSize = 12.sp,
                        fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Normal,
                        color = if (isSelected) OrbitCyan else MutedText
                    )
                    if (isSelected) {
                        Box(
                            modifier = Modifier
                                .padding(top = 4.dp)
                                .size(width = 16.dp, height = 2.dp)
                                .background(OrbitCyan)
                        )
                    }
                }
            }
        }
    }
}

// ─── 6. Orbit Specialized Feature Cards ──────────────────────────────────────

@Composable
fun OrbitPackageCard(
    title: String,
    subtitle: String,
    price: String,
    features: List<String>,
    onSelect: () -> Unit,
    isPopular: Boolean = false
) {
    OrbitGlassCard(borderColor = if (isPopular) OrbitPurple else OrbitBorder) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Column {
                Text(title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                if (isPopular) {
                    Surface(color = OrbitPurple.copy(alpha = 0.2f), shape = RoundedCornerShape(4.dp)) {
                        Text("MOST POPULAR", color = OrbitPurple, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
            }
            Text(price, fontSize = 24.sp, fontWeight = FontWeight.Black, color = if (isPopular) OrbitPurple else OrbitCyan)
        }
        Text(subtitle, color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(vertical = 12.dp))

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            features.forEach { feature ->
                Text("✓ $feature", color = Color.White, fontSize = 14.sp)
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        OrbitGradientButton(text = "Book $title Package", onClick = onSelect, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
fun OrbitStatusTimeline(
    currentStage: Int,
    stages: List<String>
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        stages.forEachIndexed { index, stage ->
            Row(verticalAlignment = Alignment.CenterVertically) {
                if (index < currentStage) {
                    Text("✓ ", color = OrbitCyan, fontWeight = FontWeight.Bold)
                    Text(stage, color = Color.White, fontSize = 14.sp)
                } else if (index == currentStage) {
                    Text("• ", color = OrbitCyan, fontWeight = FontWeight.Bold)
                    Text("$stage (Active)", color = OrbitCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                } else {
                    Text("◦ ", color = MutedText)
                    Text("$stage (Pending)", color = MutedText, fontSize = 14.sp)
                }
            }
        }
    }
}

@Composable
fun OrbitWalletCard(
    balance: String,
    pending: String,
    onWithdraw: () -> Unit
) {
    OrbitGlassCard(borderColor = OrbitCyan) {
        Text("Available Balance", color = MutedText, fontSize = 13.sp)
        Text(balance, fontSize = 36.sp, fontWeight = FontWeight.Black, color = Color.White, modifier = Modifier.padding(vertical = 4.dp))
        Text("Pending Clearance: $pending", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        OrbitGradientButton(text = "Initiate Instant Payout", onClick = onWithdraw, modifier = Modifier.fillMaxWidth())
    }
}

@Composable
fun OrbitLoader() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator(color = OrbitCyan, strokeWidth = 3.dp)
    }
}

@Composable
fun OrbitSkeleton() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(100.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(SpaceNavyLight)
            .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp))
    )
}
