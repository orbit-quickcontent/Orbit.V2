package com.orbitlogic.client.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbitlogic.client.ui.theme.*

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

// ─── Screen: Login ───────────────────────────────────────────────────────────

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    var email by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var step by remember { mutableIntStateOf(1) } // 1: Send OTP, 2: Verify OTP

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(
                text = "ORBIT",
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = OrbitCyan,
                letterSpacing = 4.sp
            )
            Text(
                text = "Cinematic UGC Shoots",
                fontSize = 14.sp,
                color = MutedText,
                modifier = Modifier.padding(bottom = 40.dp)
            )

            GlassCard {
                if (step == 1) {
                    Text("Welcome Back", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Enter your email to request OTP", color = MutedText, modifier = Modifier.padding(bottom = 16.dp))

                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        label = { Text("Email Address") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    GradientButton(
                        text = "Send OTP",
                        onClick = { step = 2 },
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    Text("Verify Email", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("OTP sent to $email", color = MutedText, modifier = Modifier.padding(bottom = 16.dp))

                    OutlinedTextField(
                        value = otp,
                        onValueChange = { otp = it },
                        label = { Text("One-Time Password") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    GradientButton(
                        text = "Submit OTP",
                        onClick = { onLoginSuccess("mock_token_123") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    Text(
                        text = "Go Back",
                        color = MutedText,
                        modifier = Modifier
                            .padding(top = 16.dp)
                            .clickable { step = 1 }
                    )
                }
            }
        }
    }
}

// ─── Screen: Dashboard Home ──────────────────────────────────────────────────

@Composable
fun DashboardHomeScreen(onNavigateToBooking: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Cinematic Dashboard", subtitle = "Your video projects and bookings")

        GradientButton(
            text = "+ New Video Booking",
            onClick = onNavigateToBooking,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text("Active Shoots", fontWeight = FontWeight.Bold, color = Color.White, fontSize = 18.sp, modifier = Modifier.padding(bottom = 8.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                GlassCard {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Cinematic Edit", fontWeight = FontWeight.Bold, color = Color.White)
                            Text("Status: SHOOTING", color = OrbitCyan, fontSize = 12.sp)
                        }
                        Text("22 July", color = MutedText)
                    }
                }
            }
        }
    }
}

// ─── Screen: Packages ────────────────────────────────────────────────────────

@Composable
fun PackagesScreen(onSelectPackage: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Video Packages", subtitle = "Select your production tier")

        LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item {
                GlassCard {
                    Text("Personalized", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Cinematic event reels & edits", color = MutedText)
                    Text("₹1,999", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = OrbitCyan, modifier = Modifier.padding(vertical = 12.dp))

                    GradientButton(
                        text = "Book Package",
                        onClick = { onSelectPackage("pkg-personalized") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
            item {
                GlassCard {
                    Text("Professional (UGC)", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Color.White)
                    Text("Includes Chat with Editor & Brand customization", color = MutedText)
                    Text("₹4,999", fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = OrbitPurple, modifier = Modifier.padding(vertical = 12.dp))

                    GradientButton(
                        text = "Book Package",
                        onClick = { onSelectPackage("pkg-professional") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }
    }
}

// ─── Screen: Booking Flow ────────────────────────────────────────────────────

@Composable
fun BookingFlowScreen(packageId: String, onBookingComplete: () -> Unit) {
    var location by remember { mutableStateOf("") }
    var slot by remember { mutableStateOf("") }
    var date by remember { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Configure Shoot", subtitle = "Selected Tier: $packageId")

        GlassCard {
            OutlinedTextField(
                value = date,
                onValueChange = { date = it },
                label = { Text("Date (YYYY-MM-DD)") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = slot,
                onValueChange = { slot = it },
                label = { Text("Time Slot (e.g. 10:00 AM)") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                label = { Text("Shoot Location Address") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(24.dp))

            GradientButton(
                text = "Pay & Dispatch Shoot",
                onClick = onBookingComplete,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ─── Screen: Tracking Dashboard ──────────────────────────────────────────────

@Composable
fun TrackingScreen(bookingId: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Shoot Status Tracker", subtitle = "Booking ID: $bookingId")

        GlassCard {
            Text("Booking Status: PAID", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
            Spacer(modifier = Modifier.height(16.dp))

            LinearProgressIndicator(
                progress = { 0.2f },
                color = OrbitCyan,
                trackColor = OrbitBorder,
                modifier = Modifier.fillMaxWidth().height(10.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))
            Text("• Partner Dispatched: Pending", color = MutedText)
            Text("• Camera Sync: Pending", color = MutedText)
            Text("• Editor Delivery: Pending", color = MutedText)
        }
    }
}

// ─── Screen: Profile & Settings ──────────────────────────────────────────────

@Composable
fun ProfileScreen(onLogout: () -> Unit) {
    var name by remember { mutableStateOf("Demo Client") }
    var phone by remember { mutableStateOf("+91 98765 43210") }
    var font by remember { mutableStateOf("Space Grotesk") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
            .padding(16.dp)
    ) {
        OrbitHeader(title = "Brand Profile", subtitle = "Manage brand details & options")

        GlassCard {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = phone,
                onValueChange = { phone = it },
                label = { Text("Phone Number") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = font,
                onValueChange = { font = it },
                label = { Text("Brand Font") },
                modifier = Modifier.fillMaxWidth(),
                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = OrbitCyan)
            )

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                onClick = onLogout,
                colors = ButtonDefaults.buttonColors(containerColor = Destructive),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth().height(50.dp)
            ) {
                Text("Log Out Session", color = Color.White, fontWeight = FontWeight.Bold)
            }
        }
    }
}
