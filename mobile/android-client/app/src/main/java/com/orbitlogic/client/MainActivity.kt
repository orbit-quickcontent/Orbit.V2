package com.orbitlogic.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.animation.core.*
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
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbitlogic.client.ui.screens.*
import com.orbitlogic.client.ui.theme.*
import com.orbitlogic.client.network.*
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val context = this
            val prefsManager = remember { com.orbitlogic.client.storage.PrefsManager(context) }
            var isLightTheme by remember { mutableStateOf(prefsManager.isLightTheme()) }

            OrbitTheme(useLightTheme = isLightTheme) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainClientNavigationHost(
                        isLightTheme = isLightTheme,
                        onToggleTheme = {
                            isLightTheme = !isLightTheme
                            prefsManager.setLightTheme(isLightTheme)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun MainClientNavigationHost(
    isLightTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefsManager = remember { com.orbitlogic.client.storage.PrefsManager(context) }
    var isAppLoading by remember { mutableStateOf(true) }
    var isAuthenticated by remember { mutableStateOf(prefsManager.isLoggedIn()) }
    var currentTab by remember { mutableStateOf("home") }
    val tabStack = remember { mutableStateListOf("home") }

    fun navigateToTab(newTab: String) {
        if (newTab != currentTab) {
            if (tabStack.lastOrNull() != newTab) {
                tabStack.add(newTab)
            }
            currentTab = newTab
        }
    }

    val canGoBack = showSearch || showNotifications || showSettings || showPermissionModal || tabStack.size > 1 || currentTab != "home"

    androidx.activity.compose.BackHandler(enabled = canGoBack) {
        when {
            showSearch -> showSearch = false
            showNotifications -> showNotifications = false
            showSettings -> showSettings = false
            showPermissionModal -> showPermissionModal = false
            tabStack.size > 1 -> {
                tabStack.removeAt(tabStack.lastIndex)
                currentTab = tabStack.last()
            }
            currentTab != "home" -> {
                tabStack.clear()
                tabStack.add("home")
                currentTab = "home"
            }
        }
    }

    var selectedPackageId by remember { mutableStateOf("pkg-professional") }
    var activeBookingId by remember { mutableStateOf("bk_active_901") }
    val coroutineScope = rememberCoroutineScope()

    // ── Overlay panel states ────────────────────────────────────────────────
    var showSearch by remember { mutableStateOf(false) }
    var showNotifications by remember { mutableStateOf(false) }
    var showSettings by remember { mutableStateOf(false) }

    val requiredPermissions = remember {
        mutableStateListOf(
            android.Manifest.permission.ACCESS_FINE_LOCATION,
            android.Manifest.permission.ACCESS_COARSE_LOCATION,
            android.Manifest.permission.CAMERA
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

    LaunchedEffect(isAuthenticated) {
        if (isAuthenticated) {
            try {
                val token = "Bearer ${prefsManager.getAuthToken()}"
                val bookings = ApiClient.apiService.getBookings(token)
                val active = bookings.firstOrNull { it.status != "DELIVERED" && it.status != "CANCELLED" }
                if (active != null) activeBookingId = active.id
            } catch (e: Exception) {
                android.util.Log.e("MainNav", "Failed to load bookings", e)
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (isAppLoading) {
            ClientSplashScreen(onSplashFinished = { isAppLoading = false })
        } else if (!isAuthenticated) {
            LoginScreen(onLoginSuccess = { token ->
                prefsManager.saveAuthSession(token, "CLIENT")
                isAuthenticated = true
                navigateToTab("home")
                coroutineScope.launch {
                    try {
                        val authToken = "Bearer $token"
                        val bookings = ApiClient.apiService.getBookings(authToken)
                        val active = bookings.firstOrNull { it.status != "DELIVERED" && it.status != "CANCELLED" }
                        if (active != null) activeBookingId = active.id
                    } catch (_: Exception) {}
                }
            })
        } else {
            Scaffold(
                bottomBar = {
                    ClientBottomNavigationBar(
                        currentTab = currentTab,
                        isLight = isLightTheme,
                        onSelectTab = { navigateToTab(it) }
                    )
                },
                containerColor = if (isLightTheme) LightBg else SpaceNavy
            ) { innerPadding ->
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(innerPadding)
                ) {
                    AnimatedContent(
                        targetState = currentTab,
                        transitionSpec = {
                            (fadeIn(animationSpec = spring(stiffness = Spring.StiffnessMediumLow)) + slideInVertically(animationSpec = spring(stiffness = Spring.StiffnessMediumLow, dampingRatio = Spring.DampingRatioNoBouncy), initialOffsetY = { it / 25 }))
                                .togetherWith(fadeOut(animationSpec = tween(140, easing = FastOutLinearInEasing)) + slideOutVertically(animationSpec = tween(140), targetOffsetY = { -it / 25 }))
                        },
                        label = "ScreenTransition"
                    ) { targetTab ->
                        when (targetTab) {
                            "home" -> DashboardHomeScreen(
                                onNavigateToBooking = { navigateToTab("booking") },
                                onNavigateToPackages = { navigateToTab("packages") },
                                onNavigateToTracking = { id ->
                                    activeBookingId = id
                                    navigateToTab("tracking")
                                },
                                onNavigateToProfile = { navigateToTab("profile") },
                                onSearchClick = { showSearch = true },
                                onNotifClick = { showNotifications = true },
                                onSettingsClick = { showSettings = true }
                            )
                            "packages" -> PackagesScreen(
                                onSelectPackage = { pkgId ->
                                    selectedPackageId = pkgId
                                    navigateToTab("booking")
                                },
                                onSearchClick = { showSearch = true },
                                onNotifClick = { showNotifications = true },
                                onSettingsClick = { showSettings = true },
                                onProfileClick = { navigateToTab("profile") }
                            )
                            "booking" -> BookingFlowScreen(
                                packageId = selectedPackageId,
                                onBookingComplete = { navigateToTab("tracking") }
                            )
                            "tracking" -> TrackingScreen(
                                bookingId = activeBookingId,
                                onClose = { navigateToTab("home") },
                                onSearchClick = { showSearch = true },
                                onNotifClick = { showNotifications = true },
                                onSettingsClick = { showSettings = true },
                                onProfileClick = { navigateToTab("profile") }
                            )
                            "profile" -> ProfileScreen(
                                onLogout = {
                                    prefsManager.clearSession()
                                    isAuthenticated = false
                                },
                                onOpenSettings = { showSettings = true },
                                onSearchClick = { showSearch = true },
                                onNotifClick = { showNotifications = true }
                            )
                        }
                    }
                }
            }
        }

        // ── Overlay Panels ──────────────────────────────────────────────────
        AnimatedVisibility(
            visible = showSearch,
            enter = fadeIn(animationSpec = spring(stiffness = Spring.StiffnessMediumLow)) + slideInVertically(initialOffsetY = { -it / 3 }, animationSpec = spring(stiffness = Spring.StiffnessMediumLow)),
            exit = fadeOut(animationSpec = tween(150)) + slideOutVertically(targetOffsetY = { -it / 3 }, animationSpec = tween(150))
        ) {
            SearchOverlayScreen(
                isLight = isLightTheme,
                onDismiss = { showSearch = false },
                onNavigateToPackages = {
                    showSearch = false
                    currentTab = "packages"
                }
            )
        }

        AnimatedVisibility(
            visible = showNotifications,
            enter = fadeIn(animationSpec = spring(stiffness = Spring.StiffnessMediumLow)) + slideInVertically(initialOffsetY = { -it / 3 }, animationSpec = spring(stiffness = Spring.StiffnessMediumLow)),
            exit = fadeOut(animationSpec = tween(150)) + slideOutVertically(targetOffsetY = { -it / 3 }, animationSpec = tween(150))
        ) {
            NotificationsOverlayScreen(
                isLight = isLightTheme,
                onDismiss = { showNotifications = false }
            )
        }

        AnimatedVisibility(
            visible = showSettings,
            enter = fadeIn(animationSpec = spring(stiffness = Spring.StiffnessMediumLow)) + slideInVertically(initialOffsetY = { -it / 3 }, animationSpec = spring(stiffness = Spring.StiffnessMediumLow)),
            exit = fadeOut(animationSpec = tween(150)) + slideOutVertically(targetOffsetY = { -it / 3 }, animationSpec = tween(150))
        ) {
            AppSettingsOverlayScreen(
                isLight = isLightTheme,
                onDismiss = { showSettings = false },
                onToggleTheme = onToggleTheme,
                onRequestPermissions = { permissionLauncher.launch(requiredPermissions.toTypedArray()) }
            )
        }

        if (!isAppLoading && showPermissionModal) {
            PermissionPromptModal(
                onGrantPermissions = { permissionLauncher.launch(requiredPermissions.toTypedArray()) },
                onDismiss = { showPermissionModal = false }
            )
        }
    }
}


@Composable
fun PermissionPromptModal(
    onGrantPermissions: () -> Unit,
    onDismiss: () -> Unit
) {
    val isLight = LocalOrbitIsLight.current
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.7f))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = if (isLight) LightSurface else Color(0xFF0F121C)
            ),
            shape = RoundedCornerShape(24.dp),
            border = BorderStroke(1.dp, if (isLight) LightBorder else Color(0xFF00BFFF).copy(alpha = 0.4f)),
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
                        .background(if (isLight) LightPrimaryTint else Color(0xFF00BFFF).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    com.orbitlogic.client.ui.theme.OrbitIcon(
                        type = com.orbitlogic.client.ui.theme.OrbitIconType.Bolt,
                        color = if (isLight) LightPrimary else Color(0xFF00BFFF),
                        modifier = Modifier.size(26.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    "App Permissions Required",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Black,
                    color = if (isLight) LightTextPrimary else Color.White
                )
                Text(
                    "Orbit requires device permissions to deliver high-precision shoot location selection, creator tracking, and booking updates.",
                    fontSize = 13.sp,
                    color = if (isLight) LightTextTertiary else Color(0xFF94A3B8),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Column(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    PermissionRowItem(com.orbitlogic.client.ui.theme.OrbitIconType.LocationPin, "Location Access", "Required for precise shoot location detection & tracking")
                    PermissionRowItem(com.orbitlogic.client.ui.theme.OrbitIconType.Camera, "Camera Access", "Required for profile photo & shoot instructions")
                    PermissionRowItem(com.orbitlogic.client.ui.theme.OrbitIconType.Bell, "Push Notifications", "Required for live shoot status updates")
                }
                Spacer(modifier = Modifier.height(20.dp))
                Button(
                    onClick = onGrantPermissions,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isLight) LightPrimary else Color(0xFF00BFFF)
                    ),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    Text(
                        "Grant All Permissions",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.padding(top = 4.dp)
                ) {
                    Text(
                        "Skip for Now",
                        color = if (isLight) LightTextTertiary else Color(0xFF64748B),
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun PermissionRowItem(icon: com.orbitlogic.client.ui.theme.OrbitIconType, title: String, desc: String) {
    val isLight = LocalOrbitIsLight.current
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Box(
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape)
                .background(if (isLight) LightPrimaryTint else Color(0xFF00BFFF).copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center
        ) {
            com.orbitlogic.client.ui.theme.OrbitIcon(icon, color = if (isLight) LightPrimary else Color(0xFF00BFFF), modifier = Modifier.size(16.dp))
        }
        Spacer(modifier = Modifier.width(10.dp))
        Column {
            Text(title, color = if (isLight) LightTextPrimary else Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(desc, color = if (isLight) LightTextTertiary else Color(0xFF64748B), fontSize = 11.sp)
        }
    }
}

// ─── Bottom Navigation Bar ────────────────────────────────────────────────────

@Composable
fun ClientBottomNavigationBar(
    currentTab: String,
    isLight: Boolean,
    onSelectTab: (String) -> Unit
) {
    val tabs = remember { listOf("home", "packages", "tracking", "profile") }
    val selectedIndex = tabs.indexOf(currentTab).coerceAtLeast(0)

    val animatedIndex by animateFloatAsState(
        targetValue = selectedIndex.toFloat(),
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioNoBouncy,
            stiffness = Spring.StiffnessHigh
        ),
        label = "slidingIndicatorOffset"
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

    // Exact dark pill theme matching user reference UI
    val navBg = Color(0xFF0F1015)
    val navBorder = Color(0xFF22242E)
    val pillBg = Color(0xFF222530)
    val pillBorder = Color(0xFF333748)
    val activeColor = Color.White
    val inactiveColor = Color(0xFF8E92A0)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 14.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            color = navBg,
            shape = RoundedCornerShape(36.dp),
            border = BorderStroke(1.dp, navBorder),
            shadowElevation = 18.dp,
            modifier = Modifier
                .fillMaxWidth()
                .height(68.dp)
        ) {
            BoxWithConstraints(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(5.dp)
            ) {
                val tabWidth = maxWidth / tabs.size
                val baseIndicatorOffset = tabWidth * animatedIndex
                val dynamicWidth = tabWidth * stretchFactor
                val overflowX = (dynamicWidth - tabWidth) / 2f
                val finalOffset = (baseIndicatorOffset - overflowX).coerceIn(0.dp, maxWidth - dynamicWidth)

                // Active pill indicator matching screenshot
                Box(
                    modifier = Modifier
                        .offset(x = finalOffset)
                        .width(dynamicWidth)
                        .fillMaxHeight()
                        .clip(RoundedCornerShape(28.dp))
                        .background(pillBg)
                        .border(width = 1.dp, color = pillBorder, shape = RoundedCornerShape(28.dp))
                ) {
                    // White Glowing Top Indicator Bar
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .width(36.dp)
                            .height(3.dp)
                            .clip(RoundedCornerShape(2.dp))
                            .background(Color.White)
                    )
                    // Radial glow below top indicator bar
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .width(48.dp)
                            .height(14.dp)
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color.White.copy(alpha = 0.35f), Color.Transparent)
                                )
                            )
                    )
                }

                Row(
                    modifier = Modifier.fillMaxSize(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    BottomNavItem("Home", "home", currentTab == "home", activeColor, inactiveColor) { onSelectTab("home") }
                    BottomNavItem("Packages", "packages", currentTab == "packages", activeColor, inactiveColor) { onSelectTab("packages") }
                    BottomNavItem("Track", "tracking", currentTab == "tracking", activeColor, inactiveColor) { onSelectTab("tracking") }
                    BottomNavItem("Profile", "profile", currentTab == "profile", activeColor, inactiveColor) { onSelectTab("profile") }
                }
            }
        }
    }
}

@Composable
fun HomeVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val w = size.width; val h = size.height
        val path = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.5f, h * 0.12f); lineTo(w * 0.88f, h * 0.44f); lineTo(w * 0.78f, h * 0.44f)
            lineTo(w * 0.78f, h * 0.88f); lineTo(w * 0.22f, h * 0.88f); lineTo(w * 0.22f, h * 0.44f)
            lineTo(w * 0.12f, h * 0.44f); close()
        }
        drawPath(path = path, color = color, style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        val doorPath = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.40f, h * 0.88f); lineTo(w * 0.40f, h * 0.62f); lineTo(w * 0.60f, h * 0.62f); lineTo(w * 0.60f, h * 0.88f)
        }
        drawPath(path = doorPath, color = color, style = Stroke(width = 1.8.dp.toPx(), cap = StrokeCap.Round))
    }
}

@Composable
fun PackageVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val w = size.width; val h = size.height
        val boxPath = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.5f, h * 0.12f); lineTo(w * 0.88f, h * 0.32f); lineTo(w * 0.88f, h * 0.72f)
            lineTo(w * 0.5f, h * 0.90f); lineTo(w * 0.12f, h * 0.72f); lineTo(w * 0.12f, h * 0.32f); close()
        }
        drawPath(path = boxPath, color = color, style = Stroke(width = 1.8.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.90f), strokeWidth = 1.8.dp.toPx())
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.88f, h * 0.32f), strokeWidth = 1.8.dp.toPx())
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.12f, h * 0.32f), strokeWidth = 1.8.dp.toPx())
    }
}

@Composable
fun TrackVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val center = androidx.compose.ui.geometry.Offset(size.width * 0.5f, size.height * 0.5f)
        drawCircle(color = color, radius = size.width * 0.42f, center = center, style = Stroke(width = 1.8.dp.toPx()))
        drawCircle(color = color, radius = size.width * 0.24f, center = center, style = Stroke(width = 1.8.dp.toPx()))
        drawCircle(color = color, radius = size.width * 0.08f, center = center)
    }
}

@Composable
fun RowScope.BottomNavItem(
    label: String,
    tabKey: String,
    isSelected: Boolean,
    activeColor: Color,
    inactiveColor: Color,
    onClick: () -> Unit
) {
    val tabScale by animateFloatAsState(
        targetValue = if (isSelected) 1.05f else 1.0f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
        label = "tabScale"
    )
    val iconColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else inactiveColor,
        animationSpec = tween(durationMillis = 200),
        label = "iconColor"
    )
    val textColor by animateColorAsState(
        targetValue = if (isSelected) Color.White else inactiveColor,
        animationSpec = tween(durationMillis = 200),
        label = "textColor"
    )

    Box(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .graphicsLayer {
                scaleX = tabScale
                scaleY = tabScale
            }
            .clip(RoundedCornerShape(24.dp))
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            when (tabKey) {
                "home" -> HomeVectorIcon(color = iconColor)
                "packages" -> PackageVectorIcon(color = iconColor)
                "tracking" -> TrackVectorIcon(color = iconColor)
                "profile" -> {
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(Color.White),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "GC",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Black,
                            color = Color(0xFF0F1015)
                        )
                    }
                }
            }
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                color = textColor,
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}
