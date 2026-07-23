package com.orbitlogic.partner.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import com.orbitlogic.core.ui.*

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
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.height(50.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    if (enabled) Brush.linearGradient(listOf(OrbitPurple, OrbitCyan))
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

// ─── Screen 1: Partner Login ─────────────────────────────────────────────────

@Composable
fun PartnerLoginScreen(onLoginSuccess: (String) -> Unit) {
    var emailOrPhone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var step by remember { mutableIntStateOf(1) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth().verticalScroll(rememberScrollState())
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(OrbitPurple, OrbitCyan))),
                contentAlignment = Alignment.Center
            ) {
                Text("P", fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color.White)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text("ORBIT PARTNER", fontSize = 32.sp, fontWeight = FontWeight.ExtraBold, color = OrbitPurple, letterSpacing = 4.sp)
            Text("Videographer & Creator Portal", fontSize = 14.sp, color = MutedText, modifier = Modifier.padding(bottom = 32.dp))

            GlassCard {
                if (step == 1) {
                    Text("Partner Sign In", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Enter your registered partner email or mobile number", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(bottom = 20.dp))

                    OutlinedTextField(
                        value = emailOrPhone,
                        onValueChange = { emailOrPhone = it },
                        label = { Text("Partner Email / Phone") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitPurple)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    GradientButton(
                        text = "Request Partner OTP",
                        onClick = {
                            if (emailOrPhone.isNotBlank()) step = 2
                            else errorMessage = "Enter valid mobile/email"
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Text("Verify Partner OTP", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("OTP sent to $emailOrPhone", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(bottom = 20.dp))

                    OutlinedTextField(
                        value = otp,
                        onValueChange = { otp = it },
                        label = { Text("6-Digit Partner OTP") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitPurple)
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    GradientButton(
                        text = "Verify & Open Studio",
                        onClick = { onLoginSuccess("partner_token_909") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

// ─── Screen 2: Partner Dashboard & Dispatch Alerts ───────────────────────────

@Composable
fun PartnerDashboardScreen(
    onAcceptDispatch: (String) -> Unit,
    onNavigateToWork: () -> Unit
) {
    var isOnline by remember { mutableStateOf(true) }
    var activeDispatchId by remember { mutableStateOf<String?>("booking-dispatch-101") }
    var countdownSeconds by remember { mutableIntStateOf(30) }

    LaunchedEffect(activeDispatchId) {
        if (activeDispatchId != null) {
            countdownSeconds = 30
            while (countdownSeconds > 0) {
                kotlinx.coroutines.delay(1000)
                countdownSeconds--
            }
            if (countdownSeconds == 0) {
                activeDispatchId = null
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Partner Header with Availability Switch
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Partner Studio", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text(
                    text = if (isOnline) "🟢 ONLINE - Receiving Dispatches" else "🔴 OFFLINE",
                    color = if (isOnline) OrbitCyan else MutedText,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Switch(
                checked = isOnline,
                onCheckedChange = { isOnline = it },
                colors = SwitchDefaults.colors(checkedThumbColor = OrbitCyan, checkedTrackColor = OrbitPurple)
            )
        }

        // Incoming Dispatch Request Alert Card
        if (isOnline && activeDispatchId != null) {
            GlassCard(borderColor = OrbitPurple) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("⚡ NEW SHOOT DISPATCH ALERT", color = OrbitPurple, fontWeight = FontWeight.Black, fontSize = 12.sp, letterSpacing = 1.sp)
                    Surface(color = Destructive.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp)) {
                        Text("${countdownSeconds}s", color = Destructive, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text("UGC Brand Reel Shoot - Bandra West", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("Payout Fee: ₹1,500.00 • Distance: 2.4 KM away", color = OrbitCyan, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 4.dp))
                Text("Client: Creative Brand Studio • Slot: 10:00 AM Today", color = MutedText, fontSize = 12.sp)

                Spacer(modifier = Modifier.height(20.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = { activeDispatchId = null },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Decline", color = Color.White)
                    }

                    Button(
                        onClick = { 
                            onAcceptDispatch(activeDispatchId!!)
                            onNavigateToWork()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = OrbitCyan),
                        modifier = Modifier.weight(1.2f).height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Accept Shoot ✓", color = Color.Black, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Spacer(modifier = Modifier.height(20.dp))
        }

        // Daily Stats Overview
        Text("Today's Performance", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(bottom = 12.dp))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            GlassCard(modifier = Modifier.weight(1f)) {
                Text("Today Earnings", color = MutedText, fontSize = 12.sp)
                Text("₹4,500", fontSize = 22.sp, fontWeight = FontWeight.Black, color = OrbitCyan, modifier = Modifier.padding(top = 4.dp))
            }

            GlassCard(modifier = Modifier.weight(1f)) {
                Text("Shoots Completed", color = MutedText, fontSize = 12.sp)
                Text("3", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.White, modifier = Modifier.padding(top = 4.dp))
            }
        }
    }
}

// ─── Screen 3: Map Navigation & GPS Route ────────────────────────────────────

@Composable
fun MapNavigationScreen(onStartShooting: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "En Route to Location", subtitle = "Destination: Bandra West, Plot 42, Mumbai")

        // Map View Mock Placeholder
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(SpaceNavyLight)
                .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🗺️ Native GPS Navigation Map", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("Turn-by-turn route to client shoot location", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        GlassCard {
            Text("Client: Creative Brand Studio", fontWeight = FontWeight.Bold, color = Color.White)
            Text("Address: Bandra West, Hill Road, Near Metro Gate 2", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(vertical = 4.dp))
            
            Spacer(modifier = Modifier.height(12.dp))

            GradientButton(
                text = "Arrived at Location & Start Shoot →",
                onClick = onStartShooting,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ─── Screen 4: Camera Recorder (CameraX Interface) ───────────────────────────

@Composable
fun CameraScreen(onCompleteShoot: () -> Unit) {
    var isRecording by remember { mutableStateOf(false) }
    var clipCount by remember { mutableIntStateOf(3) }
    var seconds by remember { mutableIntStateOf(0) }

    LaunchedEffect(isRecording) {
        if (isRecording) {
            while (isRecording) {
                kotlinx.coroutines.delay(1000)
                seconds++
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // Camera viewfinder overlay text
        Text("Camera Viewfinder Preview (1080p 60fps)", color = Color.White.copy(alpha = 0.6f), fontSize = 14.sp, modifier = Modifier.align(Alignment.Center))

        // Top bar stats
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp)
                .align(Alignment.TopCenter),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(color = Color.Black.copy(alpha = 0.6f), shape = RoundedCornerShape(20.dp)) {
                Text("Clips Recorded: $clipCount/10", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
            }

            if (isRecording) {
                Surface(color = Destructive.copy(alpha = 0.8f), shape = RoundedCornerShape(20.dp)) {
                    Text("REC ${String.format("%02d:%02d", seconds / 60, seconds % 60)}", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp))
                }
            }
        }

        // Bottom Record Control Bar
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = {
                        isRecording = !isRecording
                        if (!isRecording) clipCount++
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = if (isRecording) Destructive else Color.White),
                    modifier = Modifier.size(72.dp),
                    shape = CircleShape
                ) {}
            }

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

// ─── Screen 5: Video Sync Upload Progress ────────────────────────────────────

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
            Text("Uploading Raw Shoot Clips", fontWeight = FontWeight.ExtraBold, fontSize = 22.sp, color = Color.White)
            Text("Resumable multipart upload to Orbit S3 Storage", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(top = 4.dp, bottom = 28.dp))

            LinearProgressIndicator(
                progress = { progress },
                color = OrbitPurple,
                trackColor = OrbitBorder,
                modifier = Modifier.fillMaxWidth().height(14.dp).clip(RoundedCornerShape(7.dp))
            )

            Text("${(progress * 100).toInt()}% Uploaded (14.2 MB/s)", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 16.sp, modifier = Modifier.padding(top = 16.dp))
            Text("DO NOT close app during sync", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
        }
    }
}

// ─── Screen 6: Partner Wallet & Payouts ──────────────────────────────────────

@Composable
fun PartnerWalletScreen() {
    var withdrawalAmount by remember { mutableStateOf("4500") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        OrbitHeader(title = "Partner Earnings Center", subtitle = "Track balance and withdraw instant bank payouts")

        GlassCard(borderColor = OrbitCyan) {
            Text("Available Balance", color = MutedText, fontSize = 13.sp)
            Text("₹24,500.00", fontSize = 36.sp, fontWeight = FontWeight.Black, color = Color.White, modifier = Modifier.padding(vertical = 4.dp))
            Text("Pending Clearance: ₹4,000.00", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
        }

        Spacer(modifier = Modifier.height(20.dp))

        GlassCard {
            Text("Instant Payout to Bank", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Text("Linked Account: HDFC Bank (•••• 4921)", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(bottom = 16.dp))

            OutlinedTextField(
                value = withdrawalAmount,
                onValueChange = { withdrawalAmount = it },
                label = { Text("Withdrawal Amount (₹)") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(20.dp))

            GradientButton(
                text = "Initiate Instant Payout",
                onClick = {},
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ─── Screen 7: Partner Profile & Verification ────────────────────────────────

@Composable
fun PartnerProfileScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        OrbitHeader(title = "Partner Portfolio", subtitle = "Verification status & device settings")

        GlassCard {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Alex Rivera", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Verified Orbit Creator", color = MutedText, fontSize = 12.sp)
                }

                Surface(color = OrbitCyan.copy(alpha = 0.2f), shape = RoundedCornerShape(20.dp)) {
                    Text("VERIFIED ✓", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                }
            }

            Divider(modifier = Modifier.padding(vertical = 16.dp), color = OrbitBorder)

            Text("Star Rating: 4.9 ★ (84 Shoots Completed)", color = Color.White, fontSize = 14.sp)
            Text("Primary Gear: iPhone 15 Pro Max + DJi Osmo Gimbal", color = Color.White, fontSize = 14.sp, modifier = Modifier.padding(vertical = 6.dp))
            Text("Location Base: Bandra West, Mumbai", color = Color.White, fontSize = 14.sp)
        }
    }
}

