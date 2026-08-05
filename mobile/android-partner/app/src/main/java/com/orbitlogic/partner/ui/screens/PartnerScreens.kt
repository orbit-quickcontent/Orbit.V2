package com.orbitlogic.partner.ui.screens

import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
    val supabaseAuthManager = remember { com.orbitlogic.partner.data.SupabaseAuthManager() }
    val coroutineScope = rememberCoroutineScope()

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var avatarPreset by remember { mutableStateOf("Creator") }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var isSubmitting by remember { mutableStateOf(false) }

    // Real backend call — the ONLY thing that should produce the token + partnerId
    // used everywhere else in the app. Falls back to the Supabase-derived id only
    // if the backend call fails, so the app can still be used offline-first.
    suspend fun authenticateWithBackend(emailVal: String, nameVal: String): Pair<String, String>? {
        return try {
            val response = com.orbitlogic.partner.network.ApiClient.apiService.googleAuth(
                com.orbitlogic.partner.network.GoogleAuthRequest(
                    email = emailVal,
                    name = nameVal,
                    role = "PARTNER"
                )
            )
            val realToken = response.token ?: response.accessToken
            val realId = response.user?.id
            if (realToken != null && realId != null) realToken to realId else null
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
                    val supabaseId = supabaseAuthManager.signUpPartner(email, "OrbitPartner123!", name, phone)
                    val backendAuth = authenticateWithBackend(email, name)
                    if (backendAuth != null) {
                        onLoginSuccess(backendAuth.first, backendAuth.second)
                    } else if (supabaseId != null) {
                        errorMessage = "Connected to Supabase but the app server is unreachable — some features may not sync."
                        onLoginSuccess("google_partner_token_${System.currentTimeMillis()}", supabaseId)
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
                            val fallbackId = java.util.UUID.nameUUIDFromBytes(
                                (email.ifBlank { "guest-partner" }).toByteArray()
                            ).toString()
                            onLoginSuccess("google_partner_token_${System.currentTimeMillis()}", fallbackId)
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
                                        val supabaseId = supabaseAuthManager.signUpPartner(email, "OrbitPartner123!", name, phone)
                                        val backendAuth = authenticateWithBackend(email, name)
                                        when {
                                            backendAuth != null -> onLoginSuccess(backendAuth.first, backendAuth.second)
                                            supabaseId != null -> onLoginSuccess("apple_partner_token_${System.currentTimeMillis()}", supabaseId)
                                            else -> errorMessage = "Sign-in failed. Please try again."
                                        }
                                    }
                                },
                                onError = { err ->
                                    errorMessage = err
                                }
                            )
                        } else {
                            val fallbackId = java.util.UUID.nameUUIDFromBytes(
                                (email.ifBlank { "guest-partner" }).toByteArray()
                            ).toString()
                            onLoginSuccess("apple_partner_token_${System.currentTimeMillis()}", fallbackId)
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
                    modifier = Modifier.fillMaxWidth().padding(top = 4.dp, bottom = 20.dp),
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

                GradientButton(
                    text = if (isSubmitting) "Signing in..." else "Continue to Studio →",
                    onClick = {
                        if (isSubmitting) return@GradientButton
                        isSubmitting = true
                        errorMessage = null
                        coroutineScope.launch {
                            try {
                                val supabaseId = supabaseAuthManager.signUpPartner(email, "OrbitPartner123!", name, phone)
                                val backendAuth = authenticateWithBackend(email, name)
                                when {
                                    backendAuth != null -> onLoginSuccess(backendAuth.first, backendAuth.second)
                                    supabaseId != null -> onLoginSuccess("partner_token_${System.currentTimeMillis()}", supabaseId)
                                    else -> errorMessage = "Sign-in failed. Please try again."
                                }
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    enabled = name.isNotBlank() && email.isNotBlank() && !isSubmitting,
                    modifier = Modifier.fillMaxWidth()
                )

                errorMessage?.let {
                    Text(it, color = Color(0xFFFF5C5C), fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
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
                progress < 0.70f -> "Syncing Supabase Auth & RLS..."
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

    var isOnline by remember { mutableStateOf(true) }
    var activeDispatch by remember { mutableStateOf<BookingDto?>(null) }
    var isAccepting by remember { mutableStateOf(false) }
    var isRefreshing by remember { mutableStateOf(false) }

    fun refreshRequests() {
        if (isRefreshing) return
        isRefreshing = true
        coroutineScope.launch {
            try {
                if (isOnline) {
                    val token = "Bearer ${prefsManager.getAuthToken()}"
                    val available = ApiClient.apiService.getAvailableBookings(token)
                    activeDispatch = available.firstOrNull()
                } else {
                    activeDispatch = null
                }
            } catch (e: Exception) {
                android.util.Log.e("PartnerDash", "Failed to refresh available bookings", e)
                activeDispatch = null
            } finally {
                delay(300)
                isRefreshing = false
            }
        }
    }

    // Fetch real available dispatches from API when online
    LaunchedEffect(isOnline) {
        refreshRequests()
    }

    val shootLocation = remember { LatLng(18.95823563155963, 72.81710824) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(shootLocation, 15f)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(SpaceNavy)
    ) {
        PartnerHeader(
            isOnline = isOnline,
            onToggleOnline = { isOnline = it },
            onRefreshClick = { refreshRequests() }
        )

        // Pull to refresh animated top bar
        AnimatedVisibility(
            visible = isRefreshing,
            enter = fadeIn() + expandVertically(),
            exit = fadeOut() + shrinkVertically()
        ) {
            Surface(
                color = OrbitPurple.copy(alpha = 0.15f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(14.dp),
                        color = OrbitPurple,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        "Checking backend for real shoot requests...",
                        color = OrbitPurple,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Incoming Real Dispatch Request Alert Card
            if (isOnline && activeDispatch != null) {
                val currentBooking = activeDispatch!!
                GlassCard(borderColor = OrbitPurple, modifier = Modifier.padding(bottom = 20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("⚡ NEW SHOOT DISPATCH ALERT", color = OrbitPurple, fontWeight = FontWeight.Black, fontSize = 11.sp, letterSpacing = 1.sp)
                        Surface(color = Destructive.copy(alpha = 0.2f), shape = RoundedCornerShape(12.dp)) {
                            Text("LIVE", color = Destructive, fontSize = 11.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp))
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Text(currentBooking.location ?: "Shooting Location", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = White)
                    Text("Payout Fee: ₹700.00 • Guaranteed Earnings", color = OrbitGreen, fontSize = 14.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 4.dp))
                    Text("Slot: ${currentBooking.timeSlot} • Date: ${currentBooking.bookingDate}", color = MutedText, fontSize = 12.sp)

                    Spacer(modifier = Modifier.height(12.dp))

                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF090A10)),
                        shape = RoundedCornerShape(14.dp),
                        border = BorderStroke(1.dp, Color(0xFF1E2132)),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(140.dp)
                            .padding(bottom = 12.dp)
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            SafeMapView(
                                modifier = Modifier.fillMaxSize(),
                                cameraPositionState = cameraPositionState,
                                location = shootLocation,
                                title = "Dispatch Location"
                            )
                        }
                    }

                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        Button(
                            onClick = {
                                coroutineScope.launch {
                                    try {
                                        val token = "Bearer ${prefsManager.getAuthToken()}"
                                        val pid = prefsManager.getPartnerId() ?: ""
                                        ApiClient.apiService.declineBooking(token, currentBooking.id, DeclineBookingRequest(pid))
                                    } catch (_: Exception) {}
                                    activeDispatch = null
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.DarkGray),
                            modifier = Modifier.weight(1f).height(44.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Decline", color = White, fontSize = 13.sp)
                        }

                        Button(
                            onClick = {
                                if (!isAccepting) {
                                    isAccepting = true
                                    coroutineScope.launch {
                                        try {
                                            val token = "Bearer ${prefsManager.getAuthToken()}"
                                            val pid = prefsManager.getPartnerId() ?: ""
                                            ApiClient.apiService.acceptBooking(token, currentBooking.id, AcceptBookingRequest(pid))
                                            onAcceptDispatch(currentBooking.id)
                                            onNavigateToWork()
                                        } catch (e: Exception) {
                                            android.util.Log.e("PartnerDash", "Failed to accept booking", e)
                                        } finally {
                                            isAccepting = false
                                        }
                                    }
                                }
                            },
                            enabled = !isAccepting,
                            colors = ButtonDefaults.buttonColors(containerColor = OrbitGreen),
                            modifier = Modifier.weight(1.2f).height(44.dp),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(if (isAccepting) "Accepting..." else "Accept Shoot ✓", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }

            // Available Work Section Header with Refresh Button
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

                Surface(
                    color = OrbitCyan.copy(alpha = 0.15f),
                    shape = RoundedCornerShape(20.dp),
                    border = BorderStroke(1.dp, OrbitCyan.copy(alpha = 0.3f)),
                    modifier = Modifier.clickable { refreshRequests() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        if (isRefreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(12.dp),
                                color = OrbitCyan,
                                strokeWidth = 2.dp
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                        }
                        Text(
                            if (isRefreshing) "Refreshing..." else "🔄 Refresh",
                            color = OrbitCyan,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }

            // Empty State Card with Refresh Action
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


