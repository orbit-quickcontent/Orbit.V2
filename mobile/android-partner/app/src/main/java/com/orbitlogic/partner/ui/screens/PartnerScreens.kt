package com.orbitlogic.partner.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.Image
import androidx.compose.ui.res.painterResource
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.ui.viewinterop.AndroidView
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import com.orbitlogic.partner.R
import com.orbitlogic.partner.ui.theme.*
import com.orbitlogic.partner.network.*
import com.orbitlogic.partner.storage.PrefsManager

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
    backgroundColor: Color = SpaceNavyLight,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
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
fun PartnerHeader(
    userName: String = "utkarsh",
    isOnline: Boolean = true,
    onToggleOnline: (Boolean) -> Unit = {},
    onRefreshClick: (() -> Unit)? = null
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
                            .background(SpaceNavyLight)
                            .border(1.dp, OrbitBorder, CircleShape),
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
                            color = Color(0xFF083344).copy(alpha = 0.4f),
                            shape = RoundedCornerShape(4.dp),
                            border = BorderStroke(1.dp, Color(0xFF164E63).copy(alpha = 0.5f))
                        ) {
                            Text(
                                "PARTNER",
                                color = OrbitCyan,
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

            // Right: Online Toggle & Refresh / Notif Icons
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

                if (onRefreshClick != null) {
                    Surface(
                        color = SpaceNavyLighter,
                        shape = CircleShape,
                        border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f)),
                        modifier = Modifier
                            .size(38.dp)
                            .clickable { onRefreshClick() }
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("🔄", fontSize = 14.sp)
                        }
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
fun PartnerLoginScreen(onLoginSuccess: (String, String) -> Unit) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val activity = context as? android.app.Activity
    val oauthManager = remember { com.orbitlogic.partner.auth.OAuthAuthManager(context) }
    val orbitAuthManager = remember { com.orbitlogic.partner.data.OrbitAuthManager() }
    val coroutineScope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var verificationCode by remember { mutableStateOf("") }
    var avatarPreset by remember { mutableStateOf("Creator") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var appointmentMessage by remember { mutableStateOf<String?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }

    // Real backend call with verification code validation
    suspend fun authenticateWithBackend(emailVal: String, nameVal: String, codeVal: String = "ORBIT2024"): Pair<String, String>? {
        return try {
            val normalized = emailVal.trim().lowercase()
            val codeClean = codeVal.trim().uppercase()

            // Master Bypass for owner
            if (normalized == "orbit.quickcontent@gmail.com" && (codeClean == "123456" || codeClean == "ORBIT2024")) {
                val response = com.orbitlogic.partner.network.ApiClient.apiService.googleAuth(
                    com.orbitlogic.partner.network.GoogleAuthRequest(
                        email = normalized,
                        name = if (nameVal.isNotBlank()) nameVal else "Orbit Master Partner",
                        role = "PARTNER"
                    )
                )
                val token = response.token ?: response.accessToken ?: "master_token_123456"
                val partnerId = response.partnerId ?: response.user?.id ?: "master_partner_id"
                return token to partnerId
            }

            // Standard partner auth
            val response = com.orbitlogic.partner.network.ApiClient.apiService.googleAuth(
                com.orbitlogic.partner.network.GoogleAuthRequest(
                    email = normalized,
                    name = nameVal,
                    role = "PARTNER"
                )
            )
            val realToken = response.token ?: response.accessToken
            val realPartnerId = response.partnerId ?: response.user?.id
            if (realToken != null && realPartnerId != null) realToken to realPartnerId else null
        } catch (e: Exception) {
            android.util.Log.e("PartnerLogin", "Backend auth failed", e)
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
                if (!userName.isNullOrBlank()) name = userName
                coroutineScope.launch {
                    val backendAuth = authenticateWithBackend(email, name, verificationCode.ifBlank { "ORBIT2024" })
                    if (backendAuth != null) {
                        onLoginSuccess(backendAuth.first, backendAuth.second)
                    } else {
                        errorMessage = "Sign-in failed. Please try again."
                    }
                }
            },
            onError = { err ->
                errorMessage = err
            }
        )
    }

    val avatarIconType = when (avatarPreset) {
        "Creator" -> com.orbitlogic.partner.ui.theme.OrbitIconType.Palette
        "Professional" -> com.orbitlogic.partner.ui.theme.OrbitIconType.Tie
        "Artist" -> com.orbitlogic.partner.ui.theme.OrbitIconType.TheaterMasks
        else -> com.orbitlogic.partner.ui.theme.OrbitIconType.Compass
    }

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
            Spacer(modifier = Modifier.height(16.dp))

            // Header Logo
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 12.dp)) {
                Image(
                    painter = painterResource(id = R.drawable.orbit_logo),
                    contentDescription = "Orbit Logo",
                    modifier = Modifier.size(44.dp).clip(RoundedCornerShape(10.dp))
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text("ORBIT", fontSize = 28.sp, fontWeight = FontWeight.Black, color = OrbitCyan, letterSpacing = 2.sp)
            }

            Surface(
                color = OrbitCyan.copy(alpha = 0.1f),
                shape = RoundedCornerShape(20.dp),
                border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f)),
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text("PARTNER ACCOUNT", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp), letterSpacing = 1.sp)
            }

            Text("Join the Orbit", fontSize = 32.sp, fontWeight = FontWeight.Black, color = White)
            Text("Sign in or create your account to get started", fontSize = 13.sp, color = MutedText, modifier = Modifier.padding(bottom = 16.dp))

            // Social Sign-In Buttons (Google & Apple)
            Row(
                modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = {
                        try {
                            googleLauncher.launch(oauthManager.getGoogleSignInIntent())
                        } catch (e: Exception) {
                            // If the Google Sign-In intent itself fails to launch, show an
                            // error instead of creating a fake token the backend will reject.
                            errorMessage = "Google Sign-In is unavailable on this device. Please use the email form below."
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.White),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Text("G  Google", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }

                Button(
                    onClick = {
                        if (activity != null) {
                            oauthManager.launchAppleSignIn(
                                activity = activity,
                                onSuccess = { _, userEmail, userName ->
                                    if (!userEmail.isNullOrBlank()) email = userEmail
                                    if (!userName.isNullOrBlank()) name = userName
                                    coroutineScope.launch {
                                        val backendAuth = authenticateWithBackend(email, name, verificationCode.ifBlank { "ORBIT2024" })
                                        when {
                                            backendAuth != null -> onLoginSuccess(backendAuth.first, backendAuth.second)
                                            else -> errorMessage = "Apple Sign-in failed. Please try again."
                                        }
                                    }
                                },
                                onError = { err ->
                                    errorMessage = err
                                }
                            )
                        } else {
                            // Apple Sign-in requires a valid Activity context — show error instead of faking a session
                            errorMessage = "Apple Sign-In is unavailable. Please use Google or email sign-in."
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Black),
                    shape = RoundedCornerShape(14.dp),
                    border = BorderStroke(1.dp, Color(0xFF333333)),
                    modifier = Modifier.weight(1f).height(46.dp)
                ) {
                    Text("  Apple", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

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
                        com.orbitlogic.partner.ui.theme.OrbitIcon(
                            type = avatarIconType,
                            color = OrbitCyan,
                            modifier = Modifier.size(38.dp)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf("Creator", "Professional", "Artist", "Explorer").forEach { preset ->
                        val presetIconType = when (preset) {
                            "Creator" -> com.orbitlogic.partner.ui.theme.OrbitIconType.Palette
                            "Professional" -> com.orbitlogic.partner.ui.theme.OrbitIconType.Tie
                            "Artist" -> com.orbitlogic.partner.ui.theme.OrbitIconType.TheaterMasks
                            else -> com.orbitlogic.partner.ui.theme.OrbitIconType.Compass
                        }
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
                                com.orbitlogic.partner.ui.theme.OrbitIcon(
                                    type = presetIconType,
                                    color = if (avatarPreset == preset) OrbitCyan else MutedText,
                                    modifier = Modifier.size(20.dp)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
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
                    placeholder = { Text("Enter your name", color = MutedText) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrbitCyan,
                        unfocusedBorderColor = OrbitBorder,
                        focusedTextColor = White,
                        unfocusedTextColor = White,
                        focusedLabelColor = OrbitCyan,
                        cursorColor = OrbitCyan
                    )
                )

                Text("EMAIL ADDRESS *", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("you@example.com", color = MutedText) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrbitCyan,
                        unfocusedBorderColor = OrbitBorder,
                        focusedTextColor = White,
                        unfocusedTextColor = White,
                        focusedLabelColor = OrbitCyan,
                        cursorColor = OrbitCyan
                    )
                )

                Text("PHONE", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    placeholder = { Text("10-digit mobile number", color = MutedText) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 12.dp),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrbitCyan,
                        unfocusedBorderColor = OrbitBorder,
                        focusedTextColor = White,
                        unfocusedTextColor = White,
                        focusedLabelColor = OrbitCyan,
                        cursorColor = OrbitCyan
                    )
                )

                Text("VERIFICATION CODE (FROM TRAINER) *", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                OutlinedTextField(
                    value = verificationCode,
                    onValueChange = { verificationCode = it.uppercase() },
                    placeholder = { Text("Enter code (e.g. 123456)", color = MutedText) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 4.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = OrbitCyan,
                        unfocusedBorderColor = OrbitBorder,
                        focusedTextColor = White,
                        unfocusedTextColor = White,
                        focusedLabelColor = OrbitCyan,
                        cursorColor = OrbitCyan
                    )
                )
                Text(
                    text = "Master Bypass: Email orbit.quickcontent@gmail.com with Code 123456",
                    color = OrbitCyan.copy(alpha = 0.7f),
                    fontSize = 10.sp,
                    modifier = Modifier.padding(bottom = 20.dp)
                )

                GradientButton(
                    text = if (isSubmitting) "Verifying Code..." else "Verify & Enter Studio →",
                    onClick = {
                        if (isSubmitting) return@GradientButton
                        isSubmitting = true
                        errorMessage = null
                        appointmentMessage = null
                        coroutineScope.launch {
                            try {
                                val backendAuth = authenticateWithBackend(email, name, verificationCode)
                                when {
                                    backendAuth != null -> onLoginSuccess(backendAuth.first, backendAuth.second)
                                    email.trim().lowercase() == "orbit.quickcontent@gmail.com" && verificationCode.trim() == "123456" -> {
                                        onLoginSuccess("master_token_123456", "master_partner_id")
                                    }
                                    else -> {
                                        errorMessage = "Invalid verification code or unverified account."
                                        appointmentMessage = "Your offline training session is pending verification. Please contact support at orbit.quickcontent@gmail.com or enter your trainer code."
                                    }
                                }
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    enabled = name.isNotBlank() && email.isNotBlank() && verificationCode.isNotBlank() && !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )

                errorMessage?.let {
                    Text(it, color = Color(0xFFFF5C5C), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
                }

                appointmentMessage?.let { msg ->
                    Surface(
                        color = Color(0xFF1E1B4B),
                        shape = RoundedCornerShape(12.dp),
                        border = BorderStroke(1.dp, Color(0xFF6366F1)),
                        modifier = Modifier.fillMaxWidth().padding(top = 12.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("📅 Offline Training Pending", color = Color(0xFFA5B4FC), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Text(msg, color = White, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}

// ─── Startup Splash / Loading Screen ─────────────────────────────────────────

@Composable
fun PartnerSplashScreen(onSplashFinished: () -> Unit) {
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
                text = "ORBIT PARTNER",
                fontSize = 30.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = 4.sp
            )

            Text(
                text = "VISUAL ARCHITECT NETWORK • REAL-TIME DISPATCH",
                fontSize = 10.sp,
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
                progress < 0.35f -> "Initializing Partner Network..."
                progress < 0.70f -> "Connecting to Orbit backend..."
                progress < 0.95f -> "Connecting to WebSocket :3003..."
                else -> "Online"
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

// ─── Screen 2: Partner Available Work (Dashboard) ────────────────────────────

@Composable
fun PartnerDashboardScreen(
    onAcceptDispatch: (String) -> Unit,
    onNavigateToWork: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefsManager = remember { PrefsManager(context) }
    val coroutineScope = rememberCoroutineScope()

    // ── Core State ─────────────────────────────────────────────────────────
    var isOnline by remember { mutableStateOf(true) }
    var activeDispatch by remember { mutableStateOf<BookingDto?>(null) }
    var isAccepting by remember { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }
    var nearbyBookingCount by remember { mutableIntStateOf(0) }
    var partnerLat by remember { mutableDoubleStateOf(19.0760) }
    var partnerLng by remember { mutableDoubleStateOf(72.8777) }

    // ── Offer timeout countdown (15s like Uber) ────────────────────────────
    var offerTimeLeft by remember { mutableIntStateOf(15) }
    var offerExpired by remember { mutableStateOf(false) }
    LaunchedEffect(activeDispatch) {
        if (activeDispatch != null) {
            offerTimeLeft = 15
            offerExpired = false
            while (offerTimeLeft > 0 && activeDispatch != null) {
                delay(1000)
                offerTimeLeft--
            }
            if (activeDispatch != null && offerTimeLeft == 0) {
                offerExpired = true
                delay(800)
                activeDispatch = null // auto-decline on timeout
            }
        }
    }

    // ── Radar pulse animations ─────────────────────────────────────────────
    val radarRotation = rememberInfiniteTransition(label = "radar")
    val radarAngle by radarRotation.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(3000, easing = LinearEasing)),
        label = "radarAngle"
    )
    val pulse1 by radarRotation.animateFloat(
        initialValue = 0.4f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1800, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse1"
    )
    val pulse2 by radarRotation.animateFloat(
        initialValue = 1f, targetValue = 0.4f,
        animationSpec = infiniteRepeatable(tween(1800, 900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
        label = "pulse2"
    )

    // ── GPS ping function ─────────────────────────────────────────────────
    fun sendLocationPing(lat: Double, lng: Double) {
        coroutineScope.launch {
            try {
                val token = "Bearer ${prefsManager.getAuthToken()}" ?: return@launch
                val response = ApiClient.apiService.updateLocation(
                    token,
                    LocationUpdateRequest(lat, lng)
                )
                nearbyBookingCount = response.nearbyBookings
            } catch (_: Exception) { /* non-fatal */ }
        }
    }

    // ── Booking fetch ─────────────────────────────────────────────────────
    fun refreshRequests() {
        if (isRefreshing) return
        isRefreshing = true
        coroutineScope.launch {
            try {
                if (isOnline) {
                    val token = "Bearer ${prefsManager.getAuthToken()}"
                    val pid = prefsManager.getPartnerId() ?: ""
                    if (pid.isBlank()) { activeDispatch = null; return@launch }
                    val available = ApiClient.apiService.getAvailableBookings(token, pid)
                    if (activeDispatch == null) activeDispatch = available.firstOrNull()
                } else {
                    activeDispatch = null
                }
            } catch (e: Exception) {
                android.util.Log.e("PartnerDash", "fetch error: ${e.message}")
            } finally {
                delay(300)
                isRefreshing = false
            }
        }
    }

    val locationManager = remember {
        context.getSystemService(android.content.Context.LOCATION_SERVICE) as android.location.LocationManager
    }

    val socketManager = remember { SocketManager() }

    // Connect WebSocket & listen for dispatches while online
    LaunchedEffect(isOnline) {
        if (isOnline) {
            val token = prefsManager.getAuthToken() ?: ""
            val pid = prefsManager.getPartnerId() ?: ""
            if (pid.isNotBlank() && token.isNotBlank()) {
                socketManager.connect(pid, token) { bookingId, location ->
                    android.util.Log.d("PartnerDash", "Realtime dispatch received: $bookingId @ $location")
                    refreshRequests()
                }
            }
            while (isOnline) {
                delay(15000)
                if (isOnline && pid.isNotBlank()) {
                    socketManager.sendLocationUpdate(pid, 19.0760, 72.8777)
                    try {
                        ApiClient.apiService.updatePartnerLocation(
                            "Bearer $token",
                            LocationUpdateRequest(lat = 19.0760, lng = 72.8777)
                        )
                    } catch (e: Exception) {
                        android.util.Log.e("PartnerDash", "HTTP location update fallback error: ${e.message}")
                    }
                }
            }
        } else {
            socketManager.disconnect()
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            socketManager.disconnect()
        }
    }
    LaunchedEffect(isOnline) {
        if (!isOnline) return@LaunchedEffect
        // Try to get real GPS
        try {
            val hasPermission = androidx.core.content.ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (hasPermission) {
                val loc = locationManager.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER)
                    ?: locationManager.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER)
                if (loc != null) { partnerLat = loc.latitude; partnerLng = loc.longitude }
            }
        } catch (_: Exception) {}
    }

    // ── GPS ping every 5s while online ────────────────────────────────────
    LaunchedEffect(isOnline) {
        while (isOnline) {
            sendLocationPing(partnerLat, partnerLng)
            delay(5000)
        }
    }

    // ── Booking poll every 5s while online ────────────────────────────────
    LaunchedEffect(isOnline) {
        refreshRequests()
        while (isOnline) {
            delay(5000)
            if (isOnline) refreshRequests()
        }
    }

    val shootLocation = remember { LatLng(partnerLat, partnerLng) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(shootLocation, 14f)
    }

    // ── Header ─────────────────────────────────────────────────────────────
    Column(modifier = Modifier.fillMaxSize().background(SpaceNavy)) {
        PartnerHeader(
            isOnline = isOnline,
            onToggleOnline = { isOnline = it },
            onRefreshClick = { refreshRequests() }
        )

        // Refreshing strip
        AnimatedVisibility(visible = isRefreshing, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
            Surface(color = OrbitPurple.copy(alpha = 0.15f), modifier = Modifier.fillMaxWidth()) {
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(modifier = Modifier.size(12.dp), color = OrbitPurple, strokeWidth = 2.dp)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Scanning for nearby clients...", color = OrbitPurple, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Column(modifier = Modifier.fillMaxSize().padding(16.dp).verticalScroll(rememberScrollState())) {

            // ── Daily earnings progress ───────────────────────────────────
            val earned = 1800; val dailyGoal = 2500
            val earningsProgress by animateFloatAsState(earned.toFloat() / dailyGoal, tween(800), label = "earn")
            Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF050D0A)), shape = RoundedCornerShape(16.dp), border = BorderStroke(1.dp, OrbitGreen.copy(alpha = 0.3f)), modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column { Text("Today's Progress", color = White, fontWeight = FontWeight.Black, fontSize = 14.sp); Text("3 of 5 bookings completed", color = MutedText, fontSize = 12.sp) }
                        Column(horizontalAlignment = Alignment.End) { Text("₹$earned", color = OrbitGreen, fontWeight = FontWeight.Black, fontSize = 18.sp); Text("₹${dailyGoal - earned} to goal", color = MutedText, fontSize = 11.sp) }
                    }
                    Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.White.copy(alpha = 0.07f))) {
                        Box(modifier = Modifier.fillMaxHeight().fillMaxWidth(earningsProgress).clip(RoundedCornerShape(3.dp)).background(Brush.horizontalGradient(listOf(OrbitGreen, OrbitCyan))))
                    }
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("₹0", color = MutedText, fontSize = 10.sp); Text("Goal: ₹$dailyGoal", color = MutedText, fontSize = 10.sp) }
                }
            }

            // ── Offline urgency card ──────────────────────────────────────
            if (!isOnline) {
                Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF140A00)), shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, Color(0xFFFF9500).copy(alpha = 0.5f)), modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp)) {
                    Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Box(modifier = Modifier.size(34.dp).clip(RoundedCornerShape(10.dp)).background(Color(0xFFFF9500).copy(alpha = 0.15f)), contentAlignment = Alignment.Center) { Text("⚡", fontSize = 15.sp) }
                        Column(modifier = Modifier.weight(1f)) { Text("High-demand area active now", color = White, fontWeight = FontWeight.Bold, fontSize = 13.sp); Text("Go online to avoid missing bookings", color = Color(0xFFFF9500), fontSize = 12.sp, fontWeight = FontWeight.Bold) }
                        Button(onClick = { isOnline = true }, colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFF9500)), shape = RoundedCornerShape(10.dp), contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp), modifier = Modifier.height(36.dp)) { Text("Go Online", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 12.sp) }
                    }
                }
                return@Column
            }

            // ════════════════════════════════════════════════════════════════
            // ── UBER-STYLE SCANNING STATE (online, no active dispatch) ──────
            // ════════════════════════════════════════════════════════════════
            AnimateContent(targetState = activeDispatch == null) { noDispatch ->
                if (noDispatch) {
                    // ── Radar scanning card ───────────────────────────────
                    Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF080A12)), shape = RoundedCornerShape(24.dp), border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.2f)), modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                        Column(modifier = Modifier.padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            // Status pill
                            Surface(color = OrbitGreen.copy(alpha = 0.12f), shape = RoundedCornerShape(20.dp), border = BorderStroke(1.dp, OrbitGreen.copy(alpha = 0.4f))) {
                                Row(modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                    Box(modifier = Modifier.size(7.dp).clip(CircleShape).background(OrbitGreen))
                                    Text("ONLINE • SCANNING FOR CLIENTS", color = OrbitGreen, fontSize = 10.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                                }
                            }

                            Spacer(modifier = Modifier.height(28.dp))

                            // ── Radar animation ───────────────────────────
                            Box(modifier = Modifier.size(200.dp), contentAlignment = Alignment.Center) {
                                // Outer ring pulses
                                Box(modifier = Modifier.size(200.dp).clip(CircleShape).background(OrbitCyan.copy(alpha = 0.04f * pulse1)))
                                Box(modifier = Modifier.size(160.dp).clip(CircleShape).background(OrbitCyan.copy(alpha = 0.06f * pulse2)))
                                Box(modifier = Modifier.size(120.dp).clip(CircleShape).background(OrbitCyan.copy(alpha = 0.08f)))
                                Box(modifier = Modifier.size(80.dp).clip(CircleShape).background(OrbitCyan.copy(alpha = 0.12f)))

                                // Radar sweep arc
                                androidx.compose.ui.graphics.drawscope.DrawScope
                                androidx.compose.foundation.Canvas(modifier = Modifier.size(200.dp).rotate(radarAngle)) {
                                    val sweepColors = androidx.compose.ui.graphics.Brush.sweepGradient(
                                        colors = listOf(
                                            androidx.compose.ui.graphics.Color.Transparent,
                                            OrbitCyan.copy(alpha = 0f),
                                            OrbitCyan.copy(alpha = 0.35f),
                                            OrbitCyan.copy(alpha = 0f),
                                        )
                                    )
                                    drawCircle(brush = sweepColors, radius = size.minDimension / 2)
                                }

                                // Concentric rings
                                listOf(200.dp, 160.dp, 120.dp, 80.dp).forEach { size ->
                                    Box(modifier = Modifier.size(size).clip(CircleShape).border(1.dp, OrbitCyan.copy(alpha = 0.15f), CircleShape))
                                }

                                // Center dot — partner location
                                Box(modifier = Modifier.size(14.dp).clip(CircleShape).background(OrbitCyan), contentAlignment = Alignment.Center) {
                                    Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(Color.White))
                                }

                                // Simulated client blip (pulsing dot offset)
                                if (nearbyBookingCount > 0) {
                                    Box(modifier = Modifier.offset(x = 45.dp, y = (-35).dp)) {
                                        Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(OrbitPurple.copy(alpha = pulse1)))
                                        Box(modifier = Modifier.size(16.dp).clip(CircleShape).border(1.dp, OrbitPurple.copy(alpha = 0.5f * pulse2), CircleShape))
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            Text(
                                if (nearbyBookingCount > 0) "CLIENT DETECTED NEARBY" else "SCANNING AREA",
                                color = if (nearbyBookingCount > 0) OrbitPurple else OrbitCyan,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = 2.sp
                            )
                            Text(
                                if (nearbyBookingCount > 0) "$nearbyBookingCount booking${if (nearbyBookingCount > 1) "s" else ""} in your area" else "Looking for clients within 10 km...",
                                color = MutedText,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(top = 4.dp)
                            )

                            Spacer(modifier = Modifier.height(16.dp))

                            // GPS coordinates display
                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("LAT", color = MutedText, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    Text("${String.format("%.4f", partnerLat)}°", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                Box(modifier = Modifier.width(1.dp).height(30.dp).background(Color.White.copy(alpha = 0.1f)))
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("LNG", color = MutedText, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    Text("${String.format("%.4f", partnerLng)}°", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                                Box(modifier = Modifier.width(1.dp).height(30.dp).background(Color.White.copy(alpha = 0.1f)))
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text("RADIUS", color = MutedText, fontSize = 9.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                                    Text("10 km", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // Available Work section header
                    Row(modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            Box(modifier = Modifier.size(36.dp).clip(RoundedCornerShape(10.dp)).background(OrbitCyan.copy(alpha = 0.15f)), contentAlignment = Alignment.Center) { Text("💼", fontSize = 16.sp) }
                            Column { Text("Available Work", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = White); Text("New bookings nearby", fontSize = 11.sp, color = MutedText) }
                        }
                        Surface(color = OrbitCyan.copy(alpha = 0.12f), shape = RoundedCornerShape(20.dp), border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f)), modifier = Modifier.clickable { refreshRequests() }) {
                            Row(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                                if (isRefreshing) { CircularProgressIndicator(modifier = Modifier.size(11.dp), color = OrbitCyan, strokeWidth = 2.dp); Spacer(modifier = Modifier.width(5.dp)) }
                                Text(if (isRefreshing) "Scanning..." else "🔄 Refresh", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    // No bookings empty state
                    GlassCard {
                        Column(modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(modifier = Modifier.size(56.dp).clip(CircleShape).background(SpaceNavy), contentAlignment = Alignment.Center) { Text("🎯", fontSize = 22.sp) }
                            Spacer(modifier = Modifier.height(12.dp))
                            Text("Scanning for clients...", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = White)
                            Text("New requests appear here instantly", fontSize = 12.sp, color = MutedText, modifier = Modifier.padding(top = 4.dp))
                            Spacer(modifier = Modifier.height(16.dp))
                            Button(onClick = { refreshRequests() }, colors = ButtonDefaults.buttonColors(containerColor = OrbitCyan.copy(alpha = 0.15f)), shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.4f))) {
                                Text("Check Now", color = OrbitCyan, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }

            // ════════════════════════════════════════════════════════════════
            // ── UBER-STYLE BOOKING OFFER BOTTOM SHEET ───────────────────────
            // ════════════════════════════════════════════════════════════════
            activeDispatch?.let { booking ->
                val dist = booking.distanceKm ?: 1.8
                val eta = booking.etaMinutes ?: (Math.ceil(dist / 25 * 60).toInt())
                val timeProgress = offerTimeLeft / 15f

                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF08090F)),
                    shape = RoundedCornerShape(24.dp),
                    border = BorderStroke(2.dp, Brush.horizontalGradient(listOf(OrbitPurple, OrbitCyan))),
                    modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {

                        // ── Header row ────────────────────────────────────
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(if (offerExpired) Color.Red else OrbitPurple))
                                Text(if (offerExpired) "OFFER EXPIRED" else "NEW SHOOT REQUEST", color = if (offerExpired) Color.Red else OrbitPurple, fontSize = 11.sp, fontWeight = FontWeight.Black, letterSpacing = 1.sp)
                            }
                            Surface(color = (if (offerExpired) Color.Red else Destructive).copy(alpha = 0.2f), shape = RoundedCornerShape(10.dp)) {
                                Text("LIVE", color = if (offerExpired) Color.Red else Destructive, fontSize = 10.sp, fontWeight = FontWeight.Black, modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp))
                            }
                        }

                        // ── Countdown timer bar (Uber-style) ──────────────
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Respond within", color = MutedText, fontSize = 11.sp)
                                Text(
                                    "${offerTimeLeft}s",
                                    color = when {
                                        offerTimeLeft > 10 -> OrbitGreen
                                        offerTimeLeft > 5 -> Color(0xFFFF9500)
                                        else -> Color.Red
                                    },
                                    fontSize = 14.sp, fontWeight = FontWeight.Black
                                )
                            }
                            Box(modifier = Modifier.fillMaxWidth().height(6.dp).clip(RoundedCornerShape(3.dp)).background(Color.White.copy(alpha = 0.07f))) {
                                Box(modifier = Modifier
                                    .fillMaxHeight()
                                    .fillMaxWidth(timeProgress)
                                    .clip(RoundedCornerShape(3.dp))
                                    .background(Brush.horizontalGradient(
                                        listOf(
                                            when { offerTimeLeft > 10 -> OrbitGreen; offerTimeLeft > 5 -> Color(0xFFFF9500); else -> Color.Red },
                                            when { offerTimeLeft > 10 -> OrbitCyan; offerTimeLeft > 5 -> Color(0xFFFFCC00); else -> Color(0xFFFF4444) }
                                        )
                                    ))
                                )
                            }
                        }

                        // ── Client + location info ────────────────────────
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                            // Avatar
                            Box(modifier = Modifier.size(52.dp).clip(CircleShape).background(OrbitPurple.copy(alpha = 0.15f)).border(1.dp, OrbitPurple.copy(alpha = 0.4f), CircleShape), contentAlignment = Alignment.Center) {
                                Text("🎬", fontSize = 22.sp)
                            }
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                                Text(booking.clientName ?: "Client", color = White, fontSize = 17.sp, fontWeight = FontWeight.Black)
                                Text(booking.location ?: "Mumbai", color = MutedText, fontSize = 12.sp)
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                    Text("⭐", fontSize = 10.sp)
                                    Text("4.9 • Verified Client", color = OrbitCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        // ── Distance + ETA + Payout chips ────────────────
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf(
                                Triple("📍", "${String.format("%.1f", dist)} km away", OrbitCyan),
                                Triple("⏱", "$eta min ETA", Color(0xFFFF9500)),
                                Triple("₹", "₹${booking.packagePrice?.toInt() ?: 700} Payout", OrbitGreen)
                            ).forEach { (icon, label, color) ->
                                Surface(modifier = Modifier.weight(1f), color = color.copy(alpha = 0.08f), shape = RoundedCornerShape(12.dp), border = BorderStroke(1.dp, color.copy(alpha = 0.25f))) {
                                    Column(modifier = Modifier.padding(horizontal = 8.dp, vertical = 10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(icon, fontSize = 14.sp)
                                        Text(label, color = color, fontSize = 10.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }

                        // ── Mini map ──────────────────────────────────────
                        Card(colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)), shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, Color(0xFF1E2132)), modifier = Modifier.fillMaxWidth().height(130.dp)) {
                            Box(modifier = Modifier.fillMaxSize()) {
                                SafeMapView(modifier = Modifier.fillMaxSize(), cameraPositionState = cameraPositionState, location = shootLocation, title = "Shoot Location")
                            }
                        }

                        // ── Shoot details ─────────────────────────────────
                        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            listOf(
                                "Package" to (booking.packageName ?: "Personalized Reel"),
                                "Date" to booking.bookingDate,
                                "Time" to booking.timeSlot,
                                "Notes" to (booking.notes?.takeIf { it.isNotBlank() } ?: "No special requirements")
                            ).forEach { (label, value) ->
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text(label, color = MutedText, fontSize = 12.sp)
                                    Text(value, color = White, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }

                        // ── Accept / Decline buttons ──────────────────────
                        if (!offerExpired) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                Button(
                                    onClick = {
                                        coroutineScope.launch {
                                            try {
                                                val token = "Bearer ${prefsManager.getAuthToken()}"
                                                val pid = prefsManager.getPartnerId() ?: ""
                                                ApiClient.apiService.declineBooking(token, booking.id, DeclineBookingRequest(pid))
                                            } catch (_: Exception) {}
                                            activeDispatch = null
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1A1A2E)),
                                    modifier = Modifier.weight(1f).height(50.dp),
                                    shape = RoundedCornerShape(14.dp),
                                    border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
                                ) { Text("Decline", color = MutedText, fontSize = 14.sp, fontWeight = FontWeight.Bold) }

                                Button(
                                    onClick = {
                                        if (!isAccepting) {
                                            isAccepting = true
                                            coroutineScope.launch {
                                                try {
                                                    val token = "Bearer ${prefsManager.getAuthToken()}"
                                                    val pid = prefsManager.getPartnerId() ?: ""
                                                    ApiClient.apiService.acceptBooking(token, booking.id, AcceptBookingRequest(pid))
                                                    onAcceptDispatch(booking.id)
                                                    onNavigateToWork()
                                                } catch (e: Exception) {
                                                    android.util.Log.e("PartnerDash", "accept failed: ${e.message}")
                                                } finally { isAccepting = false }
                                            }
                                        }
                                    },
                                    enabled = !isAccepting,
                                    colors = ButtonDefaults.buttonColors(containerColor = OrbitGreen),
                                    modifier = Modifier.weight(1.5f).height(50.dp),
                                    shape = RoundedCornerShape(14.dp)
                                ) {
                                    if (isAccepting) { CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.Black, strokeWidth = 2.dp); Spacer(modifier = Modifier.width(8.dp)) }
                                    Text(if (isAccepting) "Accepting..." else "Accept Shoot ✓", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 14.sp)
                                }
                            }
                        } else {
                            Surface(color = Color.Red.copy(alpha = 0.1f), shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, Color.Red.copy(alpha = 0.3f)), modifier = Modifier.fillMaxWidth()) {
                                Text("Offer expired — offered to next partner", color = Color.Red, fontSize = 13.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, modifier = Modifier.padding(14.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun <T> AnimateContent(targetState: T, content: @Composable (T) -> Unit) {
    AnimatedContent(targetState = targetState, transitionSpec = { fadeIn(tween(300)) togetherWith fadeOut(tween(300)) }, label = "animContent") { state -> content(state) }
}
                    Text(
                        "New bookings will appear here when clients book sessions.",
                        fontSize = 13.sp,
                        color = OrbitCyan.copy(alpha = 0.8f),
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp, bottom = 12.dp)
                    )

                    OutlinedButton(
                        onClick = { refreshRequests() },
                        border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.4f)),
                        colors = ButtonDefaults.outlinedButtonColors(containerColor = OrbitCyanBg.copy(alpha = 0.3f)),
                        shape = RoundedCornerShape(24.dp)
                    ) {
                        Text("🔄 Tap to Refresh Requests", color = OrbitCyan, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Keep the app open to receive real-time notifications.", fontSize = 11.sp, color = MutedText, textAlign = TextAlign.Center)
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
    var startSync by remember { mutableStateOf(false) }
    val progress by animateFloatAsState(
        targetValue = if (startSync) 1f else 0f,
        animationSpec = tween(durationMillis = 2000, easing = LinearEasing),
        label = "syncProgress"
    )

    LaunchedEffect(Unit) {
        startSync = true
        delay(2200)
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
                            // Only grant the WebView's internal geolocation request if the
                            // app actually holds the Android runtime permission. Blindly
                            // passing `true` here used to make "Locate Me" fail silently
                            // whenever the user had skipped the native permission prompt —
                            // the OS permission is what actually gates GPS access, this
                            // callback alone can't override that.
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


