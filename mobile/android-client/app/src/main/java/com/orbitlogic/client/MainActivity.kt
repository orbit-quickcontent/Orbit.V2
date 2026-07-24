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
    var isAuthenticated by remember { mutableStateOf(true) }
    var currentTab by remember { mutableStateOf("home") } // home, packages, booking, tracking, profile
    var selectedPackageId by remember { mutableStateOf("pkg-professional") }
    var activeBookingId by remember { mutableStateOf("bk_active_901") }

    if (!isAuthenticated) {
        LoginScreen(onLoginSuccess = {
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
            color = Color(0xFF0A0A0E).copy(alpha = 0.92f),
            shape = RoundedCornerShape(28.dp),
            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.1f)),
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxSize().padding(horizontal = 4.dp, vertical = 4.dp),
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
fun RowScope.BottomNavItem(
    label: String,
    tabKey: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .weight(1f)
            .fillMaxHeight()
            .clip(RoundedCornerShape(20.dp))
            .background(if (isSelected) Color(0xFF171622) else Color.Transparent)
            .border(
                width = 1.dp,
                color = if (isSelected) Color.White.copy(alpha = 0.1f) else Color.Transparent,
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
                    .width(32.dp)
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
            if (tabKey == "profile") {
                Box(
                    modifier = Modifier
                        .size(22.dp)
                        .clip(CircleShape)
                        .background(
                            if (isSelected)
                                Brush.horizontalGradient(listOf(Color(0xFF00F0FF), Color(0xFFA056FF)))
                            else
                                Brush.horizontalGradient(listOf(Color(0xFF27272A), Color(0xFF27272A)))
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "TU",
                        fontSize = 9.sp,
                        fontWeight = FontWeight.Black,
                        color = if (isSelected) Color.Black else Color.White
                    )
                }
            } else {
                Text(
                    text = when (tabKey) {
                        "home" -> "🏠"
                        "packages" -> "📦"
                        "tracking" -> "🎯"
                        else -> "👤"
                    },
                    fontSize = 14.sp
                )
            }

            Text(
                text = label,
                fontSize = 10.sp,
                fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Medium,
                color = if (isSelected) Color(0xFF00F0FF) else MutedText,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}
