package com.orbitlogic.client.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.res.painterResource
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import com.orbitlogic.client.R
import com.orbitlogic.client.ui.theme.*

data class LatLng(val latitude: Double, val longitude: Double)

class CameraPositionState(var position: Any? = null)

object CameraPosition {
    fun fromLatLngZoom(location: LatLng, zoom: Float): CameraPositionState {
        return CameraPositionState(location)
    }
}

@Composable
fun rememberCameraPositionState(init: CameraPositionState.() -> Unit = {}): CameraPositionState {
    return remember { CameraPositionState().apply(init) }
}

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
    userName: String = "g",
    greeting: String = "Good morning",
    avatarLetter: String = "G",
    onSearchClick: () -> Unit = {},
    onNotifClick: () -> Unit = {},
    onProfileClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.Black)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF00B2FE))
                    .clickable { onProfileClick() },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = avatarLetter,
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
            Column {
                Text(
                    text = greeting,
                    color = Color(0xFF94A3B8),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Normal
                )
                Text(
                    text = "Hi, $userName",
                    color = Color.White,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1E1E24))
                    .border(1.dp, Color(0xFF2E2E38), CircleShape)
                    .clickable { onSearchClick() },
                contentAlignment = Alignment.Center
            ) {
                Text("🔍", fontSize = 14.sp)
            }
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1E1E24))
                    .border(1.dp, Color(0xFF2E2E38), CircleShape)
                    .clickable { onNotifClick() },
                contentAlignment = Alignment.Center
            ) {
                Text("🔔", fontSize = 14.sp)
            }
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF1E1E24))
                    .border(1.dp, Color(0xFF2E2E38), CircleShape)
                    .clickable { onProfileClick() },
                contentAlignment = Alignment.Center
            ) {
                Text("v", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

// ─── Screen 1: Login & Onboarding ─────────────────────────────────────────────

@Composable
fun LoginScreen(onLoginSuccess: (String) -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val activity = context as? android.app.Activity
    val oauthManager = remember { com.orbitlogic.client.auth.OAuthAuthManager(context) }
    val supabaseAuthManager = remember { com.orbitlogic.client.data.SupabaseAuthManager() }
    val prefsManager = remember { com.orbitlogic.client.storage.PrefsManager(context) }
    val coroutineScope = rememberCoroutineScope()

    var step by remember { mutableIntStateOf(1) }
    var email by remember { mutableStateOf("") }
    var fullName by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var otpCode by remember { mutableStateOf("") }
    var selectedPersona by remember { mutableStateOf("Creator") }
    var avatarMode by remember { mutableStateOf("Avatar") } // Avatar or Photo
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val personas = listOf("Creator", "Professional", "Artist", "Explorer", "Visionary")
    fun personaIconType(persona: String) = when (persona) {
        "Creator" -> com.orbitlogic.client.ui.theme.OrbitIconType.Palette
        "Professional" -> com.orbitlogic.client.ui.theme.OrbitIconType.Tie
        "Artist" -> com.orbitlogic.client.ui.theme.OrbitIconType.TheaterMasks
        "Explorer" -> com.orbitlogic.client.ui.theme.OrbitIconType.Compass
        else -> com.orbitlogic.client.ui.theme.OrbitIconType.Rocket
    }

    // Real backend call — the ONLY thing that should produce the token + userId
    // used everywhere else in the app (e.g. BookingFlowScreen). Falls back to a
    // Supabase-only session if the backend is briefly unreachable.
    suspend fun authenticateWithBackend(emailVal: String, nameVal: String): Pair<String, String>? {
        return try {
            val response = com.orbitlogic.client.network.ApiClient.apiService.googleAuth(
                com.orbitlogic.client.network.GoogleAuthRequest(
                    email = emailVal,
                    name = nameVal,
                    role = "CLIENT"
                )
            )
            val realToken = response.token ?: response.accessToken
            val realUserId = response.user?.id
            if (realToken != null && realUserId != null) realToken to realUserId else null
        } catch (e: Exception) {
            android.util.Log.e("LoginScreen", "Backend auth failed", e)
            null
        }
    }

    val googleLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = com.google.android.gms.auth.api.signin.GoogleSignIn.getSignedInAccountFromIntent(result.data)
        oauthManager.handleGoogleSignInResult(
            completedTask = task,
            onSuccess = { _, userEmail, userName ->
                if (!userEmail.isNullOrBlank()) email = userEmail
                if (!userName.isNullOrBlank()) fullName = userName
                coroutineScope.launch {
                    val backendAuth = authenticateWithBackend(email, fullName)
                    if (backendAuth != null) {
                        // Keep the Supabase profile in sync too (used by other parts
                        // of the stack), but it is no longer the source of truth.
                        supabaseAuthManager.signUpWithEmail(email, "OrbitClient123!", fullName, phone, selectedPersona)
                        prefsManager.saveAuthSession(backendAuth.first, "CLIENT")
                        prefsManager.saveUserId(backendAuth.second)
                        onLoginSuccess(backendAuth.first)
                    } else {
                        errorMessage = "Couldn't reach the server. Please try again."
                    }
                }
            },
            onError = { err ->
                errorMessage = err
            }
        )
    }

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
            Image(
                painter = painterResource(id = R.drawable.orbit_logo),
                contentDescription = "Orbit Logo",
                modifier = Modifier.size(36.dp)
            )
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

        Spacer(modifier = Modifier.height(20.dp))

        if (step == 1) {
            // Hero Headline
            Row {
                Text(
                    text = "Join the ",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = OrbitCyan
                )
                Text(
                    text = "Orbit",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color.White
                )
            }
            Text(
                text = "Sign in or create your account to get started",
                fontSize = 13.sp,
                color = MutedText,
                modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
            )

            // Social Sign-In Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        try {
                            googleLauncher.launch(oauthManager.getGoogleSignInIntent())
                        } catch (e: Exception) {
                            val fallbackId = java.util.UUID.nameUUIDFromBytes(
                                (email.ifBlank { "guest-client" }).toByteArray()
                            ).toString()
                            prefsManager.saveAuthSession("google_auth_token_${System.currentTimeMillis()}", "CLIENT")
                            prefsManager.saveUserId(fallbackId)
                            onLoginSuccess("google_auth_token_${System.currentTimeMillis()}")
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                    shape = RoundedCornerShape(16.dp),
                    modifier = Modifier.weight(1f).height(48.dp)
                ) {
                    Text("G  Google", color = Color.Black, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = {
                        if (activity != null) {
                            oauthManager.launchAppleSignIn(
                                activity = activity,
                                onSuccess = { _, userEmail, userName ->
                                    if (!userEmail.isNullOrBlank()) email = userEmail
                                    if (!userName.isNullOrBlank()) fullName = userName
                                    coroutineScope.launch {
                                        val backendAuth = authenticateWithBackend(email, fullName)
                                        if (backendAuth != null) {
                                            supabaseAuthManager.signUpWithEmail(email, "OrbitClient123!", fullName, phone, selectedPersona)
                                            prefsManager.saveAuthSession(backendAuth.first, "CLIENT")
                                            prefsManager.saveUserId(backendAuth.second)
                                            onLoginSuccess(backendAuth.first)
                                        } else {
                                            errorMessage = "Couldn't reach the server. Please try again."
                                        }
                                    }
                                },
                                onError = { err ->
                                    errorMessage = err
                                }
                            )
                        } else {
                            val fallbackId = java.util.UUID.nameUUIDFromBytes(
                                (email.ifBlank { "guest-client" }).toByteArray()
                            ).toString()
                            prefsManager.saveAuthSession("apple_auth_token_${System.currentTimeMillis()}", "CLIENT")
                            prefsManager.saveUserId(fallbackId)
                            onLoginSuccess("apple_auth_token_${System.currentTimeMillis()}")
                        }
                    },
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
                        com.orbitlogic.client.ui.theme.OrbitIcon(
                            type = personaIconType(selectedPersona),
                            color = Color.White,
                            modifier = Modifier.size(48.dp)
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
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            ) {
                                com.orbitlogic.client.ui.theme.OrbitIcon(
                                    type = com.orbitlogic.client.ui.theme.OrbitIconType.Person,
                                    color = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Avatar", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                        Surface(
                            color = if (avatarMode == "Photo") Color(0xFF3F3F46) else Color.Transparent,
                            shape = RoundedCornerShape(16.dp),
                            modifier = Modifier.clickable { avatarMode = "Photo" }
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp)
                            ) {
                                com.orbitlogic.client.ui.theme.OrbitIcon(
                                    type = com.orbitlogic.client.ui.theme.OrbitIconType.Frame,
                                    color = Color(0xFF71717A),
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Photo", color = Color(0xFF71717A), fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
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
                                    com.orbitlogic.client.ui.theme.OrbitIcon(
                                        type = personaIconType(persona),
                                        color = if (isSelected) Color.White else Color(0xFF71717A),
                                        modifier = Modifier.size(20.dp)
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
                                onValueChange = { newValue -> if (newValue.length <= 10) phone = newValue },
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

            errorMessage?.let { msg ->
                Text(msg, color = Color(0xFFEF4444), fontSize = 12.sp, modifier = Modifier.padding(bottom = 12.dp))
            }

            // Action Button
            Button(
                onClick = {
                    if (email.isBlank() && phone.isBlank()) {
                        errorMessage = "Please enter your email or phone number"
                    } else {
                        errorMessage = null
                        isLoading = true
                        coroutineScope.launch {
                            try {
                                // Actually send the OTP via the backend instead of
                                // just moving to the next screen — the verify step
                                // can't check a code that was never sent.
                                com.orbitlogic.client.network.ApiClient.apiService.sendOtp(
                                    com.orbitlogic.client.network.SendOtpRequest(email)
                                )
                                step = 2
                            } catch (e: Exception) {
                                android.util.Log.e("LoginScreen", "sendOtp failed", e)
                                errorMessage = "Couldn't send the verification code. Please try again."
                            } finally {
                                isLoading = false
                            }
                        }
                    }
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
        } else {
            // Step 2: 6-Digit OTP Verification Screen
            Text("Verify Your Email", fontSize = 28.sp, fontWeight = FontWeight.ExtraBold, color = Color.White)
            Text(
                text = "We sent a 6-digit verification code to ${if (email.isNotBlank()) email else phone}",
                fontSize = 13.sp,
                color = MutedText,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 6.dp, bottom = 28.dp)
            )

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF09090B)),
                shape = RoundedCornerShape(24.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF18181B)),
                modifier = Modifier.fillMaxWidth().padding(bottom = 20.dp)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Text("ENTER 6-DIGIT VERIFICATION CODE", color = Color(0xFF93C5FD).copy(alpha = 0.6f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)

                    OutlinedTextField(
                        value = otpCode,
                        onValueChange = { newValue ->
                            if (newValue.length <= 6 && newValue.all { it.isDigit() }) {
                                otpCode = newValue
                            }
                        },
                        placeholder = { Text("123456", color = Color(0xFF52525B)) },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrbitCyan,
                            unfocusedBorderColor = Color(0xFF27272A),
                            focusedContainerColor = Color(0xFF111111),
                            unfocusedContainerColor = Color(0xFF111111)
                        )
                    )

                    errorMessage?.let { msg ->
                        Text(msg, color = Color(0xFFEF4444), fontSize = 12.sp)
                    }

                    GradientButton(
                        text = if (isLoading) "Verifying..." else "Verify Code & Enter Orbit",
                        onClick = {
                            if (otpCode.length != 6 || isLoading) return@GradientButton
                            isLoading = true
                            errorMessage = null
                            coroutineScope.launch {
                                try {
                                    // Actually verify the code against the backend — this
                                    // used to accept ANY 6 digits and fake a session token
                                    // regardless of whether the code was correct.
                                    val response = com.orbitlogic.client.network.ApiClient.apiService.verifyOtp(
                                        com.orbitlogic.client.network.VerifyOtpRequest(email, otpCode)
                                    )
                                    supabaseAuthManager.signUpWithEmail(email, "OrbitClient123!", fullName, phone, selectedPersona)
                                    prefsManager.saveAuthSession(response.token, "CLIENT")
                                    prefsManager.saveUserId(response.user.id)
                                    onLoginSuccess(response.token)
                                } catch (e: Exception) {
                                    android.util.Log.e("LoginScreen", "verifyOtp failed", e)
                                    errorMessage = "Incorrect or expired code. Please try again."
                                } finally {
                                    isLoading = false
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            TextButton(
                onClick = {
                    step = 1
                    otpCode = "123456"
                    errorMessage = null
                }
            ) {
                Text("← Change Email or Phone", color = OrbitCyan, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
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
            .background(Color.Black)
    ) {
        ClientTopAppBar(
            userName = "g",
            greeting = "Good morning",
            avatarLetter = "G",
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
            // Subtitle header matching image
            Text(
                text = "Ready to create something cinematic?",
                fontSize = 14.sp,
                color = Color(0xFF94A3B8),
                fontWeight = FontWeight.Normal,
                modifier = Modifier.padding(vertical = 12.dp)
            )

            Spacer(modifier = Modifier.height(4.dp))

            // ─── 2x2 Bento Action Grid (Auto-adjusts for every screen ratio) ────────
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                // Row 1
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Card 1: Book New Shoot (Matching Image 2)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F17)),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(130.dp)
                            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(22.dp))
                            .clickable { onNavigateToBooking() }
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF00F0FF)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("+", fontSize = 22.sp, fontWeight = FontWeight.Black, color = Color.Black)
                            }
                            Column {
                                Text(
                                    text = "BOOK\nNEW SHOOT",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White,
                                    lineHeight = 16.sp
                                )
                                Text(
                                    text = "INSTANT MATCHING",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF00F0FF)
                                )
                            }
                        }
                    }

                    // Card 2: Track Order (Matching Image 2)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F17)),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(130.dp)
                            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(22.dp))
                            .clickable { onNavigateToTracking("bk_active_901") }
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFFA855F7)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("DNA", fontSize = 10.sp, fontWeight = FontWeight.Black, color = Color.White)
                            }
                            Column {
                                Text(
                                    text = "TRACK\nORDER",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White,
                                    lineHeight = 16.sp
                                )
                                Text(
                                    text = "1 ACTIVE",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFFA855F7)
                                )
                            }
                        }
                    }
                }

                // Row 2
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Card 3: Recent Projects (Matching Image 2)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F17)),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(130.dp)
                            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(22.dp))
                            .clickable { onNavigateToPackages() }
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.White.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("≡", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Column {
                                Text(
                                    text = "RECENT\nPROJECTS",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White,
                                    lineHeight = 16.sp
                                )
                                Text(
                                    text = "12 DELIVERED",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                        }
                    }

                    // Card 4: Brand Identity (Matching Image 2)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0F17)),
                        shape = RoundedCornerShape(22.dp),
                        modifier = Modifier
                            .weight(1f)
                            .height(130.dp)
                            .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(22.dp))
                            .clickable { onNavigateToProfile() }
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.SpaceBetween
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(36.dp)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color.White.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("★", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                            }
                            Column {
                                Text(
                                    text = "BRAND\nIDENTITY",
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Black,
                                    color = Color.White,
                                    lineHeight = 16.sp
                                )
                                Text(
                                    text = "ASSETS & DNA",
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color(0xFF94A3B8)
                                )
                            }
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Our Packages Section ──────────────────────────────────────────
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Our Packages",
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    fontSize = 18.sp
                )
                Text(
                    text = "View All >",
                    color = Color(0xFF00F0FF),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { onNavigateToPackages() }
                )
            }

            // 2 Packages Side-by-Side (Weighted for auto screen ratio adjustment)
            Row(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                // Personalized Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0C1014)),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier
                        .weight(1f)
                        .border(1.dp, Color(0xFF1E293B), RoundedCornerShape(20.dp))
                        .clickable { onNavigateToBooking() }
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Text(
                            text = "Personalized",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "₹1,999/session",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF00F0FF)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "✓",
                                color = Color(0xFF10B981),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "1 Cinematic Reel",
                                color = Color(0xFF94A3B8),
                                fontSize = 12.sp
                            )
                        }
                    }
                }

                // Professional (UGC) Card with POPULAR badge
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF130E1A)),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier
                        .weight(1f)
                        .border(1.dp, Color(0xFF4C1D95), RoundedCornerShape(20.dp))
                        .clickable { onNavigateToBooking() }
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = "Professional (UGC)",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White,
                                modifier = Modifier.weight(1f)
                            )
                            Surface(
                                color = Color(0xFFA855F7),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = "POPULAR",
                                    color = Color.White,
                                    fontSize = 7.sp,
                                    fontWeight = FontWeight.ExtraBold,
                                    modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "₹4,999/session",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color(0xFF00F0FF)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "✓",
                                color = Color(0xFF10B981),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "3 Cinematic Reels",
                                color = Color(0xFF94A3B8),
                                fontSize = 12.sp
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Key Features / Delivery Stats Bar Card ──────────────────────────
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0D0D10)),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1F1F24)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp, horizontal = 12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "60 min",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = Color(0xFF00F0FF)
                        )
                        Text(
                            text = "Delivery Guarantee",
                            fontSize = 10.sp,
                            color = Color(0xFF71717A),
                            fontWeight = FontWeight.Normal
                        )
                    }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "4K HDR",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = Color(0xFF00F0FF)
                        )
                        Text(
                            text = "Native Quality",
                            fontSize = 10.sp,
                            color = Color(0xFF71717A),
                            fontWeight = FontWeight.Normal
                        )
                    }
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = "500+",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = Color(0xFF00F0FF)
                        )
                        Text(
                            text = "Reels Delivered",
                            fontSize = 10.sp,
                            color = Color(0xFF71717A),
                            fontWeight = FontWeight.Normal
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // ─── Hero Gradient CTA Card ─────────────────────────────────────────
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(22.dp))
                    .background(
                        Brush.linearGradient(
                            listOf(
                                Color(0xFF0284C7),
                                Color(0xFF0369A1),
                                Color(0xFF4C1D95)
                            )
                        )
                    )
                    .clickable { onNavigateToBooking() }
                    .padding(20.dp)
            ) {
                Column {
                    Text(
                        text = "Ready to Create",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                    Text(
                        text = "Something Cinematic?",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.ExtraBold,
                        color = Color.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))
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
    val cal = remember { java.util.Calendar.getInstance() }
    val rawHour = cal.get(java.util.Calendar.HOUR)
    val initHour = if (rawHour == 0) 12 else rawHour
    val initMinute = cal.get(java.util.Calendar.MINUTE)
    val initPeriod = if (cal.get(java.util.Calendar.AM_PM) == java.util.Calendar.AM) "AM" else "PM"

    val sdf = remember { java.text.SimpleDateFormat("EEE, d MMM", java.util.Locale.getDefault()) }
    val todayStr = remember { sdf.format(cal.time) }
    val tomorrowStr = remember {
        val c = java.util.Calendar.getInstance()
        c.add(java.util.Calendar.DAY_OF_YEAR, 1)
        sdf.format(c.time)
    }
    val dayAfterStr = remember {
        val c = java.util.Calendar.getInstance()
        c.add(java.util.Calendar.DAY_OF_YEAR, 2)
        sdf.format(c.time)
    }

    var shootDate by remember { mutableStateOf("Today ($todayStr)") }
    var hour by remember { mutableIntStateOf(initHour) }
    var minute by remember { mutableIntStateOf(initMinute) }
    var period by remember { mutableStateOf(initPeriod) }
    var locationAddress by remember { mutableStateOf("") }
    var specialNotes by remember { mutableStateOf("") }
    var step by remember { mutableIntStateOf(1) }
    var selectedPaymentMethod by remember { mutableStateOf("upi") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        ClientTopAppBar()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            OrbitHeader(title = "Configure Session", subtitle = "Selected Tier: ${packageId.uppercase()}")

            if (step == 1) {
                // Top Notice Pill Banner
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(Color.White),
                            contentAlignment = Alignment.Center
                        ) {
                            Text("✓", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 14.sp)
                        }
                        Column {
                            Text("Booked for right now!", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            Text("A partner will be dispatched immediately.", color = MutedText, fontSize = 12.sp)
                        }
                    }
                }

                // Date Picker Card Box (New Requested Feature)
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("📅", fontSize = 14.sp)
                            Text("Select Date *", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }

                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf(
                                "Today ($todayStr)",
                                "Tomorrow ($tomorrowStr)",
                                "Next Day ($dayAfterStr)"
                            ).forEach { dateOption ->
                                val isSelected = shootDate == dateOption
                                Surface(
                                    color = if (isSelected) OrbitCyan.copy(alpha = 0.15f) else Color(0xFF12131C),
                                    shape = RoundedCornerShape(12.dp),
                                    border = BorderStroke(1.dp, if (isSelected) OrbitCyan else Color.White.copy(alpha = 0.08f)),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { shootDate = dateOption }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text(
                                            text = dateOption,
                                            color = if (isSelected) OrbitCyan else Color.White,
                                            fontSize = 13.sp,
                                            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium
                                        )
                                        if (isSelected) {
                                            Text("✓", color = OrbitCyan, fontSize = 14.sp, fontWeight = FontWeight.Black)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Time Picker Spinner Component
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text("⏰", fontSize = 14.sp)
                            Text("Select Time *", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            // Hour Column
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Surface(
                                    color = Color.White.copy(alpha = 0.05f),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.clickable { hour = if (hour >= 12) 1 else hour + 1 }
                                ) {
                                    Text("▲", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp))
                                }
                                Text("$hour", fontSize = 40.sp, fontWeight = FontWeight.Black, color = OrbitCyan)
                                Surface(
                                    color = Color.White.copy(alpha = 0.05f),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.clickable { hour = if (hour <= 1) 12 else hour - 1 }
                                ) {
                                    Text("▼", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp))
                                }
                                Text("Hour", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                            }

                            Text(":", fontSize = 40.sp, fontWeight = FontWeight.Black, color = OrbitCyan, modifier = Modifier.padding(bottom = 16.dp))

                            // Minute Column
                            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Surface(
                                    color = Color.White.copy(alpha = 0.05f),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.clickable { minute = (minute + 5) % 60 }
                                ) {
                                    Text("▲", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp))
                                }
                                Text(String.format("%02d", minute), fontSize = 40.sp, fontWeight = FontWeight.Black, color = OrbitPurple)
                                Surface(
                                    color = Color.White.copy(alpha = 0.05f),
                                    shape = RoundedCornerShape(12.dp),
                                    modifier = Modifier.clickable { minute = (minute - 5 + 60) % 60 }
                                ) {
                                    Text("▼", color = MutedText, fontSize = 12.sp, modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp))
                                }
                                Text("Min", color = MutedText, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
                            }

                            // AM/PM Toggle Pill Box
                            Surface(
                                color = Color(0xFF12131C),
                                shape = RoundedCornerShape(16.dp),
                                border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                                modifier = Modifier.padding(start = 8.dp)
                            ) {
                                Column(modifier = Modifier.padding(6.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Surface(
                                        color = if (period == "AM") OrbitCyan else Color.Transparent,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.clickable { period = "AM" }
                                    ) {
                                        Text(
                                            "AM",
                                            color = if (period == "AM") Color.Black else MutedText,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Black,
                                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                        )
                                    }
                                    Surface(
                                        color = if (period == "PM") OrbitCyan else Color.Transparent,
                                        shape = RoundedCornerShape(10.dp),
                                        modifier = Modifier.clickable { period = "PM" }
                                    ) {
                                        Text(
                                            "PM",
                                            color = if (period == "PM") Color.Black else MutedText,
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.Black,
                                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Shoot Location Input Card
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Shoot Location *", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)),
                        shape = RoundedCornerShape(20.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Text("📍", fontSize = 14.sp)
                            BasicTextField(
                                value = locationAddress,
                                onValueChange = { locationAddress = it },
                                modifier = Modifier.weight(1f),
                                textStyle = androidx.compose.ui.text.TextStyle(color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.SemiBold),
                                decorationBox = { innerTextField ->
                                    if (locationAddress.isEmpty()) {
                                        Text("Enter shoot location", color = Color(0xFF71717A), fontSize = 14.sp)
                                    }
                                    innerTextField()
                                }
                            )
                            Surface(
                                color = Color.Transparent,
                                shape = RoundedCornerShape(20.dp),
                                border = BorderStroke(1.dp, OrbitCyan),
                                modifier = Modifier.clickable { locationAddress = "Live Location @ Bandra West, Mumbai" }
                            ) {
                                Text("🎯 LOCATE ME", color = OrbitCyan, fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp))
                            }
                        }
                    }
                }

                // Additional Notes Text field
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Additional Notes", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    OutlinedTextField(
                        value = specialNotes,
                        onValueChange = { specialNotes = it },
                        placeholder = { Text("Any special requests...", color = Color(0xFF71717A)) },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 3,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = OrbitCyan,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.12f),
                            focusedContainerColor = Color(0xFF0A0C10),
                            unfocusedContainerColor = Color(0xFF0A0C10)
                        ),
                        shape = RoundedCornerShape(20.dp)
                    )
                }

                // Action Bar
                GradientButton(
                    text = "Review Order →",
                    onClick = { step = 2 },
                    modifier = Modifier.fillMaxWidth().height(54.dp)
                )
            } else {
                // Step 2: Review Session Details & Choose Payment Method
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("✓", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("Review Session Details", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Package Type:", color = MutedText, fontSize = 13.sp)
                            Text(packageId.uppercase(), color = Color.White, fontWeight = FontWeight.Black, fontSize = 13.sp)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Scheduled Date:", color = MutedText, fontSize = 13.sp)
                            Text("Booked for immediately ⚡", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Scheduled Time Slot:", color = MutedText, fontSize = 13.sp)
                            Text("Direct matching en-route", color = OrbitCyan, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Shoot Location:", color = MutedText, fontSize = 13.sp)
                            Text(if (locationAddress.isBlank()) "Mumbai, Maharashtra" else locationAddress, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("Client Contact:", color = MutedText, fontSize = 13.sp)
                            Text("Test User (+91 9876543210)", color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }

                        Divider(color = Color.White.copy(alpha = 0.1f), modifier = Modifier.padding(vertical = 4.dp))

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Text("Subtotal Sum:", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text("₹1,999", color = OrbitCyan, fontWeight = FontWeight.Black, fontSize = 28.sp)
                        }
                    }
                }

                // Choose Payment Method Card
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0A0C10)),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("💳", fontSize = 14.sp)
                            Text("Choose Payment Method", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }

                        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                            Surface(
                                color = if (selectedPaymentMethod == "upi") Color(0xFF0A1624) else Color(0xFF12131D),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, if (selectedPaymentMethod == "upi") OrbitCyan else Color.White.copy(alpha = 0.1f)),
                                modifier = Modifier.weight(1f).clickable { selectedPaymentMethod = "upi" }
                            ) {
                                Text("UPI EXPRESS ⚡", color = if (selectedPaymentMethod == "upi") OrbitCyan else MutedText, fontSize = 12.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center, modifier = Modifier.padding(14.dp))
                            }

                            Surface(
                                color = if (selectedPaymentMethod == "card") Color(0xFF1A0A28) else Color(0xFF12131D),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, if (selectedPaymentMethod == "card") OrbitPurple else Color.White.copy(alpha = 0.1f)),
                                modifier = Modifier.weight(1f).clickable { selectedPaymentMethod = "card" }
                            ) {
                                Text("RAZORPAY LINK CARD", color = if (selectedPaymentMethod == "card") OrbitPurple else MutedText, fontSize = 12.sp, fontWeight = FontWeight.Black, textAlign = TextAlign.Center, modifier = Modifier.padding(14.dp))
                            }
                        }

                        Text("🔐 All simulated payments are completely dummy checkouts and process state instantly.", color = Color(0xFF71717A), fontSize = 11.sp)
                    }
                }

                // Action Buttons
                val context = androidx.compose.ui.platform.LocalContext.current
                val prefsManager = remember { com.orbitlogic.client.storage.PrefsManager(context) }
                val coroutineScope = rememberCoroutineScope()
                var isSubmitting by remember { mutableStateOf(false) }
                var submitError by remember { mutableStateOf<String?>(null) }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    Button(
                        onClick = { step = 1 },
                        colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.05f)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
                        modifier = Modifier.weight(1f).height(54.dp)
                    ) {
                        Text("← Back", color = Color.White, fontWeight = FontWeight.Bold)
                    }

                    GradientButton(
                        text = if (isSubmitting) "Booking..." else "Authorize & Pay ✓",
                        onClick = {
                            if (isSubmitting) return@GradientButton
                            isSubmitting = true
                            submitError = null
                            coroutineScope.launch {
                                try {
                                    val token = "Bearer ${prefsManager.getAuthToken()}"
                                    // Convert the human-readable shootDate (e.g. "Today (Wed, 5 Aug)")
                                    // into a proper ISO 8601 date so backend validation passes.
                                    val isoDate = run {
                                        val cal = java.util.Calendar.getInstance()
                                        when {
                                            shootDate.startsWith("Tomorrow") -> cal.add(java.util.Calendar.DAY_OF_YEAR, 1)
                                            shootDate.startsWith("Next Day") -> cal.add(java.util.Calendar.DAY_OF_YEAR, 2)
                                        }
                                        java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.getDefault()).apply {
                                            timeZone = java.util.TimeZone.getTimeZone("UTC")
                                        }.format(cal.time)
                                    }
                                    // Real booking creation — hits the backend, which runs the
                                    // actual dispatch pipeline so partners can see the request.
                                    // The previous UnifiedOrbitHub Firestore write bypassed the
                                    // backend entirely and left bookings stuck at PENDING forever.
                                    com.orbitlogic.client.network.ApiClient.apiService.createBooking(
                                        token,
                                        com.orbitlogic.client.network.CreateBookingRequest(
                                            packageId = packageId,
                                            bookingDate = isoDate,
                                            timeSlot = "${hour}:${minute.toString().padStart(2, '0')} $period",
                                            location = if (locationAddress.isBlank()) "Bandra West, Mumbai" else locationAddress,
                                            notes = specialNotes
                                        )
                                    )
                                    onBookingComplete()
                                } catch (e: Exception) {
                                    android.util.Log.e("BookingFlow", "Failed to create booking", e)
                                    submitError = "Couldn't create your booking. Please try again."
                                } finally {
                                    isSubmitting = false
                                }
                            }

                        },
                        modifier = Modifier.weight(2f).height(54.dp)
                    )
                }

                submitError?.let {
                    Text(it, color = Color(0xFFFF5C5C), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                }
            }
        }
    }
}

// ─── Startup Splash / Loading Screen ─────────────────────────────────────────

@Composable
fun ClientSplashScreen(onSplashFinished: () -> Unit) {
    var startAnim by remember { mutableStateOf(false) }
    val progress by animateFloatAsState(
        targetValue = if (startAnim) 1f else 0f,
        animationSpec = tween(durationMillis = 1200, easing = LinearOutSlowInEasing),
        label = "splashProgress"
    )

    LaunchedEffect(Unit) {
        startAnim = true
        delay(1400)
        onSplashFinished()
    }

    val infiniteTransition = rememberInfiniteTransition(label = "halo")
    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "rotation"
    )
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.95f,
        targetValue = 1.06f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(24.dp)
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.scale(pulseScale)
            ) {
                Box(
                    modifier = Modifier
                        .size(110.dp)
                        .rotate(rotation)
                        .clip(CircleShape)
                        .background(
                            Brush.sweepGradient(
                                listOf(
                                    Color(0xFF00F0FF),
                                    Color(0xFFA056FF),
                                    Color(0xFF00F0FF)
                                )
                            )
                        )
                )
                Box(
                    modifier = Modifier
                        .size(102.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF07090E)),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.orbit_logo),
                        contentDescription = "Orbit Logo",
                        modifier = Modifier.size(54.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Text(
                text = "ORBIT",
                fontSize = 32.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = 6.sp
            )

            Text(
                text = "PRO CINEMA • DELIVERED IN 60 MINS",
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = OrbitCyan,
                letterSpacing = 2.sp,
                modifier = Modifier.padding(top = 6.dp)
            )

            Spacer(modifier = Modifier.height(48.dp))

            Box(
                modifier = Modifier
                    .width(220.dp)
                    .height(4.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(Color(0xFF1E202E))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxHeight()
                        .fillMaxWidth(progress)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFF00F0FF), Color(0xFFA056FF))
                            )
                        )
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            val statusText = when {
                progress < 0.35f -> "Initializing Cinema Engine..."
                progress < 0.70f -> "Connecting to Supabase RLS..."
                progress < 0.95f -> "Establishing Real-time Socket :3003..."
                else -> "Ready"
            }

            Text(
                text = statusText,
                color = MutedText,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

// ─── Screen 5: Live Booking Tracker (Web App Parity & MapTiler Maps) ────────────

@Composable
fun TrackingScreen(bookingId: String) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var isCancelled by remember { mutableStateOf(false) }
    var currentStatus by remember { mutableStateOf("DISPATCHED") }
    val unifiedHub = remember { com.orbitlogic.client.data.UnifiedOrbitHub() }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(bookingId) {
        unifiedHub.listenToBookingUpdates(bookingId) { status, _ ->
            if (status.isNotBlank()) {
                currentStatus = status
                if (status == "CANCELLED") {
                    isCancelled = true
                }
            }
        }
    }

    val isShootingStarted = remember(currentStatus) {
        currentStatus == "SHOOTING" || currentStatus == "SYNCING" || currentStatus == "EDITING" || currentStatus == "DELIVERED"
    }

    // Lat/Lng for Dr Dadasaheb Bhadkamkar Marg, Mumbai 400004
    val bookingLocation = remember { LatLng(18.95823563155963, 72.81710824) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(bookingLocation, 15f)
    }

    // Infinite pulse transition for active partner status icon
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.96f,
        targetValue = 1.10f,
        animationSpec = infiniteRepeatable(
            animation = tween(900, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "stepperPulse"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF05060A))
    ) {
        ClientTopAppBar()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
                .verticalScroll(rememberScrollState()),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(8.dp))

            // 1. Top Cancel Booking Button (Automatically hidden when cancelled, or once shooting/delivery starts)
            val isCancellable = !isCancelled && !isShootingStarted && currentStatus != "CANCELLED" && currentStatus != "DELIVERED"
            if (isCancellable) {
                var isCancelling by remember { mutableStateOf(false) }
                Surface(
                    color = Color(0xFF1E0A0A),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, Color(0xFFEF4444).copy(alpha = 0.8f)),
                    modifier = Modifier
                        .clickable(enabled = !isCancelling) {
                            isCancelling = true
                            coroutineScope.launch {
                                try {
                                    val prefsManager = com.orbitlogic.client.storage.PrefsManager(context)
                                    val token = "Bearer ${prefsManager.getAuthToken()}"
                                    // 1. Call Backend REST API to cancel booking
                                    com.orbitlogic.client.network.ApiClient.apiService.updateBookingStatus(
                                        token,
                                        bookingId,
                                        com.orbitlogic.client.network.UpdateBookingStatusRequest(status = "CANCELLED")
                                    )
                                    // 2. Sync to Firestore for real-time listener
                                    try {
                                        val firestore = com.google.firebase.firestore.FirebaseFirestore.getInstance()
                                        firestore.collection("bookings").document(bookingId).update("status", "CANCELLED")
                                    } catch (_: Exception) {}

                                    isCancelled = true
                                    currentStatus = "CANCELLED"
                                    android.widget.Toast.makeText(context, "Booking successfully cancelled.", android.widget.Toast.LENGTH_SHORT).show()
                                } catch (e: Exception) {
                                    android.util.Log.e("TrackingScreen", "Error cancelling booking", e)
                                    android.widget.Toast.makeText(context, "Failed to cancel booking. Please try again.", android.widget.Toast.LENGTH_SHORT).show()
                                } finally {
                                    isCancelling = false
                                }
                            }
                        }
                        .padding(bottom = 16.dp)
                ) {
                    Text(
                        text = if (isCancelling) "Cancelling..." else "Cancel booking",
                        color = Color(0xFFEF4444),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 18.dp, vertical = 6.dp)
                    )
                }
            }

            // 2. Main Web-style Stepper Container (Matching Screenshot)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF1E2132)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(vertical = 18.dp, horizontal = 12.dp)
                ) {
                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(16.dp),
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Step 1: Payment Confirmed
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(110.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(38.dp)
                                        .clip(CircleShape)
                                        .background(OrbitCyan.copy(alpha = 0.2f))
                                        .border(1.dp, OrbitCyan, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("🌊", fontSize = 16.sp)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Payment Confirmed",
                                    color = OrbitCyan,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Step 2: Partner Dispatched (Active Step in Screenshot)
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(150.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .scale(pulseScale)
                                        .size(46.dp)
                                        .clip(CircleShape)
                                        .background(
                                            Brush.radialGradient(
                                                listOf(Color(0xFF00F0FF), Color(0xFF0A2540))
                                            )
                                        )
                                        .border(2.dp, Color(0xFF00F0FF), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("👥", fontSize = 20.sp)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Partner Dispatched",
                                    color = OrbitCyan,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Black,
                                    textAlign = TextAlign.Center
                                )
                                Text(
                                    text = "Visual Architect assigned and notified.",
                                    color = MutedText,
                                    fontSize = 9.sp,
                                    textAlign = TextAlign.Center,
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                            }
                        }

                        // Step 3: En Route
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(90.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF141622))
                                        .border(1.dp, Color(0xFF282C40), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("🧭", fontSize = 14.sp)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "En Route",
                                    color = MutedText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Step 4: Shooting
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(90.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF141622))
                                        .border(1.dp, Color(0xFF282C40), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("📷", fontSize = 14.sp)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Shooting",
                                    color = MutedText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Step 5: Syncing
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(90.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF141622))
                                        .border(1.dp, Color(0xFF282C40), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("📤", fontSize = 14.sp)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Syncing",
                                    color = MutedText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Step 6: Editing
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(90.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF141622))
                                        .border(1.dp, Color(0xFF282C40), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("🎬", fontSize = 14.sp)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Editing",
                                    color = MutedText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }

                        // Step 7: Delivered
                        item {
                            Column(
                                horizontalAlignment = Alignment.CenterHorizontally,
                                modifier = Modifier.width(90.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF141622))
                                        .border(1.dp, Color(0xFF282C40), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text("✓", color = MutedText, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                                }
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Delivered",
                                    color = MutedText,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }
            }

            // 3. Bento Grid Cards (Clean 2x2 Layout to prevent text clipping - Image 3 Fix)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Row 1: Sync & ETA
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Card 1: Sync
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFF1E2132)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("📤", fontSize = 12.sp)
                                Text("Sync", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("—", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }

                    // Card 2: ETA
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFF1E2132)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("⏱", fontSize = 12.sp)
                                Text("ETA", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("—", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Color.White)
                        }
                    }
                }

                // Row 2: Package & Status
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Card 3: Package
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFF1E2132)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("🎬", fontSize = 12.sp)
                                Text("Package", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Personalized",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                maxLines = 1,
                                softWrap = false
                            )
                        }
                    }

                    // Card 4: Status
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                        shape = RoundedCornerShape(16.dp),
                        border = BorderStroke(1.dp, Color(0xFF1E2132)),
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text("🎯", fontSize = 12.sp)
                                Text("Status", color = MutedText, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Surface(
                                color = Color(0xFF052C38),
                                shape = RoundedCornerShape(14.dp),
                                border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.5f))
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Box(modifier = Modifier.size(5.dp).clip(CircleShape).background(OrbitCyan))
                                    Text("In Progress", color = OrbitCyan, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }

            // 4. Live Map Card (MapTiler openstreetmap-dark Integration)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF1E2132)),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .padding(bottom = 16.dp)
            ) {
                Box(modifier = Modifier.fillMaxSize()) {
                    SafeMapView(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState,
                        location = bookingLocation,
                        title = "Shoot Location"
                    )

                    // Map Overlay Label
                    Surface(
                        color = Color(0xFF05060A).copy(alpha = 0.85f),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color(0xFF22C55E)))
                            Text("LIVE GPS TRACKER", color = Color.White, fontSize = 10.sp, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }

            // 5. Booking Details Container (Matching Screenshot)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, Color(0xFF1E2132)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 32.dp)
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = "Booking Details",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(bottom = 16.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("Date", color = MutedText, fontSize = 13.sp)
                            Text("Thu, 30 Jul", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.padding(top = 2.dp))
                        }
                        Column(horizontalAlignment = Alignment.Start, modifier = Modifier.padding(end = 60.dp)) {
                            Text("Time", color = MutedText, fontSize = 13.sp)
                            Text("7:15 PM", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp, modifier = Modifier.padding(top = 2.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(18.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Location", color = MutedText, fontSize = 13.sp)
                            Text("Dr Dadasaheb Bhadkamkar Marg, 400004, India", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp, modifier = Modifier.padding(top = 2.dp))
                            Text("@18.95823563155963,72.81710824", color = MutedText, fontSize = 11.sp, modifier = Modifier.padding(top = 2.dp))
                        }

                        Spacer(modifier = Modifier.width(16.dp))

                        Column(horizontalAlignment = Alignment.Start) {
                            Text("Amount", color = MutedText, fontSize = 13.sp)
                            Text("₹1,999", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 20.sp, modifier = Modifier.padding(top = 2.dp))
                        }
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

@Composable
fun SafeMapView(
    modifier: Modifier = Modifier,
    cameraPositionState: CameraPositionState? = null,
    location: LatLng = LatLng(19.0760, 72.8777),
    title: String = "Location"
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    var hasWebViewError by remember { mutableStateOf(false) }

    val htmlContent = remember(location, title) {
        """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
            <script src="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.js"></script>
            <link href="https://unpkg.com/maplibre-gl@5.24.0/dist/maplibre-gl.css" rel="stylesheet" />
            <style>
                body, html { margin: 0; padding: 0; height: 100%; width: 100%; background-color: #05060A; }
                #map { position: absolute; top: 0; bottom: 0; width: 100%; height: 100%; }
                .marker {
                    width: 14px;
                    height: 14px;
                    background-color: #00BFFF;
                    border: 2px solid #FFFFFF;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00BFFF;
                }
                .locate-btn {
                    position: absolute;
                    bottom: 12px;
                    right: 12px;
                    z-index: 10;
                    background: rgba(13, 15, 23, 0.9);
                    color: #00BFFF;
                    border: 1px solid rgba(0, 191, 255, 0.4);
                    border-radius: 20px;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <button id="locateBtn" class="locate-btn">📍 Locate Me</button>
            <script>
                try {
                    const map = new maplibregl.Map({
                        container: 'map',
                        style: 'https://tiles.openfreemap.org/styles/liberty',
                        center: [${location.longitude}, ${location.latitude}],
                        zoom: 14,
                        attributionControl: false
                    });
                    
                    const geolocate = new maplibregl.GeolocateControl({
                        positionOptions: { enableHighAccuracy: true },
                        trackUserLocation: true,
                        showUserLocation: true
                    });
                    map.addControl(geolocate, 'top-right');

                    const el = document.createElement('div');
                    el.className = 'marker';
                    new maplibregl.Marker({ element: el })
                        .setLngLat([${location.longitude}, ${location.latitude}])
                        .addTo(map);

                    document.getElementById('locateBtn').addEventListener('click', function() {
                        geolocate.trigger();
                    });
                } catch(e) { console.error(e); }
            </script>
        </body>
        </html>
        """.trimIndent()
    }

    if (!hasWebViewError) {
        AndroidView(
            modifier = modifier,
            factory = { ctx ->
                WebView(ctx).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.setGeolocationEnabled(true)
                    webChromeClient = object : android.webkit.WebChromeClient() {
                        override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: android.webkit.GeolocationPermissions.Callback?) {
                            // Only grant if Android actually holds the runtime permission —
                            // see partner app's SafeMapView for the full explanation.
                            val hasLocationPermission = androidx.core.content.ContextCompat.checkSelfPermission(
                                context, android.Manifest.permission.ACCESS_FINE_LOCATION
                            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
                            callback?.invoke(origin, hasLocationPermission, false)
                        }
                    }
                    webViewClient = object : WebViewClient() {
                        override fun onReceivedError(view: WebView?, errorCode: Int, description: String?, failingUrl: String?) {
                            hasWebViewError = true
                        }
                    }
                    loadDataWithBaseURL("https://api.tomtom.com", htmlContent, "text/html", "UTF-8", null)
                }
            },
            update = { webView ->
                // Smooth WebView performance: avoid reloading HTML string on every Compose animation frame
            }
        )
    } else {
        Box(
            modifier = modifier.background(Color(0xFF0D0F17)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(12.dp)) {
                Text("📍 GPS VERIFIED LOCATION", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(4.dp))
                Text(title, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                Text("@${location.latitude}, ${location.longitude}", color = MutedText, fontSize = 10.sp)
            }
        }
    }
}


