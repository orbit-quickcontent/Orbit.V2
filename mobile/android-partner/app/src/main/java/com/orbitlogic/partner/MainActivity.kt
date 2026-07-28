package com.orbitlogic.partner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
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
    var currentTab by remember { mutableStateOf("home") } // home, work, earnings, profile, nav, camera, sync

    if (!isAuthenticated) {
        PartnerLoginScreen(onLoginSuccess = {
            isAuthenticated = true
            currentTab = "home"
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
                            onAcceptDispatch = { id -> currentTab = "nav" },
                            onNavigateToWork = { currentTab = "nav" }
                        )
                        "work" -> PartnerWorkHistoryScreen()
                        "earnings" -> PartnerWalletScreen(
                            onGoToSettings = { currentTab = "profile" }
                        )
                        "profile" -> PartnerProfileScreen(
                            onLogout = { isAuthenticated = false }
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
}

@Composable
fun PartnerBottomNavigationBar(
    currentTab: String,
    onSelectTab: (String) -> Unit
) {
    Surface(
        color = SpaceNavyLight.copy(alpha = 0.95f),
        tonalElevation = 8.dp,
        modifier = Modifier.fillMaxWidth().height(68.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            PartnerBottomNavItem("Home", "home", currentTab == "home") { onSelectTab("home") }
            PartnerBottomNavItem("Work", "work", currentTab == "work") { onSelectTab("work") }
            PartnerBottomNavItem("Earnings", "earnings", currentTab == "earnings", showDot = true) { onSelectTab("earnings") }
            PartnerBottomNavItem("Profile", "profile", currentTab == "profile") { onSelectTab("profile") }
        }
    }
}

@Composable
fun PartnerBottomNavItem(
    label: String,
    tabKey: String,
    isSelected: Boolean,
    showDot: Boolean = false,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .clickable { onClick() }
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Box(contentAlignment = Alignment.TopEnd) {
            Box(
                modifier = Modifier
                    .size(28.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(if (isSelected) OrbitGreen.copy(alpha = 0.15f) else Color.Transparent),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = when (tabKey) {
                        "home" -> "⊞"
                        "work" -> "💼"
                        "earnings" -> "💳"
                        else -> "👤"
                    },
                    fontSize = 14.sp
                )
            }
            if (showDot) {
                Box(
                    modifier = Modifier
                        .offset(x = 2.dp, y = (-2).dp)
                        .size(6.dp)
                        .clip(CircleShape)
                        .background(OrbitGreen)
                )
            }
        }
        Text(
            text = label,
            fontSize = 10.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) OrbitGreen else MutedText,
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}
