package com.orbitlogic.client

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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
    Surface(
        color = SpaceNavyLight,
        tonalElevation = 8.dp,
        modifier = Modifier.fillMaxWidth().height(64.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxSize(),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            BottomNavItem("Home", "home", currentTab == "home") { onSelectTab("home") }
            BottomNavItem("Packages", "packages", currentTab == "packages") { onSelectTab("packages") }
            BottomNavItem("Book Shoot", "booking", currentTab == "booking") { onSelectTab("booking") }
            BottomNavItem("Tracker", "tracking", currentTab == "tracking") { onSelectTab("tracking") }
            BottomNavItem("Profile", "profile", currentTab == "profile") { onSelectTab("profile") }
        }
    }
}

@Composable
fun BottomNavItem(
    label: String,
    tabKey: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .clickable { onClick() }
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Normal,
            color = if (isSelected) OrbitCyan else MutedText
        )
        if (isSelected) {
            Box(
                modifier = Modifier
                    .padding(top = 4.dp)
                    .size(width = 16.dp, height = 2.dp)
                    .background(OrbitCyan)
            )
        }
    }
}

