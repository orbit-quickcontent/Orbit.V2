package com.orbitlogic.partner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.orbitlogic.partner.ui.screens.*
import com.orbitlogic.partner.ui.theme.*
import com.orbitlogic.partner.network.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            OrbitTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainPartnerNavigationHost()
                }
            }
        }
    }
}

@Composable
fun MainPartnerNavigationHost() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefsManager = remember { com.orbitlogic.partner.storage.PrefsManager(context) }
    var isAppLoading by remember { mutableStateOf(true) }
    var isAuthenticated by remember { mutableStateOf(prefsManager.isLoggedIn()) }
    var currentTab by remember { mutableStateOf("home") }
    val coroutineScope = rememberCoroutineScope()

    val requiredPermissions = remember {
        mutableStateListOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION,
            android.Manifest.permission.CAMERA,
            android.Manifest.permission.RECORD_AUDIO
        ).apply {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                add(android.Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    var showPermissionModal by remember {
        mutableStateOf(
            requiredPermissions.any { perm ->
                androidx.core.content.ContextCompat.checkSelfPermission(context, perm) != android.content.pm.PackageManager.PERMISSION_GRANTED
            }
        )
    }

    val permissionLauncher = androidx.activity.compose.rememberLauncherForActivityResult(
        contract = androidx.activity.result.contract.ActivityResultContracts.RequestMultiplePermissions()
    ) {
        showPermissionModal = false
    }

    LaunchedEffect(isAppLoading) {
        if (!isAppLoading && showPermissionModal) {
            permissionLauncher.launch(requiredPermissions.toTypedArray())
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (isAppLoading) {
            PartnerSplashScreen(onSplashFinished = { isAppLoading = false })
        } else if (!isAuthenticated) {
            PartnerLoginScreen(onLoginSuccess = { token, partnerId ->
                prefsManager.saveAuthSession(token, partnerId)
                isAuthenticated = true
                currentTab = "home"
                // Fetch partner profile after login to confirm the session is valid
                coroutineScope.launch {
                    try {
                        val profile = ApiClient.apiService.getPartnerProfile("Bearer $token", partnerId)
                        android.util.Log.d("MainNav", "Partner profile loaded: ${profile.id}")
                    } catch (e: Exception) {
                        android.util.Log.e("MainNav", "Failed to load partner profile", e)
                    }
                }
            })
        } else {
            Scaffold(
                containerColor = Color.Black,
                bottomBar = {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 16.dp, start = 16.dp, end = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        PartnerBottomNavigationBar(
                            currentTab = currentTab,
                            onSelectTab = { currentTab = it }
                        )
                    }
                }
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black)
                        .padding(innerPadding)
                ) {
                    AnimatedContent(
                        targetState = currentTab,
                        transitionSpec = {
                            ContentTransform(
                                targetContentEnter = fadeIn(animationSpec = androidx.compose.animation.core.tween(180)),
                                initialContentExit = fadeOut(animationSpec = androidx.compose.animation.core.tween(180))
                            )
                        },
                        label = "PartnerScreenTransition"
                    ) { targetTab ->
                        when (targetTab) {
                            "home" -> PartnerDashboardScreen(
                                onAcceptDispatch = { currentTab = "nav" },
                                onNavigateToWork = { currentTab = "nav" }
                            )
                            "work" -> PartnerWorkHistoryScreen()
                            "earnings" -> PartnerWalletScreen(
                                onGoToSettings = { currentTab = "profile" }
                            )
                            "profile" -> PartnerProfileScreen(
                                onLogout = {
                                    prefsManager.clearSession()
                                    isAuthenticated = false
                                }
                            )
                            "nav" -> MapNavigationScreen(
                                onStartShooting = { currentTab = "camera" }
                            )
                            "camera" -> CameraScreen(
                                onCompleteShoot = { currentTab = "sync" }
                            )
                            "sync" -> VideoSyncScreen(
                                onSyncFinish = { currentTab = "earnings" }
                            )
                        }
                    }
                }
            }
        }

        if (!isAppLoading && showPermissionModal) {
            PermissionPromptModal(
                onGrantPermissions = {
                    permissionLauncher.launch(requiredPermissions.toTypedArray())
                },
                onDismiss = {
                    showPermissionModal = false
                }
            )
        }
    }
}


@Composable
fun PermissionPromptModal(
    onGrantPermissions: () -> Unit,
    onDismiss: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.85f))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F121C)),
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.dp, Color(0xFF00BFFF).copy(alpha = 0.4f)),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(56.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF00BFFF).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    com.orbitlogic.partner.ui.theme.OrbitIcon(
                        type = com.orbitlogic.partner.ui.theme.OrbitIconType.Bolt,
                        color = Color(0xFF00BFFF),
                        modifier = Modifier.size(26.dp)
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "App Permissions Required",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )

                Text(
                    "Orbit requires device permissions to deliver high-precision shoot dispatches, real-time live navigation, and creator camera recording.",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(vertical = 8.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                Column(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    PermissionRowItem(com.orbitlogic.partner.ui.theme.OrbitIconType.LocationPin, "Location Access", "Required for shoot dispatch matching & live GPS map navigation")
                    PermissionRowItem(com.orbitlogic.partner.ui.theme.OrbitIconType.Camera, "Camera & Microphone", "Required for shoot content capture & verification")
                    PermissionRowItem(com.orbitlogic.partner.ui.theme.OrbitIconType.Bell, "Push Notifications", "Required for instant shoot dispatch alerts")
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = onGrantPermissions,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00BFFF)),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(48.dp)
                ) {
                    Text("Grant All Permissions", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }

                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text("Skip for Now", color = Color(0xFF64748B), fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
private fun PermissionRowItem(icon: com.orbitlogic.partner.ui.theme.OrbitIconType, title: String, desc: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(Color(0xFF00BFFF).copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            com.orbitlogic.partner.ui.theme.OrbitIcon(icon, color = Color(0xFF00BFFF), modifier = Modifier.size(16.dp))
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(desc, color = Color(0xFF64748B), fontSize = 11.sp)
        }
    }
}

@Composable
fun PartnerBottomNavigationBar(
    currentTab: String,
    onSelectTab: (String) -> Unit
) {
    val tabs = remember { listOf("home", "work", "earnings", "profile") }
    val selectedIndex = tabs.indexOf(currentTab).coerceAtLeast(0)

    val animatedIndex by androidx.compose.animation.core.animateFloatAsState(
        targetValue = selectedIndex.toFloat(),
        animationSpec = androidx.compose.animation.core.spring(
            dampingRatio = androidx.compose.animation.core.Spring.DampingRatioNoBouncy,
            stiffness = androidx.compose.animation.core.Spring.StiffnessHigh
        ),
        label = "partnerNavSlidingIndex"
    )

    val movementDelta = kotlin.math.abs(animatedIndex - selectedIndex.toFloat())
    val stretchFactor = 1.0f + (movementDelta * 0.25f).coerceAtMost(0.35f)

    val leftCurveFactor = (1.0f - animatedIndex).coerceIn(0.0f, 1.0f)
    val rightCurveFactor = (animatedIndex - (tabs.size - 2).toFloat()).coerceIn(0.0f, 1.0f)

    val startCornerRadius = 16.dp + (10.dp * leftCurveFactor)
    val endCornerRadius = 16.dp + (10.dp * rightCurveFactor)

    val dynamicPillShape = RoundedCornerShape(
        topStart = startCornerRadius,
        bottomStart = startCornerRadius,
        topEnd = endCornerRadius,
        bottomEnd = endCornerRadius
    )

    Surface(
        color = SpaceNavyLight.copy(alpha = 0.90f),
        shape = RoundedCornerShape(32.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
        shadowElevation = 16.dp,
        modifier = Modifier
            .fillMaxWidth()
            .height(64.dp)
    ) {
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .padding(4.dp)
        ) {
            val tabWidth = maxWidth / tabs.size
            val baseIndicatorOffset = tabWidth * animatedIndex
            val dynamicWidth = tabWidth * stretchFactor
            val overflowX = (dynamicWidth - tabWidth) / 2f
            val finalOffset = (baseIndicatorOffset - overflowX).coerceIn(0.dp, maxWidth - dynamicWidth)

            Box(
                modifier = Modifier
                    .offset(x = finalOffset)
                    .width(dynamicWidth)
                    .fillMaxHeight()
                    .clip(dynamicPillShape)
                    .background(Color(0xFF161824).copy(alpha = 0.95f))
                    .border(
                        width = 1.dp,
                        color = Color.White.copy(alpha = 0.18f),
                        shape = dynamicPillShape
                    )
            ) {
                val topLineWidth = (32.dp * stretchFactor).coerceIn(32.dp, 56.dp)
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .width(topLineWidth)
                        .height(3.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(OrbitCyan, OrbitPurple)
                            )
                        )
                )
            }

            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                PartnerBottomNavItem("Home", "home", currentTab == "home") { onSelectTab("home") }
                PartnerBottomNavItem("Work", "work", currentTab == "work") { onSelectTab("work") }
                PartnerBottomNavItem("Earnings", "earnings", currentTab == "earnings") { onSelectTab("earnings") }
                PartnerBottomNavItem("Profile", "profile", currentTab == "profile") { onSelectTab("profile") }
            }
        }
    }
}

@Composable
fun HomeVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val w = size.width
        val h = size.height
        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.5f, h * 0.12f)
            lineTo(w * 0.88f, h * 0.44f)
            lineTo(w * 0.78f, h * 0.44f)
            lineTo(w * 0.78f, h * 0.88f)
            lineTo(w * 0.22f, h * 0.88f)
            lineTo(w * 0.22f, h * 0.44f)
            lineTo(w * 0.12f, h * 0.44f)
            close()
        }
        drawPath(
            path = path,
            color = color,
            style = Stroke(
                width = 2.dp.toPx(),
                cap = StrokeCap.Round,
                join = StrokeJoin.Round
            )
        )
        val doorPath = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.40f, h * 0.88f)
            lineTo(w * 0.40f, h * 0.62f)
            lineTo(w * 0.60f, h * 0.62f)
            lineTo(w * 0.60f, h * 0.88f)
        }
        drawPath(
            path = doorPath,
            color = color,
            style = Stroke(
                width = 1.8.dp.toPx(),
                cap = StrokeCap.Round
            )
        )
    }
}

@Composable
fun WorkVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val w = size.width
        val h = size.height
        val boxPath = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.5f, h * 0.12f)
            lineTo(w * 0.88f, h * 0.32f)
            lineTo(w * 0.88f, h * 0.72f)
            lineTo(w * 0.5f, h * 0.90f)
            lineTo(w * 0.12f, h * 0.72f)
            lineTo(w * 0.12f, h * 0.32f)
            close()
        }
        drawPath(
            path = boxPath,
            color = color,
            style = Stroke(
                width = 1.8.dp.toPx(),
                cap = StrokeCap.Round,
                join = StrokeJoin.Round
            )
        )
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.90f), strokeWidth = 1.8.dp.toPx())
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.88f, h * 0.32f), strokeWidth = 1.8.dp.toPx())
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.12f, h * 0.32f), strokeWidth = 1.8.dp.toPx())
    }
}

@Composable
fun EarningsVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val center = androidx.compose.ui.geometry.Offset(size.width * 0.5f, size.height * 0.5f)
        drawCircle(
            color = color,
            radius = size.width * 0.42f,
            center = center,
            style = Stroke(width = 1.8.dp.toPx())
        )
        drawCircle(
            color = color,
            radius = size.width * 0.24f,
            center = center,
            style = Stroke(width = 1.8.dp.toPx())
        )
        drawCircle(
            color = color,
            radius = size.width * 0.08f,
            center = center
        )
    }
}

@Composable
fun RowScope.PartnerBottomNavItem(
    label: String,
    tabKey: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val tabScale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isSelected) 1.05f else 1.0f,
        animationSpec = androidx.compose.animation.core.spring(
            dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
            stiffness = androidx.compose.animation.core.Spring.StiffnessMedium
        ),
        label = "tabScale"
    )

    val iconColor by androidx.compose.animation.animateColorAsState(
        targetValue = if (isSelected) OrbitCyan else MutedText,
        animationSpec = androidx.compose.animation.core.tween(durationMillis = 200),
        label = "iconColor"
    )

    val textColor by androidx.compose.animation.animateColorAsState(
        targetValue = if (isSelected) OrbitCyan else MutedText,
        animationSpec = androidx.compose.animation.core.tween(durationMillis = 200),
        label = "textColor"
    )

    Box(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .scale(tabScale)
            .clip(RoundedCornerShape(20.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            when (tabKey) {
                "home" -> HomeVectorIcon(color = iconColor)
                "work" -> WorkVectorIcon(color = iconColor)
                "earnings" -> EarningsVectorIcon(color = iconColor)
                "profile" -> {
                    val avatarBorderColor by androidx.compose.animation.animateColorAsState(
                        targetValue = if (isSelected) Color.White else Color.White.copy(alpha = 0.15f),
                        animationSpec = androidx.compose.animation.core.tween(durationMillis = 200),
                        label = "avatarBorderColor"
                    )
                    val avatarTextColor by androidx.compose.animation.animateColorAsState(
                        targetValue = if (isSelected) Color.Black else MutedText,
                        animationSpec = androidx.compose.animation.core.tween(durationMillis = 200),
                        label = "avatarTextColor"
                    )

                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(
                                if (isSelected) Brush.horizontalGradient(listOf(OrbitCyan, OrbitPurple))
                                else Brush.linearGradient(listOf(Color(0xFF222630), Color(0xFF16181E)))
                            )
                            .border(1.dp, avatarBorderColor, CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "P",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = avatarTextColor
                        )
                    }
                }
            }

            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = textColor,
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}
