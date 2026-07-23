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

// ─── Screen 1: Login & OTP Verification ─────────────────────────────────────

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    var emailOrPhone by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var step by remember { mutableIntStateOf(1) } // 1: Send OTP, 2: Verify OTP
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var timerSeconds by remember { mutableIntStateOf(30) }

    LaunchedEffect(step) {
        if (step == 2) {
            timerSeconds = 30
            while (timerSeconds > 0) {
                kotlinx.coroutines.delay(1000)
                timerSeconds--
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
        ) {
            // Brand Logo Header
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(Brush.linearGradient(listOf(OrbitCyan, OrbitPurple))),
                contentAlignment = Alignment.Center
            ) {
                Text("O", fontSize = 32.sp, fontWeight = FontWeight.Black, color = Color.White)
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "ORBIT",
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = OrbitCyan,
                letterSpacing = 6.sp
            )
            Text(
                text = "Cinematic UGC & Event Shoots",
                fontSize = 14.sp,
                color = MutedText,
                modifier = Modifier.padding(bottom = 32.dp)
            )

            errorMessage?.let { msg ->
                Surface(
                    color = Destructive.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                ) {
                    Text(
                        text = msg,
                        color = Destructive,
                        fontSize = 13.sp,
                        modifier = Modifier.padding(12.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }

            GlassCard {
                if (step == 1) {
                    Text("Client Sign In", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Enter your email or phone number to receive a secure OTP", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(bottom = 20.dp))

                    OutlinedTextField(
                        value = emailOrPhone,
                        onValueChange = { 
                            emailOrPhone = it
                            errorMessage = null 
                        },
                        label = { Text("Email or Mobile Number") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrbitCyan,
                            unfocusedBorderColor = OrbitBorder,
                            focusedLabelColor = OrbitCyan,
                            unfocusedLabelColor = MutedText
                        )
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    GradientButton(
                        text = if (isLoading) "Sending OTP..." else "Send Security OTP",
                        onClick = {
                            if (emailOrPhone.isBlank()) {
                                errorMessage = "Please enter your email or phone number."
                                return@GradientButton
                            }
                            step = 2
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Text("Verify Security OTP", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("One-Time Code sent to $emailOrPhone", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(bottom = 20.dp))

                    OutlinedTextField(
                        value = otp,
                        onValueChange = { 
                            if (it.length <= 6) otp = it
                            errorMessage = null
                        },
                        label = { Text("6-Digit OTP Code") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrbitCyan,
                            unfocusedBorderColor = OrbitBorder,
                            focusedLabelColor = OrbitCyan,
                            unfocusedLabelColor = MutedText
                        )
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    GradientButton(
                        text = if (isLoading) "Verifying..." else "Verify & Sign In",
                        onClick = {
                            if (otp.length < 4) {
                                errorMessage = "Please enter a valid OTP code."
                                return@GradientButton
                            }
                            onLoginSuccess("token_session_client_${System.currentTimeMillis()}")
                        },
                        enabled = !isLoading,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "← Back",
                            color = OrbitCyan,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.clickable { step = 1 }
                        )

                        Text(
                            text = if (timerSeconds > 0) "Resend in ${timerSeconds}s" else "Resend OTP",
                            color = if (timerSeconds == 0) OrbitCyan else MutedText,
                            fontSize = 14.sp,
                            modifier = Modifier.clickable(enabled = timerSeconds == 0) {
                                timerSeconds = 30
                            }
                        )
                    }
                }
            }
        }
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
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Navbar Header
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Welcome Back,", color = MutedText, fontSize = 13.sp)
                Text("Creative Brand Studio", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(CircleShape)
                    .background(OrbitBorder)
                    .clickable { onNavigateToProfile() },
                contentAlignment = Alignment.Center
            ) {
                Text("C", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
        }

        // Action Banner
        Card(
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .background(Brush.linearGradient(listOf(OrbitPurple, SpaceNavyLight)), shape = RoundedCornerShape(16.dp))
                .border(1.dp, OrbitCyan.copy(alpha = 0.4f), RoundedCornerShape(16.dp))
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Cinematic Shoot On-Demand", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("Book an Expert UGC Videographer", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                Text("Professional vertical video shoots delivered in 24 hours.", color = Color.White.copy(alpha = 0.8f), fontSize = 13.sp, modifier = Modifier.padding(vertical = 8.dp))
                
                GradientButton(
                    text = "+ Book Video Shoot",
                    onClick = onNavigateToBooking,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Active Shoots Live Status Card
        Text("Active Shoot Tracker", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 18.sp, modifier = Modifier.padding(bottom = 12.dp))

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
                    Text("UGC Brand Reel Shoot", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 16.sp)
                    Text("Booking ID: bk_active_901", color = MutedText, fontSize = 12.sp)
                }
                Surface(
                    color = OrbitCyan.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(20.dp)
                ) {
                    Text("SHOOTING IN PROGRESS", color = OrbitCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp))
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            LinearProgressIndicator(
                progress = { 0.45f },
                color = OrbitCyan,
                trackColor = OrbitBorder,
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp))
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Assigned: Alex Rivera (Partner)", color = MutedText, fontSize = 12.sp)
                Text("Track Live →", color = OrbitCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Featured Packages Horizontal Carousel
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Production Tiers", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 18.sp)
            Text("View All →", color = OrbitCyan, fontSize = 13.sp, modifier = Modifier.clickable { onNavigateToPackages() })
        }

        LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .width(260.dp)
                        .border(1.dp, OrbitBorder, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Text("Personalized", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        Text("Cinematic event reels & edits", color = MutedText, fontSize = 12.sp)
                        Text("₹1,999", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = OrbitCyan, modifier = Modifier.padding(vertical = 8.dp))
                        Button(
                            onClick = onNavigateToBooking,
                            colors = ButtonDefaults.buttonColors(containerColor = OrbitCyan),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Select Tier", color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            item {
                Card(
                    colors = CardDefaults.cardColors(containerColor = SpaceNavyLight),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier
                        .width(260.dp)
                        .border(1.dp, OrbitPurple, RoundedCornerShape(16.dp))
                        .padding(16.dp)
                ) {
                    Column {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Professional (UGC)", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            Text("POPULAR", color = OrbitPurple, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                        }
                        Text("Dedicated editor chat & Brand DNA", color = MutedText, fontSize = 12.sp)
                        Text("₹4,999", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = OrbitPurple, modifier = Modifier.padding(vertical = 8.dp))
                        Button(
                            onClick = onNavigateToBooking,
                            colors = ButtonDefaults.buttonColors(containerColor = OrbitPurple),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("Select Tier", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

// ─── Screen 3: Packages Catalog ──────────────────────────────────────────────

@Composable
fun PackagesScreen(onSelectPackage: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        OrbitHeader(title = "Video Production Packages", subtitle = "Transparent pricing for high-converting video content")

        // Package Tier 1: Personalized
        GlassCard(modifier = Modifier.padding(bottom = 16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Personalized", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("₹1,999", fontSize = 24.sp, fontWeight = FontWeight.Black, color = OrbitCyan)
            }
            Text("Ideal for individual creators & solo events", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(bottom = 16.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("✓ 1 Finished Vertical Reel (9:16)", color = Color.White, fontSize = 14.sp)
                Text("✓ 60 Minutes On-Site Shooting", color = Color.White, fontSize = 14.sp)
                Text("✓ Basic Color Grading & Music Sync", color = Color.White, fontSize = 14.sp)
                Text("✓ 24-Hour Express Delivery", color = Color.White, fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(20.dp))

            GradientButton(
                text = "Book Personalized Package",
                onClick = { onSelectPackage("pkg-personalized") },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Package Tier 2: UGC Professional
        GlassCard(borderColor = OrbitPurple, modifier = Modifier.padding(bottom = 16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("UGC Professional", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Surface(color = OrbitPurple.copy(alpha = 0.2f), shape = RoundedCornerShape(4.dp)) {
                        Text("MOST POPULAR", color = OrbitPurple, fontSize = 10.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp))
                    }
                }
                Text("₹4,999", fontSize = 24.sp, fontWeight = FontWeight.Black, color = OrbitPurple)
            }
            Text("Complete brand video package with custom styling", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(vertical = 12.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("✓ 3 High-Converting Reels (9:16 & 16:9)", color = Color.White, fontSize = 14.sp)
                Text("✓ 2 Hours On-Site Professional Shoot", color = Color.White, fontSize = 14.sp)
                Text("✓ Full Brand DNA Integration (Font, Logo, Colors)", color = Color.White, fontSize = 14.sp)
                Text("✓ Direct Chat with Assigned Video Editor", color = Color.White, fontSize = 14.sp)
                Text("✓ Raw Footage Cloud Backup Included", color = Color.White, fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(20.dp))

            GradientButton(
                text = "Book UGC Professional Package",
                onClick = { onSelectPackage("pkg-professional") },
                modifier = Modifier.fillMaxWidth()
            )
        }

        // Package Tier 3: Enterprise Custom
        GlassCard(borderColor = OrbitBorder) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Enterprise Brand Studio", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("₹12,999", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)
            }
            Text("Full-scale shoot coverage for campaigns & product launches", color = MutedText, fontSize = 13.sp, modifier = Modifier.padding(bottom = 16.dp))

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("✓ 10 Commercial Master Reels", color = Color.White, fontSize = 14.sp)
                Text("✓ Half-Day Dedicated Videographer Crew", color = Color.White, fontSize = 14.sp)
                Text("✓ Priority 12-Hour Master Delivery", color = Color.White, fontSize = 14.sp)
                Text("✓ Unlimited Revisions & Dedicated Director", color = Color.White, fontSize = 14.sp)
            }

            Spacer(modifier = Modifier.height(20.dp))

            GradientButton(
                text = "Book Enterprise Package",
                onClick = { onSelectPackage("pkg-enterprise") },
                modifier = Modifier.fillMaxWidth()
            )
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
    var step by remember { mutableIntStateOf(1) } // 1: Slot & Location, 2: Review & Payment

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
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
                    Text(if (locationAddress.isBlank()) "Default Studio" else locationAddress, color = Color.White)
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

// ─── Screen 5: Live Shoot Tracker ────────────────────────────────────────────

@Composable
fun TrackingScreen(bookingId: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        OrbitHeader(title = "Live Shoot Tracker", subtitle = "Tracking Booking ID: $bookingId")

        // Pipeline Status Card
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

            // Pipeline Stages Checklist
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

        // Partner Contact Details Card
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

// ─── Screen 6: Profile & Brand DNA Settings ──────────────────────────────────

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    var brandName by remember { mutableStateOf("Creative Brand Studio") }
    var brandColor by remember { mutableStateOf("#00F0FF") }
    var selectedFont by remember { mutableStateOf("Space Grotesk") }
    var editorNotes by remember { mutableStateOf("High-contrast text overlays, fast-paced transitions.") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        OrbitHeader(title = "Brand DNA & Account", subtitle = "Customize default brand assets for your video edits")

        GlassCard {
            Text("Brand Identity Settings", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = brandName,
                onValueChange = { brandName = it },
                label = { Text("Brand Name") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = brandColor,
                onValueChange = { brandColor = it },
                label = { Text("Primary Brand Color (Hex)") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = selectedFont,
                onValueChange = { selectedFont = it },
                label = { Text("Default Brand Typography Font") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = editorNotes,
                onValueChange = { editorNotes = it },
                label = { Text("Default Editor Style Guidelines") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(24.dp))

            GradientButton(
                text = "Save Brand DNA Profile",
                onClick = {},
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = Destructive),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text("Log Out Account", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Modal Dialogs & Sheets ──────────────────────────────────────────────────

@Composable
fun NotificationsSheet(onDismiss: () -> Unit) {
    Surface(
        color = SpaceNavyLight,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        modifier = Modifier.fillMaxWidth().wrapContentHeight()
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Notifications", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text("Close", color = OrbitCyan, modifier = Modifier.clickable { onDismiss() })
            }
            Spacer(modifier = Modifier.height(16.dp))
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                GlassCard {
                    Text("Partner Assigned!", fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Alex Rivera accepted your UGC Reel shoot.", color = MutedText, fontSize = 12.sp)
                }
                GlassCard {
                    Text("Shoot Confirmed", fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Payment of ₹4,999 received for booking bk_active_901.", color = MutedText, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun SearchSheet(onDismiss: () -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    Surface(
        color = SpaceNavyLight,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        modifier = Modifier.fillMaxWidth().wrapContentHeight()
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text("Search Orbit Catalog", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search packages, shoots, videographers...") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text("Popular Searches: UGC Reel, Event Coverage, 4K Drone", color = MutedText, fontSize = 12.sp)
        }
    }
}

@Composable
fun HelpSupportSheet(onDismiss: () -> Unit) {
    Surface(
        color = SpaceNavyLight,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        modifier = Modifier.fillMaxWidth().wrapContentHeight()
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Text("Help & Customer Support", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Spacer(modifier = Modifier.height(8.dp))
            Text("24/7 Priority Support line for Orbit Clients", color = MutedText, fontSize = 13.sp)
            Spacer(modifier = Modifier.height(16.dp))
            GradientButton(text = "Chat with Support Agent", onClick = onDismiss, modifier = Modifier.fillMaxWidth())
        }
    }
}


