package com.orbitlogic.partner.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbitlogic.partner.ui.theme.*

// ─── Custom UI Reusable Components ───────────────────────────────────────────

@Composable
fun GradientButton(
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
        shape = RoundedCornerShape(14.dp),
        modifier = modifier.height(48.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (enabled) Brush.horizontalGradient(listOf(OrbitGreen, OrbitCyan))
                    else Brush.horizontalGradient(listOf(Color.DarkGray, Color.Gray))
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(text = text, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    borderColor: Color = OrbitBorder,
    backgroundColor: Color = SpaceNavyLighter,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        shape = RoundedCornerShape(20.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, borderColor, RoundedCornerShape(20.dp))
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            content = content
        )
    }
}

@Composable
fun PartnerHeader(
    userName: String = "utkarsh",
    isOnline: Boolean = true,
    onToggleOnline: (Boolean) -> Unit = {}
) {
    Column(modifier = Modifier.fillMaxWidth().background(SpaceNavy)) {
        // Top App Bar Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left: User Avatar & Name Greeting
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(CircleShape)
                            .background(Brush.linearGradient(listOf(OrbitPurple, OrbitCyan))),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = userName.take(1).uppercase(),
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    }
                    Box(
                        modifier = Modifier
                            .size(12.dp)
                            .clip(CircleShape)
                            .background(if (isOnline) OrbitGreen else Color.Gray)
                            .border(2.dp, SpaceNavy, CircleShape)
                            .align(Alignment.BottomEnd)
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Good evening", color = MutedText, fontSize = 12.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Surface(
                            color = OrbitPurpleBg,
                            shape = RoundedCornerShape(4.dp),
                            border = BorderStroke(1.dp, OrbitPurple.copy(alpha = 0.4f))
                        ) {
                            Text(
                                "PARTNER",
                                color = OrbitPurple,
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Black,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                                letterSpacing = 1.sp
                            )
                        }
                    }
                    Text("Hi, $userName", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = White)
                }
            }

            // Right: Online Toggle & Search/Notif Icons
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Surface(
                    color = SpaceNavyLighter,
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, OrbitBorder),
                    modifier = Modifier.clickable { onToggleOnline(!isOnline) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(if (isOnline) OrbitGreen else Color.Gray)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = if (isOnline) "Online" else "Offline",
                            color = if (isOnline) OrbitGreen else Color.Gray,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                Surface(
                    color = SpaceNavyLighter,
                    shape = CircleShape,
                    modifier = Modifier.size(38.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text("🔔", fontSize = 14.sp)
                    }
                }
            }
        }

        // Sub Status Banner
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("👛", fontSize = 14.sp)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Ready for your next gig", color = OrbitGreen, fontSize = 13.sp, fontWeight = FontWeight.Medium)
        }
    }
}

// ─── Screen 1: Partner Login ─────────────────────────────────────────────────

@Composable
fun PartnerLoginScreen(onLoginSuccess: (String) -> Unit) {
    var name by remember { mutableStateOf("utkarsh gupta") }
    var email by remember { mutableStateOf("utkarshssg2608@gmail.com") }
    var phone by remember { mutableStateOf("9876543210") }
    var avatarPreset by remember { mutableStateOf("Creator") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(20.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
        ) {
            // Header Logo
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
                Text("ORBIT", fontSize = 28.sp, fontWeight = FontWeight.Black, color = OrbitCyan, letterSpacing = 2.sp)
            }

            Surface(
                color = OrbitPurpleBg,
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, OrbitPurple.copy(alpha = 0.5f)),
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text("PARTNER ACCOUNT", color = OrbitPurple, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp), letterSpacing = 1.sp)
            }

            Text("Join the Orbit", fontSize = 32.sp, fontWeight = FontWeight.Black, color = White)
            Text("Sign in or create your account to get started", fontSize = 13.sp, color = MutedText, modifier = Modifier.padding(bottom = 20.dp))

            // Quick Demo Login Button
            Surface(
                color = Color(0xFF1E1B4B),
                shape = RoundedCornerShape(16.dp),
                border = BorderStroke(1.dp, Color(0xFF6366F1)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 20.dp)
                    .clickable { onLoginSuccess("demo_session_partner_${System.currentTimeMillis()}") }
            ) {
                Row(
                    modifier = Modifier.padding(14.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("⚡ Quick Partner Demo Login (1-Tap Access)", color = Color(0xFFA5B4FC), fontSize = 14.sp, fontWeight = FontWeight.ExtraBold)
                }
            }

            // Profile Picture Selection Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Text("CHOOSE YOUR PROFILE PICTURE", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())

                Spacer(modifier = Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .size(84.dp)
                        .align(Alignment.CenterHorizontally)
                        .clip(CircleShape)
                        .background(Brush.linearGradient(listOf(OrbitCyan, OrbitPurple)))
                        .padding(3.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape)
                            .background(SpaceNavy),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("👤", fontSize = 36.sp)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Creator", "Professional", "Artist", "Explorer").forEach { preset ->
                        Surface(
                            color = if (avatarPreset == preset) OrbitCyan.copy(alpha = 0.2f) else SpaceNavy,
                            shape = RoundedCornerShape(12.dp),
                            border = BorderStroke(1.dp, if (avatarPreset == preset) OrbitCyan else OrbitBorder),
                            modifier = Modifier
                                .weight(1f)
                                .clickable { avatarPreset = preset }
                        ) {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.padding(8.dp)
                            ) {
                                Text(
                                    text = when (preset) {
                                        "Creator" -> "🎨"
                                        "Professional" -> "👔"
                                        "Artist" -> "🎭"
                                        else -> "🧭"
                                    },
                                    fontSize = 18.sp
                                )
                                Text(preset, fontSize = 9.sp, color = if (avatarPreset == preset) White else MutedText, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // Input Form Card
            GlassCard {
                Text("FULL NAME *", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    placeholder = { Text("Enter your name") },
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 12.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                )

                Text("EMAIL ADDRESS *", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("you@example.com") },
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 12.dp),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                )

                Text("PHONE", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    placeholder = { Text("10-digit mobile number") },
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 20.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                )

                GradientButton(
                    text = "Continue to Studio →",
                    onClick = { onLoginSuccess("partner_token_${System.currentTimeMillis()}") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

// ─── Screen 2: Partner Available Work (Dashboard) ────────────────────────────

@Composable
fun PartnerDashboardScreen(
    onAcceptDispatch: (String) -> Unit,
    onNavigateToWork: () -> Unit
) {
    var isOnline by remember { mutableStateOf(true) }
    var activeDispatchId by remember { mutableStateOf<String?>("booking-dispatch-101") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        PartnerHeader(isOnline = isOnline, onToggleOnline = { isOnline = it })

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Incoming Dispatch Request Alert Card
            if (isOnline && activeDispatchId != null) {
                GlassCard(borderColor = OrbitPurple, modifier = Modifier.padding(bottom = 20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("⚡ NEW SHOOT DISPATCH ALERT", color = OrbitPurple, fontWeight = FontWeight.Black, fontSize = 11.sp, letterSpacing = 1.sp)
                        Surface(color = Destructive.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp)) {
                            Text("30s", color = Destructive, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text("UGC Brand Reel Shoot - Bandra West", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = White)
                    Text("Payout Fee: ₹700.00 • Distance: 2.4 KM away", color = OrbitGreen, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 4.dp))
                    Text("Client: Creative Brand Studio • Slot: 10:00 AM Today", color = MutedText, fontSize = 12.sp)

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = { activeDispatchId = null },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Decline", color = White, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                onAcceptDispatch(activeDispatchId!!)
                                onNavigateToWork()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = OrbitGreen),
                            modifier = Modifier.weight(1.2f).height(44.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Accept Shoot ✓", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }

            // Available Work Section Header
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 16.dp)) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(OrbitCyan.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("💼", fontSize = 16.sp)
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("Available Work", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                    Text("New bookings waiting for you", fontSize = 12.sp, color = MutedText)
                }
            }

            // Empty State Card
            GlassCard {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(SpaceNavy),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("💼", fontSize = 24.sp)
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text("No Available Work", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                    Text(
                        "New bookings will appear here when clients book sessions.",
                        fontSize = 13.sp,
                        color = OrbitCyan.copy(alpha = 0.8f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp, bottom = 2.dp)
                    )
                    Text("Keep the app open to receive real-time notifications.", fontSize = 11.sp, color = MutedText, textAlign = TextAlign.Center)
                }
            }
        }
    }
}

// ─── Screen 3: Work History ──────────────────────────────────────────────────

@Composable
fun PartnerWorkHistoryScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        PartnerHeader()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(OrbitGreen.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("💼", fontSize = 16.sp)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Work History", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                        Text("Completed jobs", fontSize = 12.sp, color = MutedText)
                    }
                }
                Surface(color = OrbitGreen.copy(alpha = 0.15f), shape = RoundedCornerShape(20.dp)) {
                    Text("0 done", color = OrbitGreen, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                }
            }

            // Stats Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(CircleShape)
                                .background(OrbitGreen.copy(alpha = 0.15f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("✓", color = OrbitGreen, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("0 Completed", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                            Text("Lifetime work", fontSize = 12.sp, color = MutedText)
                        }
                    }

                    Column(horizontalAlignment = Alignment.End) {
                        Text("₹0", fontSize = 24.sp, fontWeight = FontWeight.Black, color = OrbitGreen)
                        Text("Total earned", fontSize = 10.sp, color = MutedText)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                Surface(
                    color = OrbitPurpleBg,
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, OrbitPurple.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("📊", fontSize = 14.sp)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("This Month", fontSize = 13.sp, fontWeight = FontWeight.Medium, color = White)
                        }
                        Text("₹0", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = OrbitPurple)
                    }
                }
            }

            // Empty State Placeholder
            GlassCard {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(OrbitPurple.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("📥", fontSize = 24.sp)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("No Completed Work Yet", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                    Text("Completed bookings will appear here.", fontSize = 13.sp, color = MutedText, modifier = Modifier.padding(top = 4.dp))
                }
            }
        }
    }
}

// ─── Screen 4: Earnings Summary & Bank Payouts ───────────────────────────────

@Composable
fun PartnerWalletScreen(
    onGoToSettings: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        PartnerHeader()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Bank Link Section Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(CircleShape)
                            .background(SpaceNavy),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("🏛️", fontSize = 24.sp)
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text("Link Bank Account to Withdraw", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                    Text("Add your bank details to start withdrawing earnings", fontSize = 13.sp, color = MutedText, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp, bottom = 16.dp))
                    OutlinedButton(
                        onClick = onGoToSettings,
                        border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.4f)),
                        colors = ButtonDefaults.outlinedButtonColors(containerColor = OrbitCyanBg.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text("⚙️ Go to Settings", color = OrbitCyan, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }
                }
            }

            // Earnings Summary Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(OrbitGreen.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("👛", fontSize = 16.sp)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("Earnings", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = White)
                        Text("Income summary", fontSize = 12.sp, color = MutedText)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("TOTAL EARNED", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Row(
                        verticalAlignment = Alignment.Bottom,
                        modifier = Modifier.padding(top = 4.dp)
                    ) {
                        Text("₹", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = OrbitGreen)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("0", fontSize = 44.sp, fontWeight = FontWeight.Black, color = White)
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    // Month
                    Surface(
                        color = OrbitPurpleBg,
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, OrbitPurple.copy(alpha = 0.2f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("📅", fontSize = 12.sp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("MONTH", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("₹0", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = OrbitPurple)
                        }
                    }

                    // Week
                    Surface(
                        color = OrbitCyanBg,
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.2f)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("⏱️", fontSize = 12.sp)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("WEEK", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            }
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("₹0", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = OrbitCyan)
                        }
                    }
                }
            }

            // Stats 2x2 Grid
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                GlassCard(modifier = Modifier.weight(1f).height(100.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("✓", color = OrbitGreen, fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("DONE", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("0", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = OrbitGreen, modifier = Modifier.padding(top = 8.dp))
                }

                GlassCard(modifier = Modifier.weight(1f).height(100.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("⭐", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("RATING", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("-", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEAB308), modifier = Modifier.padding(top = 8.dp))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                GlassCard(modifier = Modifier.weight(1f).height(100.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("⏱️", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("WEEK", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("₹0", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = OrbitCyan, modifier = Modifier.padding(top = 8.dp))
                }

                GlassCard(modifier = Modifier.weight(1f).height(100.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("📊", fontSize = 14.sp)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("AVG", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("₹0", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = OrbitPurple, modifier = Modifier.padding(top = 8.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Income Breakdown Card
            GlassCard {
                Text("BREAKDOWN", color = White, fontSize = 13.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(16.dp))

                val items = listOf(
                    Triple("Lifetime", "₹0", OrbitGreen),
                    Triple("This Month", "₹0", OrbitPurple),
                    Triple("This Week", "₹0", OrbitCyan),
                    Triple("Avg/Project", "₹0", Color(0xFFEAB308))
                )

                items.forEach { (label, value, color) ->
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(label, color = MutedText, fontSize = 13.sp)
                        Text(value, color = color, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

// ─── Screen 5: Partner Profile ───────────────────────────────────────────────

@Composable
fun PartnerProfileScreen(
    onLogout: () -> Unit = {}
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        PartnerHeader()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // User Info Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .background(Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("👤", fontSize = 28.sp)
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("utkarsh gupta", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = White)
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(color = OrbitGreen.copy(alpha = 0.15f), shape = RoundedCornerShape(12.dp)) {
                                    Text("✓ Verified", color = OrbitGreen, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                            }
                            Text("utkarshssg2608@gmail.com", fontSize = 12.sp, color = MutedText, modifier = Modifier.padding(vertical = 2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Surface(color = OrbitPurpleBg, shape = RoundedCornerShape(4.dp)) {
                                    Text("PARTNER", color = OrbitPurple, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                                Surface(color = OrbitGreen.copy(alpha = 0.15f), shape = RoundedCornerShape(4.dp)) {
                                    Text("● Online", color = OrbitGreen, fontSize = 9.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                                }
                            }
                        }
                    }

                    Surface(
                        color = SpaceNavy,
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.clickable { }
                    ) {
                        Text("✏️ Edit", color = MutedText, fontSize = 11.sp, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Wallet Balance Box
                Surface(
                    color = OrbitCyanBg.copy(alpha = 0.4f),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("👛", fontSize = 20.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text("WALLET BALANCE", color = OrbitCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                            Text("₹0", fontSize = 20.sp, fontWeight = FontWeight.Black, color = White)
                        }
                    }
                }
            }

            // Stats 3-Grid
            Row(modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                listOf(
                    Triple("📷", "0", "SHOOTS"),
                    Triple("⏱️", "0", "ACTIVE"),
                    Triple("⭐", "0", "DONE")
                ).forEach { (icon, count, label) ->
                    GlassCard(modifier = Modifier.weight(1f)) {
                        Column(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Text(icon, fontSize = 16.sp)
                            Text(count, fontSize = 20.sp, fontWeight = FontWeight.Black, color = White, modifier = Modifier.padding(vertical = 2.dp))
                            Text(label, fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                        }
                    }
                }
            }

            // Bank Account Section
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Text("BANK ACCOUNT", color = OrbitPurple, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(12.dp))
                OutlinedButton(
                    onClick = { },
                    border = BorderStroke(1.dp, OrbitPurple.copy(alpha = 0.4f)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth().height(46.dp)
                ) {
                    Text("+ Link Bank Account", color = OrbitPurple, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }

            // Settings & Logout
            GlassCard {
                Column(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("🛡️ Privacy Shield", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = White)
                        Text("›", fontSize = 18.sp, color = MutedText)
                    }
                    Divider(color = OrbitBorder)
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("⚙️ App Settings", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = White)
                        Text("›", fontSize = 18.sp, color = MutedText)
                    }
                    Divider(color = OrbitBorder)
                    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Text("❓ Help & Support", fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = White)
                        Text("›", fontSize = 18.sp, color = MutedText)
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Logout Button
            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = Destructive.copy(alpha = 0.15f)),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.fillMaxWidth().height(48.dp)
            ) {
                Text("🚪 Log Out", color = Destructive, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }
    }
}

// ─── Active Workflow Screens (Map, Camera, Sync) ────────────────────────────

@Composable
fun MapNavigationScreen(onStartShooting: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        Text("En Route to Location", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = White)
        Text("Destination: Bandra West, Plot 42, Mumbai", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(top = 2.dp, bottom = 16.dp))

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(SpaceNavyLight)
                .border(1.dp, OrbitBorder, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🗺️ GPS Navigation Route Active", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("Turn-by-turn route to client shoot location", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        GlassCard {
            Text("Client: Creative Brand Studio", fontWeight = FontWeight.Bold, color = White)
            Text("Address: Bandra West, Hill Road, Near Metro Gate 2", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(vertical = 4.dp))

            Spacer(modifier = Modifier.height(16.dp))

            GradientButton(
                text = "Arrived at Location & Start Shoot →",
                onClick = onStartShooting,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

@Composable
fun CameraScreen(onCompleteShoot: () -> Unit) {
    var isRecording by remember { mutableStateOf(false) }
    var clipCount by remember { mutableIntStateOf(3) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        Text("Camera Viewfinder Preview (1080p 60fps)", color = Color.White.copy(alpha = 0.6f), fontSize = 14.sp, modifier = Modifier.align(Alignment.Center))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                onClick = {
                    isRecording = !isRecording
                    if (!isRecording) clipCount++
                },
                colors = ButtonDefaults.buttonColors(containerColor = if (isRecording) Destructive else White),
                modifier = Modifier.size(72.dp),
                shape = CircleShape
            ) {}

            Spacer(modifier = Modifier.height(20.dp))

            if (clipCount > 0) {
                GradientButton(
                    text = "Finish Shoot & Sync Footage →",
                    onClick = onCompleteShoot,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

@Composable
fun VideoSyncScreen(onSyncFinish: () -> Unit) {
    var progress by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        while (progress < 1f) {
            kotlinx.coroutines.delay(150)
            progress += 0.05f
        }
        onSyncFinish()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("Syncing Raw Shoot Footage", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = White)
            Text("Resumable multipart upload to Orbit Storage", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 28.dp))

            LinearProgressIndicator(
                progress = { progress },
                color = OrbitPurple,
                trackColor = OrbitBorder,
                modifier = Modifier.fillMaxWidth().height(14.dp).clip(RoundedCornerShape(7.dp))
            )

            Text("${(progress * 100).toInt()}% Sync Complete", color = OrbitGreen, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 16.dp))
        }
    }
}
