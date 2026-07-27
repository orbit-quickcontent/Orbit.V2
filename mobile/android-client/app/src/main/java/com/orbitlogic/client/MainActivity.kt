package com.orbitlogic.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
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
import com.orbitlogic.client.ui.screens.*
import com.orbitlogic.client.ui.theme.*
import dagger.hilt.android.AndroidEntryPoint

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
                    MainClientNavigationHost()
                }
            }
        }
    }
}

@Composable
fun MainClientNavigationHost() {
    val context = androidx.compose.ui.platform.LocalContext.current
    val prefsManager = remember { com.orbitlogic.client.storage.PrefsManager(context) }
    var isAuthenticated by remember { mutableStateOf(prefsManager.isLoggedIn()) }
    var currentTab by remember { mutableStateOf("home") } // home, packages, booking, tracking, profile
    var selectedPackageId by remember { mutableStateOf("pkg-professional") }
    var activeBookingId by remember { mutableStateOf("bk_active_901") }

    if (!isAuthenticated) {
        LoginScreen(onLoginSuccess = { token ->
            prefsManager.saveAuthSession(token, "CLIENT")
            isAuthenticated = true
            currentTab = "home"
        })
    } else {
        Scaffold(
            bottomBar = {
                ClientBottomNavigationBar(
                    currentTab = currentTab,
                    onSelectTab = { currentTab = it }
                )
            }
        ) { innerPadding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                when (currentTab) {
                    "home" -> DashboardHomeScreen(
                        onNavigateToBooking = { currentTab = "booking" },
                        onNavigateToPackages = { currentTab = "packages" },
                        onNavigateToTracking = { id ->
                            activeBookingId = id
                            currentTab = "tracking"
                        },
                        onNavigateToProfile = { currentTab = "profile" }
                    )
                    "packages" -> PackagesScreen(
                        onSelectPackage = { pkgId ->
                            selectedPackageId = pkgId
                            currentTab = "booking"
                        }
                    )
                    "booking" -> BookingFlowScreen(
                        packageId = selectedPackageId,
                        onBookingComplete = {
                            currentTab = "tracking"
                        }
                    )
                    "tracking" -> TrackingScreen(bookingId = activeBookingId)
                    "profile" -> ProfileScreen(
                        onLogout = {
                            prefsManager.clearSession()
                            isAuthenticated = false
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun ClientBottomNavigationBar(
    currentTab: String,
    onSelectTab: (String) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            color = Color(0xFF0A0C10).copy(alpha = 0.90f),
            shape = RoundedCornerShape(32.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.12f)),
            shadowElevation = 16.dp,
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxSize().padding(horizontal = 6.dp, vertical = 6.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                BottomNavItem("Home", "home", currentTab == "home") { onSelectTab("home") }
                BottomNavItem("Packages", "packages", currentTab == "packages") { onSelectTab("packages") }
                BottomNavItem("Track", "tracking", currentTab == "tracking") { onSelectTab("tracking") }
                BottomNavItem("Profile", "profile", currentTab == "profile") { onSelectTab("profile") }
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
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = 2.dp.toPx(),
                strokeCap = androidx.compose.ui.graphics.StrokeCap.Round,
                strokeJoin = androidx.compose.ui.graphics.StrokeJoin.Round
            )
        )
        // Door arch
        val doorPath = androidx.compose.ui.graphics.Path().apply {
            moveTo(w * 0.40f, h * 0.88f)
            lineTo(w * 0.40f, h * 0.62f)
            lineTo(w * 0.60f, h * 0.62f)
            lineTo(w * 0.60f, h * 0.88f)
        }
        drawPath(
            path = doorPath,
            color = color,
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = 1.8.dp.toPx(),
                strokeCap = androidx.compose.ui.graphics.StrokeCap.Round
            )
        )
    }
}

@Composable
fun PackageVectorIcon(color: Color, modifier: Modifier = Modifier) {
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
            style = androidx.compose.ui.graphics.drawscope.Stroke(
                width = 1.8.dp.toPx(),
                strokeCap = androidx.compose.ui.graphics.StrokeCap.Round,
                strokeJoin = androidx.compose.ui.graphics.StrokeJoin.Round
            )
        )
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.90f), strokeWidth = 1.8.dp.toPx())
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.88f, h * 0.32f), strokeWidth = 1.8.dp.toPx())
        drawLine(color = color, start = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.52f), end = androidx.compose.ui.geometry.Offset(w * 0.12f, h * 0.32f), strokeWidth = 1.8.dp.toPx())
    }
}

@Composable
fun TrackVectorIcon(color: Color, modifier: Modifier = Modifier) {
    androidx.compose.foundation.Canvas(modifier = modifier.size(20.dp)) {
        val center = androidx.compose.ui.geometry.Offset(size.width * 0.5f, size.height * 0.5f)
        drawCircle(
            color = color,
            radius = size.width * 0.42f,
            center = center,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.8.dp.toPx())
        )
        drawCircle(
            color = color,
            radius = size.width * 0.24f,
            center = center,
            style = androidx.compose.ui.graphics.drawscope.Stroke(width = 1.8.dp.toPx())
        )
        drawCircle(
            color = color,
            radius = size.width * 0.08f,
            center = center
        )
    }
}

@Composable
fun RowScope.BottomNavItem(
    label: String,
    tabKey: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val scale by androidx.compose.animation.core.animateFloatAsState(
        targetValue = if (isSelected) 1.04f else 1.0f,
        animationSpec = androidx.compose.animation.core.spring(
            dampingRatio = androidx.compose.animation.core.Spring.DampingRatioMediumBouncy,
            stiffness = androidx.compose.animation.core.Spring.StiffnessMedium
        ),
        label = "tabScale"
    )

    val iconColor = if (isSelected) Color(0xFF00F0FF) else Color(0xFF8E92A0)

    Box(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .androidx.compose.ui.draw.scale(scale)
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) Color(0xFF161824).copy(alpha = 0.95f) else Color.Transparent)
            .border(
                width = 1.dp,
                color = if (isSelected) Color.White.copy(alpha = 0.18f) else Color.Transparent,
                shape = RoundedCornerShape(20.dp)
            )
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (isSelected) {
            // Top gradient line indicator
            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .width(34.dp)
                    .height(3.dp)
                    .clip(RoundedCornerShape(2.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(Color(0xFF00F0FF), Color(0xFFA056FF))
                        )
                    )
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            when (tabKey) {
                "home" -> HomeVectorIcon(color = iconColor)
                "packages" -> PackageVectorIcon(color = iconColor)
                "tracking" -> TrackVectorIcon(color = iconColor)
                "profile" -> {
                    // Profile Avatar Badge matching exact image layout
                    Box(
                        modifier = Modifier
                            .size(22.dp)
                            .clip(CircleShape)
                            .background(
                                if (isSelected) Brush.horizontalGradient(listOf(Color(0xFF00F0FF), Color(0xFFA056FF)))
                                else Brush.linearGradient(listOf(Color(0xFF222630), Color(0xFF16181E)))
                            )
                            .border(1.dp, if (isSelected) Color.White else Color.White.copy(alpha = 0.15f), CircleShape),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "TU",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = if (isSelected) Color.Black else Color(0xFF8E92A0)
                        )
                    }
                }
            }

            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = if (isSelected) Color(0xFF00F0FF) else Color(0xFF8E92A0),
                modifier = Modifier.padding(top = 3.dp)
            )
        }
    }
}
