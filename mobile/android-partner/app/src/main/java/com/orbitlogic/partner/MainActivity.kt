package com.orbitlogic.partner

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.orbitlogic.partner.ui.screens.*
import com.orbitlogic.partner.ui.theme.*
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
                    MainPartnerNavigationHost()
                }
            }
        }
    }
}

@Composable
fun MainPartnerNavigationHost() {
    var isAuthenticated by remember { mutableStateOf(true) }
    var currentTab by remember { mutableStateOf("dashboard") } // dashboard, nav, camera, sync, wallet, profile
    var activeDispatchId by remember { mutableStateOf("booking-dispatch-101") }

    if (!isAuthenticated) {
        PartnerLoginScreen(onLoginSuccess = {
            isAuthenticated = true
            currentTab = "dashboard"
        })
    } else {
        Scaffold(
            bottomBar = {
                PartnerBottomNavigationBar(
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
                    "dashboard" -> PartnerDashboardScreen(
                        onAcceptDispatch = { id ->
                            activeDispatchId = id
                            currentTab = "nav"
                        },
                        onNavigateToWork = { currentTab = "nav" }
                    )
                    "nav" -> MapNavigationScreen(
                        onStartShooting = { currentTab = "camera" }
                    )
                    "camera" -> CameraScreen(
                        onCompleteShoot = { currentTab = "sync" }
                    )
                    "sync" -> VideoSyncScreen(
                        onSyncFinish = { currentTab = "wallet" }
                    )
                    "wallet" -> PartnerWalletScreen()
                    "profile" -> PartnerProfileScreen()
                }
            }
        }
    }
}

@Composable
fun PartnerBottomNavigationBar(
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
            PartnerBottomNavItem("Studio", "dashboard", currentTab == "dashboard") { onSelectTab("dashboard") }
            PartnerBottomNavItem("Navigation", "nav", currentTab == "nav") { onSelectTab("nav") }
            PartnerBottomNavItem("Camera", "camera", currentTab == "camera") { onSelectTab("camera") }
            PartnerBottomNavItem("Sync", "sync", currentTab == "sync") { onSelectTab("sync") }
            PartnerBottomNavItem("Earnings", "wallet", currentTab == "wallet") { onSelectTab("wallet") }
            PartnerBottomNavItem("Profile", "profile", currentTab == "profile") { onSelectTab("profile") }
        }
    }
}

@Composable
fun PartnerBottomNavItem(
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
            .padding(horizontal = 6.dp, vertical = 4.dp)
    ) {
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Normal,
            color = if (isSelected) OrbitPurple else MutedText
        )
        if (isSelected) {
            Box(
                modifier = Modifier
                    .padding(top = 4.dp)
                    .size(width = 16.dp, height = 2.dp)
                    .background(OrbitPurple)
            )
        }
    }
}

