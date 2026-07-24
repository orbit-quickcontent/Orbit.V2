package com.orbitlogic.client.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import com.orbitlogic.client.ui.theme.*

// ─── Reusable Design Tokens & Components ─────────────────────────────────────

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
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.height(50.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (enabled) Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))
                    else Brush.linearGradient(listOf(Color.DarkGray, Color.Gray))
                ),
            contentAlignment = Alignment.Center
        ) {
            Text(text = text, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
fun GlassCard(
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
fun OrbitHeader(title: String, subtitle: String? = null) {
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

// ─── TopAppBar (Shared Navigation Header) ────────────────────────────────────

@Composable
fun ClientTopAppBar(
    userName: String = "Test User",
    userInitials: String = "TU",
    roleBadge: String = "CREATOR",
    onSearchClick: () -> Unit = {},
    onNotifClick: () -> Unit = {},
    onProfileClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SpaceNavy)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(modifier = Modifier.clickable { onProfileClick() }) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(SpaceNavyLight)
                        .border(1.dp, OrbitBorder, CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = userInitials,
                        color = OrbitCyan,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF00FF85))
                        .border(2.dp, SpaceNavy, CircleShape)
                        .align(Alignment.BottomEnd)
                )
            }
            Column {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = "GOOD AFTERNOON",
                        color = MutedText,
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    Surface(
                        color = OrbitPurple.copy(alpha = 0.25f),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = "🎁 $roleBadge",
                            color = Color(0xFFE498FF),
                            fontSize = 8.sp,
                            fontWeight = FontWeight.ExtraBold,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }
                Text(
                    text = "Hi, $userName",
                    color = OrbitCyan,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onSearchClick) {
                Text("🔍", fontSize = 16.sp)
            }
            Box {
                IconButton(onClick = onNotifClick) {
                    Text("🔔", fontSize = 16.sp)
                }
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(OrbitCyan)
                        .align(Alignment.TopEnd)
                        .offset(x = (-4).dp, y = 4.dp)
                )
            }
            IconButton(onClick = onProfileClick) {
                Text("▾", color = Color.White, fontSize = 14.sp)
            }
        }
    }
}

// ─── Screen 1: Login & Onboarding ─────────────────────────────────────────────

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var selectedPersona by remember { mutableStateOf("Creator") }
    var avatarMode by remember { mutableStateOf("Avatar") } // Avatar or Photo
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val personas = listOf("Creator", "Professional", "Artist", "Explorer", "Visionary")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .padding(20.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(16.dp))

        // App Branding Header
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))),
                contentAlignment = Alignment.Center
            ) {
                Text("O", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
            }
            Text("ORBIT", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color(0xFF3B82F6), letterSpacing = 2.sp)
        }

        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            color = Color(0xFF083344).copy(alpha = 0.4f),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF164E63).copy(alpha = 0.5f))
        ) {
            Text("Client Account", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp))
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Hero Headline
        Text(
            text = "Join the Orbit",
            fontSize = 32.sp,
            fontWeight = FontWeight.ExtraBold,
            color = Color.White
        )
        Text(
            text = "Sign in or create your account to get started",
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.6f),
            modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
        )

        // Social Sign-In Buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = { onLoginSuccess("google_auth_token") },
                colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("G  Google", color = Color.Black, fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = { onLoginSuccess("apple_auth_token") },
                colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF27272A)),
                modifier = Modifier.weight(1f).height(48.dp)
            ) {
                Text("  Apple", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }

        // Divider
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 24.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Divider(modifier = Modifier.weight(1f), color = Color(0xFF27272A))
            Text("OR EMAIL", color = Color(0xFF71717A), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Divider(modifier = Modifier.weight(1f), color = Color(0xFF27272A))
        }

        // Profile Picture Persona Selector Container
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF09090B)),
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF18181B)),
            modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("CHOOSE YOUR PROFILE PICTURE", color = Color(0xFF93C5FD).copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                Spacer(modifier = Modifier.height(16.dp))

                // Avatar Main Preview
                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF27272A))
                        .border(4.dp, Color(0xFF3F3F46), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = if (selectedPersona == "Creator") "👨🏻‍🦱" else if (selectedPersona == "Professional") "👨🏽‍💼" else if (selectedPersona == "Artist") "👩🏽‍🎨" else "🧑🏻‍🚀",
                        fontSize = 44.sp
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Avatar / Photo Toggle
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(Color(0xFF18181B))
                        .padding(4.dp)
                ) {
                    Surface(
                        color = if (avatarMode == "Avatar") Color(0xFF3F3F46) else Color.Transparent,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.clickable { avatarMode = "Avatar" }
                    ) {
                        Text("👤 Avatar", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp))
                    }
                    Surface(
                        color = if (avatarMode == "Photo") Color(0xFF3F3F46) else Color.Transparent,
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier.clickable { avatarMode = "Photo" }
                    ) {
                        Text("🖼 Photo", color = Color(0xFF71717A), fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp))
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Persona Grid
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(personas) { persona ->
                        val isSelected = persona == selectedPersona
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .background(if (isSelected) Color(0xFF27272A) else Color(0xFF18181B).copy(alpha = 0.5f))
                                .border(1.dp, if (isSelected) Color(0xFFEF4444) else Color.Transparent, RoundedCornerShape(16.dp))
                                .clickable { selectedPersona = persona }
                                .padding(10.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF27272A)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = when(persona) {
                                        "Creator" -> "👨🏻‍🦱"
                                        "Professional" -> "👨🏽‍💼"
                                        "Artist" -> "👩🏽‍🎨"
                                        "Explorer" -> "🧑🏻‍🚀"
                                        else -> "👩🏻‍💼"
                                    },
                                    fontSize = 20.sp
                                )
                            }
                            Text(persona, color = if (isSelected) Color.White else Color(0xFF71717A), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }
        }

        // Onboarding Input Form
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF09090B)),
            shape = RoundedCornerShape(24.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF18181B)),
            modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Column {
                    Text("FULL NAME *", color = Color(0xFF93C5FD).copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    OutlinedTextField(
                        value = fullName,
                        onValueChange = { fullName = it },
                        placeholder = { Text("Enter your name", color = Color(0xFF52525B)) },
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrbitCyan,
                            unfocusedBorderColor = Color(0xFF27272A),
                            focusedContainerColor = Color(0xFF111111),
                            unfocusedContainerColor = Color(0xFF111111)
                        )
                    )
                }

                Column {
                    Text("EMAIL ADDRESS *", color = Color(0xFF93C5FD).copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        placeholder = { Text("you@example.com", color = Color(0xFF52525B)) },
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrbitCyan,
                            unfocusedBorderColor = Color(0xFF27272A),
                            focusedContainerColor = Color(0xFF111111),
                            unfocusedContainerColor = Color(0xFF111111)
                        )
                    )
                }

                Column {
                    Text("PHONE", color = Color(0xFF93C5FD).copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 4.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(Color(0xFF111111))
                            .border(1.dp, Color(0xFF27272A), RoundedCornerShape(12.dp))
                            .padding(horizontal = 14.dp, vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("+91", color = Color(0xFF71717A), fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Divider(modifier = Modifier.height(20.dp).width(1.dp).padding(horizontal = 10.dp), color = Color(0xFF27272A))
                        BasicTextField(
                            value = phone,
                            onValueChange = { if (it.length <= 10) phone = it },
                            modifier = Modifier.weight(1f),
                            textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 14.sp),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                        )
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("India mobile numbers only", color = Color(0xFF52525B), fontSize = 10.sp)
                        Text("${phone.length}/10", color = Color(0xFF52525B), fontSize = 10.sp)
                    }
                }
            }
        }

        // Action Button
        Button(
            onClick = {
                if (email.isBlank() && phone.isBlank()) {
                    errorMessage = "Please enter valid email or phone."
                    return@Button
                }
                onLoginSuccess("session_token_client_${System.currentTimeMillis()}")
            },
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF09090B)),
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF27272A)),
            modifier = Modifier.fillMaxWidth().height(54.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("✉  Continue to Verify Email  →", color = Color(0xFFA1A1AA), fontWeight = FontWeight.Bold, fontSize = 14.sp)
            }
        }

        Text("You'll need to verify your email before continuing.", color = Color(0xFF60A5FA).copy(alpha = 0.4f), fontSize = 10.sp, modifier = Modifier.padding(top = 8.dp, bottom = 24.dp))
    }
}

// ─── Screen 2: Dashboard Home ────────────────────────────────────────────────

@Composable
fun DashboardHomeScreen(
    onNavigateToBooking: () -> Unit,
    onNavigateToPackages: () -> Unit,
    onNavigateToTracking: (String) -> Unit,
    onNavigateToProfile: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        ClientTopAppBar(
            onProfileClick = onNavigateToProfile,
            onSearchClick = onNavigateToPackages,
            onNotifClick = { onNavigateToTracking("bk_active_901") }
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // ─── Premium Editorial Brand Title ─────────────────────────────────
            Column(modifier = Modifier.padding(vertical = 12.dp)) {
                Text(
                    text = "Shoot",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White,
                    lineHeight = 36.sp
                )
                Text(
                    text = "In Progress.",
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Normal,
                    color = OrbitCyan,
                    lineHeight = 36.sp
                )
                Text(
                    text = "ORBIT V1.0.4 — PREMIUM ACCESS",
                    fontSize = 9.sp,
                    color = Color.White.copy(alpha = 0.3f),
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(top = 6.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // ─── 2x2 Quick Action Bento Cards ──────────────────────────────────
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    // BOOK NEW SHOOT
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(86.dp)
                            .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp))
                            .clickable { onNavigateToBooking() }
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.SpaceBetween) {
                            Box(
                                modifier = Modifier.size(28.dp).clip(CircleShape).background(OrbitCyan),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("+", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 16.sp)
                            }
                            Column {
                                Text("BOOK NEW SHOOT", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                                Text("INSTANT MATCHING", fontSize = 9.sp, color = OrbitCyan, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // TRACK ORDER
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(86.dp)
                            .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp))
                            .clickable { onNavigateToTracking("bk_active_901") }
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.SpaceBetween) {
                            Box(
                                modifier = Modifier.size(28.dp).clip(CircleShape).background(OrbitPurple),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("🌸", fontSize = 12.sp)
                            }
                            Column {
                                Text("TRACK ORDER", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                                Text("1 ACTIVE", fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    // RECENT PROJECTS
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(86.dp)
                            .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp))
                            .clickable { onNavigateToPackages() }
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.SpaceBetween) {
                            Box(
                                modifier = Modifier.size(28.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("📄", fontSize = 12.sp)
                            }
                            Column {
                                Text("RECENT PROJECTS", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                                Text("12 DELIVERED", fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // BRAND IDENTITY
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                        shape = RoundedCornerShape(16.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(86.dp)
                            .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp))
                            .clickable { onNavigateToProfile() }
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.SpaceBetween) {
                            Box(
                                modifier = Modifier.size(28.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("⭐", fontSize = 12.sp)
                            }
                            Column {
                                Text("BRAND IDENTITY", fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                                Text("ASSETS & DNA", fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // ─── Live Shoot Tracking Card ──────────────────────────────────────
            GlassCard(
                borderColor = OrbitCyan.copy(alpha = 0.5f),
                modifier = Modifier.clickable { onNavigateToTracking("bk_active_901") }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(OrbitCyan))
                            Text("LIVE SHOOT TRACKING", fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, color = Color.White, letterSpacing = 1.sp)
                        }
                        Text("Personalized in progress", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp, modifier = Modifier.padding(top = 2.dp))
                        Text("📍 Kartar Mansion, 35, Dr Dadasaheb B...", color = MutedText, fontSize = 11.sp)
                    }

                    Button(
                        onClick = { onNavigateToTracking("bk_active_901") },
                        colors = ButtonDefaults.buttonColors(containerColor = OrbitCyan),
                        shape = RoundedCornerShape(20.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp)
                    ) {
                        Text("Track →", color = Color.Black, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Featured Packages Section ─────────────────────────────────────
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("⚡ Featured Packages", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                Text("View All >", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { onNavigateToPackages() })
            }

            LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier
                            .width(260.dp)
                            .border(1.dp, OrbitBorder, RoundedCornerShape(20.dp))
                            .padding(16.dp)
                    ) {
                        Column {
                            Text("Personalized", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("60-120 mins delivery", color = MutedText, fontSize = 11.sp)
                            Text("₹1,999 /session", fontSize = 20.sp, fontWeight = FontWeight.ExtraBold, color = Color.White, modifier = Modifier.padding(vertical = 8.dp))
                            Text("✓ 1 cinematic reel (30-60s)", color = MutedText, fontSize = 12.sp)
                            Text("✓ Professional color grading", color = MutedText, fontSize = 12.sp)
                            Text("+3 more features", color = OrbitCyan, fontSize = 10.sp, modifier = Modifier.padding(top = 4.dp, bottom = 12.dp))
                            Button(
                                onClick = onNavigateToBooking,
                                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                                border = androidx.compose.foundation.BorderStroke(1.dp, OrbitBorder),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text("Book Now", color = Color.White, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Delivery Stats Banner ─────────────────────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0E0E0E)),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF222222)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
                    horizontalArrangement = Arrangement.SpaceAround,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("60MIN", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                        Text("DELIVERY", fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold)
                    }
                    Divider(modifier = Modifier.height(24.dp).width(1.dp), color = Color(0xFF222222))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("4K", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                        Text("QUALITY", fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold)
                    }
                    Divider(modifier = Modifier.height(24.dp).width(1.dp), color = Color(0xFF222222))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("500+", fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                        Text("PROJECTS", fontSize = 9.sp, color = MutedText, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Gradient Hero CTA Card ────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Brush.linearGradient(listOf(Color(0xFF6E208C), Color(0xFF00D2FF))))
                    .padding(20.dp)
            ) {
                Column {
                    Text("Ready to Create Something Cinematic?", fontSize = 18.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                    Text("Professional speed-graded custom reels delivered back inside 60 minutes.", fontSize = 12.sp, color = Color.White.copy(alpha = 0.9f), modifier = Modifier.padding(top = 6.dp, bottom = 16.dp))

                    Button(
                        onClick = onNavigateToBooking,
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        Text("⚡  Book a Session", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Booking History Section ───────────────────────────────────────
            Text("🕐 Booking History", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp, modifier = Modifier.padding(bottom = 12.dp))

            GlassCard {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("Personalized  •  Jul 1, 2026", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                        Text("Kartar Mansion, 35, Dr Dadasaheb B...", color = MutedText, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
                        Text("• Partner Salary: ₹700 (Paid)", color = Color(0xFF47D6FF), fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                    }

                    Surface(color = Color(0xFF064E3B), shape = RoundedCornerShape(12.dp)) {
                        Text("DELIVERED", color = Color(0xFF34D399), fontSize = 9.sp, fontWeight = FontWeight.ExtraBold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp))
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

// ─── Screen 3: Packages Selection ─────────────────────────────────────────────

@Composable
fun PackagesScreen(onSelectPackage: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        ClientTopAppBar()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Choose Your Package Pill Tag
            Surface(
                color = SpaceNavyLight,
                shape = RoundedCornerShape(4.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f))
            ) {
                Text(
                    text = "CHOOSE YOUR PACKAGE",
                    color = OrbitCyan,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 2.sp,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Hero Headline
            Text(
                text = "The Orbit Edge.",
                fontSize = 32.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )

            Text(
                text = "Select the package that fits your needs. Both include professional express editing delivered in 60-120 minutes.",
                fontSize = 13.sp,
                color = MutedText,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp, bottom = 24.dp)
            )

            // Bento Grid Card 1: Personalized
            Card(
                colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                shape = RoundedCornerShape(24.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, OrbitBorder),
                modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp)
            ) {
                Column(modifier = Modifier.padding(24.dp)) {
                    Text("Personalized", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Individual creators, personal events", color = MutedText, fontSize = 13.sp)

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("₹1,999", fontSize = 36.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
                        Text(" /session", color = MutedText, fontSize = 14.sp, modifier = Modifier.padding(bottom = 4.dp))
                    }

                    Divider(modifier = Modifier.padding(vertical = 16.dp), color = OrbitBorder.copy(alpha = 0.4f))

                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                            Text("1 cinematic reel (30-60 sec)", color = MutedText, fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                            Text("Professional color grading", color = MutedText, fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                            Text("Background score licensing", color = MutedText, fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                            Text("Same-day delivery (60-90 mins)", color = MutedText, fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                            Text("1 revision round", color = MutedText, fontSize = 13.sp)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                            Text("Ideal for active content creators", color = MutedText, fontSize = 13.sp)
                        }
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { onSelectPackage("pkg-personalized") },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        border = androidx.compose.foundation.BorderStroke(1.dp, OrbitBorder),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth().height(48.dp)
                    ) {
                        Text("Book Now", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Bento Grid Card 2: Professional (UGC) - Most Popular
            Card(
                colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                shape = RoundedCornerShape(24.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.5f)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
            ) {
                Box {
                    Surface(
                        color = Color(0xFFEDB1FF),
                        shape = RoundedCornerShape(bottomStart = 16.dp),
                        modifier = Modifier.align(Alignment.TopEnd)
                    ) {
                        Text(
                            text = "MOST POPULAR",
                            color = Color(0xFF520070),
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                        )
                    }

                    Column(modifier = Modifier.padding(24.dp)) {
                        Text("Professional (UGC)", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Brands, businesses, template creators", color = MutedText, fontSize = 13.sp)

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(verticalAlignment = Alignment.Bottom) {
                            Text("₹4,999", fontSize = 36.sp, fontWeight = FontWeight.ExtraBold, color = OrbitCyan)
                            Text(" /session", color = MutedText, fontSize = 14.sp, modifier = Modifier.padding(bottom = 4.dp))
                        }

                        Divider(modifier = Modifier.padding(vertical = 16.dp), color = OrbitBorder.copy(alpha = 0.4f))

                        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("3 cinematic reels (30-60 sec each)", color = MutedText, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("Brand DNA integration (logo, palette, font)", color = MutedText, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("Professional color grading & stabilization", color = MutedText, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("Licensed premium sound scores", color = MutedText, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("Same-day express delivery (90-120 mins)", color = MutedText, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("2 revision rounds with master editor", color = MutedText, fontSize = 13.sp)
                            }
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold)
                                Text("Dedicated creator-editor sync", color = MutedText, fontSize = 13.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(24.dp))

                        GradientButton(
                            text = "Book Now",
                            onClick = { onSelectPackage("pkg-professional") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }

            // Trust Badges Section
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0E0E0E)),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF222222)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("🛡", fontSize = 14.sp)
                        Text("All videographers on the Orbit network match certified filming standards.", color = MutedText, fontSize = 11.sp, textAlign = TextAlign.Center)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("🔒", fontSize = 14.sp)
                        Text("PCI compliance mock checkout secure links.", color = MutedText, fontSize = 11.sp, textAlign = TextAlign.Center)
                    }
                }
            }
        }
    }
}

// ─── Screen 4: Booking Flow Wizard ───────────────────────────────────────────

@Composable
fun BookingFlowScreen(packageId: String, onBookingComplete: () -> Unit) {
    var shootDate by remember { mutableStateOf("2026-08-01") }
    var timeSlot by remember { mutableStateOf("10:00 AM - 12:00 PM") }
    var locationAddress by remember { mutableStateOf("") }
    var specialNotes by remember { mutableStateOf("") }
    var step by remember { mutableIntStateOf(1) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        ClientTopAppBar()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            OrbitHeader(title = "Configure Shoot Booking", subtitle = "Tier: ${packageId.uppercase()}")

            if (step == 1) {
                GlassCard {
                    Text("1. Shoot Schedule & Slot", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = shootDate,
                        onValueChange = { shootDate = it },
                        label = { Text("Shoot Date (YYYY-MM-DD)") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = timeSlot,
                        onValueChange = { timeSlot = it },
                        label = { Text("Preferred Time Slot") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Text("2. Location Details", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = locationAddress,
                        onValueChange = { locationAddress = it },
                        label = { Text("Complete Location Address") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = specialNotes,
                        onValueChange = { specialNotes = it },
                        label = { Text("Instructions for Partner / Editor (Optional)") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    GradientButton(
                        text = "Proceed to Payment Review →",
                        onClick = { step = 2 },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            } else {
                GlassCard {
                    Text("Order & Payment Summary", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = OrbitBorder)

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Selected Tier", color = MutedText)
                        Text(packageId.uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Shoot Date", color = MutedText)
                        Text(shootDate, color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Time Slot", color = MutedText)
                        Text(timeSlot, color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Location", color = MutedText)
                        Text(if (locationAddress.isBlank()) "Default Studio Address" else locationAddress, color = Color.White)
                    }

                    Divider(modifier = Modifier.padding(vertical = 16.dp), color = OrbitBorder)

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total Price", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("₹4,999.00", fontSize = 22.sp, fontWeight = FontWeight.Black, color = OrbitCyan)
                    }

                    Spacer(modifier = Modifier.height(24.dp))

                    GradientButton(
                        text = "Pay & Confirm Booking",
                        onClick = onBookingComplete,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    Text(
                        text = "← Modify Booking Details",
                        color = MutedText,
                        fontSize = 14.sp,
                        modifier = Modifier.clickable { step = 1 }.align(Alignment.CenterHorizontally)
                    )
                }
            }
        }
    }
}

// ─── Screen 5: Live Shoot Tracker ────────────────────────────────────────────

@Composable
fun TrackingScreen(bookingId: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        ClientTopAppBar()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            OrbitHeader(title = "Live Shoot Tracker", subtitle = "Tracking Booking ID: $bookingId")

            GlassCard(borderColor = OrbitCyan) {
                Text("Current Status: SHOOTING IN PROGRESS", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = OrbitCyan)
                Text("Partner arrived at location and recording footage.", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 16.dp))

                LinearProgressIndicator(
                    progress = { 0.5f },
                    color = OrbitCyan,
                    trackColor = OrbitBorder,
                    modifier = Modifier.fillMaxWidth().height(10.dp).clip(RoundedCornerShape(5.dp))
                )

                Spacer(modifier = Modifier.height(20.dp))

                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("✓ ", color = OrbitCyan, fontWeight = FontWeight.Bold)
                        Text("Payment Confirmed", color = Color.White, fontSize = 14.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("✓ ", color = OrbitCyan, fontWeight = FontWeight.Bold)
                        Text("Partner Assigned & Dispatched", color = Color.White, fontSize = 14.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("• ", color = OrbitCyan, fontWeight = FontWeight.Bold)
                        Text("Shooting Footage (Active)", color = OrbitCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("◦ ", color = MutedText)
                        Text("Footage Sync to Cloud (Pending)", color = MutedText, fontSize = 14.sp)
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("◦ ", color = MutedText)
                        Text("Editor Delivery (Pending)", color = MutedText, fontSize = 14.sp)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            GlassCard {
                Text("Assigned Partner", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Spacer(modifier = Modifier.height(12.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(50.dp).clip(CircleShape).background(OrbitPurple),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("AR", color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    Spacer(modifier = Modifier.width(16.dp))

                    Column {
                        Text("Alex Rivera", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                        Text("Rating: 4.9 ★ (84 Shoots Completed)", color = MutedText, fontSize = 12.sp)
                        Text("Equipment: iPhone 15 Pro Max + Gimbal", color = OrbitCyan, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// ─── Screen 6: Profile & Account Settings ────────────────────────────────────

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        ClientTopAppBar()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(12.dp))

            // Profile Header Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Box(
                            modifier = Modifier
                                .size(90.dp)
                                .clip(CircleShape)
                                .background(Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("TU", fontSize = 36.sp, fontWeight = FontWeight.Black, color = Color.White)
                        }
                        Box(
                            modifier = Modifier
                                .size(16.dp)
                                .clip(CircleShape)
                                .background(Color(0xFF00FF85))
                                .border(3.dp, SpaceNavyLight, CircleShape)
                                .align(Alignment.BottomEnd)
                                .offset(x = (-4).dp, y = (-4).dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Text("Test User", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)

                    Row(
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Surface(
                            color = OrbitCyan.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(16.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f))
                        ) {
                            Text("🎬 CREATOR", color = OrbitCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                        }
                        Text("🎨 Creator Persona", color = MutedText, fontSize = 12.sp)
                    }

                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                        border = androidx.compose.foundation.BorderStroke(1.dp, OrbitCyan),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.height(34.dp)
                    ) {
                        Text("CLIENT MEMBERSHIP", color = OrbitCyan, fontSize = 10.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                    }
                }
            }

            // General Information Card
            GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("General Information", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.08f)),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                    ) {
                        Text("✏️ Edit", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Full Name", color = MutedText, fontSize = 13.sp)
                        Text("Test User", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Email Address", color = MutedText, fontSize = 13.sp)
                        Text("test@example.com", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Phone Number", color = MutedText, fontSize = 13.sp)
                        Text("+91 9876543210", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Creative Style Preset:", color = MutedText, fontSize = 13.sp)
                        Text("Creator", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }
                }
            }

            // Menu Settings Card
            GlassCard(modifier = Modifier.padding(bottom = 20.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(
                                modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(OrbitCyan.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) { Text("🛡", fontSize = 16.sp) }
                            Column {
                                Text("Privacy & Security", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text("Manage credentials & direct permissions", color = MutedText, fontSize = 11.sp)
                            }
                        }
                        Text("›", color = MutedText, fontSize = 20.sp)
                    }

                    Divider(color = OrbitBorder.copy(alpha = 0.3f))

                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(
                                modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(OrbitPurple.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) { Text("⚙️", fontSize = 16.sp) }
                            Column {
                                Text("App Settings", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text("Toggle notifications & sound fx", color = MutedText, fontSize = 11.sp)
                            }
                        }
                        Text("›", color = MutedText, fontSize = 20.sp)
                    }

                    Divider(color = OrbitBorder.copy(alpha = 0.3f))

                    Row(
                        modifier = Modifier.fillMaxWidth().clickable { },
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Box(
                                modifier = Modifier.size(38.dp).clip(RoundedCornerShape(10.dp)).background(Color.White.copy(alpha = 0.1f)),
                                contentAlignment = Alignment.Center
                            ) { Text("❓", fontSize = 16.sp) }
                            Column {
                                Text("Help & Support", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 14.sp)
                                Text("FAQs & support ticket logs", color = MutedText, fontSize = 11.sp)
                            }
                        }
                        Text("›", color = MutedText, fontSize = 20.sp)
                    }
                }
            }

            // Log Out Button
            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                border = androidx.compose.foundation.BorderStroke(1.dp, Destructive.copy(alpha = 0.4f)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🚪", fontSize = 14.sp)
                    Text("Log Out Profile", color = Destructive, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}
