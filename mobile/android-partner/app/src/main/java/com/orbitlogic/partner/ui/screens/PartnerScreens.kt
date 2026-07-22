package com.orbitlogic.partner.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbitlogic.partner.ui.theme.*

// ─── Custom UI Reusable Components ───────────────────────────────────────────

@Composable
fun GradientButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
        contentPadding = PaddingValues(),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier.height(50.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))
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
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
        shape = RoundedCornerShape(12.dp),
        modifier = modifier
            .fillMaxWidth()
            .border(1.dp, OrbitBorder, RoundedCornerShape(12.dp))
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
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
                color = MutedText
            )
        }
    }
}

// ─── Screen: Partner Dashboard ───────────────────────────────────────────────

@Composable
fun PartnerDashboardScreen(
    onAcceptDispatch: (String) -> Unit,
    onNavigateToWork: () -> Unit
) {
    var isOnline by remember { mutableStateOf(true) }
    var activeDispatchId by remember { mutableStateOf<String?>("booking-dispatch-1") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            OrbitHeader(title = "Partner Studio", subtitle = "Manage dispatches & shoots")
            Switch(
                checked = isOnline,
                onCheckedChange = { isOnline = it },
                colors = SwitchDefaults.colors(checkedThumbColor = OrbitCyan)
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (isOnline && activeDispatchId != null) {
            Text("NEW DISPATCH REQUEST", color = OrbitPurple, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.padding(bottom = 8.dp))
            
            GlassCard {
                Text("Client Location: Bandra West, Mumbai", color = Color.White, fontWeight = FontWeight.Bold)
                Text("Date & Time: 22 July, 12:00 PM", color = MutedText, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Button(
                        onClick = { activeDispatchId = null },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Decline")
                    }

                    Button(
                        onClick = { 
                            onAcceptDispatch(activeDispatchId!!)
                            onNavigateToWork()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = OrbitCyan),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Accept", color = Color.Black)
                    }
                }
            }
        } else {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Waiting for shoot dispatches...", color = MutedText)
            }
        }
    }
}

// ─── Screen: Map Navigation & Actions ────────────────────────────────────────

@Composable
fun MapNavigationScreen(onStartShooting: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "En Route to Client", subtitle = "Navigate to shoot location")

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f)
                .background(SpaceNavyLighter)
                .border(1.dp, OrbitBorder)
        ) {
            // Google Maps SDK View would go here
            Text("GPS Location Map Interface", color = MutedText, modifier = Modifier.align(Alignment.Center))
        }

        Spacer(modifier = Modifier.height(16.dp))

        GradientButton(
            text = "Arrived & Start Shooting",
            onClick = onStartShooting,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

// ─── Screen: Camera (CameraX Preview & Capture) ──────────────────────────────

@Composable
fun CameraScreen(onCompleteShoot: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        // CameraX Preview View would go here in Android
        Text("Camera viewfinder", color = Color.White, modifier = Modifier.align(Alignment.Center))

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .align(Alignment.BottomCenter)
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Button(
                onClick = onCompleteShoot,
                colors = ButtonDefaults.buttonColors(containerColor = Destructive),
                modifier = Modifier.size(70.dp),
                shape = RoundedCornerShape(35.dp)
            ) {
                // Record Button icon
            }
            Text("Record Footage", color = Color.White, modifier = Modifier.padding(top = 8.dp))
        }
    }
}

// ─── Screen: Video Sync Upload Progress ──────────────────────────────────────

@Composable
fun VideoSyncScreen(onSyncFinish: () -> Unit) {
    var progress by remember { mutableFloatStateOf(0f) }

    LaunchedEffect(Unit) {
        while (progress < 1f) {
            kotlinx.coroutines.delay(100)
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
            Text("Uploading Shoot Footage", fontWeight = FontWeight.Bold, fontSize = 20.sp, color = Color.White)
            Text("DO NOT close the app during background sync", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(bottom = 24.dp))

            LinearProgressIndicator(
                progress = { progress },
                color = OrbitPurple,
                trackColor = OrbitBorder,
                modifier = Modifier.fillMaxWidth().height(12.dp)
            )

            Text("${(progress * 100).toInt()}% Sync Completed", color = OrbitCyan, modifier = Modifier.padding(top = 16.dp))
        }
    }
}

// ─── Screen: Partner Profile ─────────────────────────────────────────────────

@Composable
fun PartnerProfileScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Partner Portfolio", subtitle = "Verify stats and devices")

        GlassCard {
            Text("Verification status: VERIFIED", color = OrbitCyan, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(12.dp))
            Text("Rating: 4.9 ★", color = Color.White)
            Text("Completed Shoots: 48", color = Color.White)
            Text("Active device: iPhone 15 Pro Max", color = MutedText)
        }
    }
}

// ─── Screen: Partner Wallet & Payouts ────────────────────────────────────────

@Composable
fun PartnerWalletScreen() {
    var amount by remember { mutableStateOf("5000") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Earning Center", subtitle = "Track balance and withdraw payouts")

        GlassCard {
            Text("Available Balance", color = MutedText)
            Text("₹24,500.00", fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color.White)
            Text("Pending clearance: ₹4,000", color = MutedText, fontSize = 12.sp)
        }

        Spacer(modifier = Modifier.height(20.dp))

        GlassCard {
            Text("Bank Payout", fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = amount,
                onValueChange = { amount = it },
                label = { Text("Withdrawal Amount") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(16.dp))

            GradientButton(
                text = "Initiate instant Payout",
                onClick = {},
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
