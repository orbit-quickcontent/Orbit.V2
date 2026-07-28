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

    Surface(
        color = Color(0xD90F1115), // Apple VisionOS Translucent Liquid Glass Fill
        shape = RoundedCornerShape(32.dp),
        border = BorderStroke(1.dp, Color.White.copy(alpha = 0.15f)),
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

            // Floating Active Pill Background with Corner Curvature
            val leftCurveFactor = (1.0f - animatedIndex).coerceIn(0.0f, 1.0f)
            val rightCurveFactor = (animatedIndex - (tabs.size - 2).toFloat()).coerceIn(0.0f, 1.0f)

            val startCornerRadius = 16.dp + (10.dp * leftCurveFactor)
            val endCornerRadius = 16.dp + (10.dp * rightCurveFactor)

            Box(
                modifier = Modifier
                    .offset(x = tabWidth * animatedIndex)
                    .width(tabWidth)
                    .fillMaxHeight()
                    .clip(
                        RoundedCornerShape(
                            topStart = startCornerRadius,
                            bottomStart = startCornerRadius,
                            topEnd = endCornerRadius,
                            bottomEnd = endCornerRadius
                        )
                    )
                    .background(
                        Brush.verticalGradient(
                            listOf(
                                Color(0xE61C1D2A),
                                Color(0xF212131D)
                            )
                        )
                    )
                    .border(
                        1.dp,
                        Color.White.copy(alpha = 0.18f),
                        RoundedCornerShape(
                            topStart = startCornerRadius,
                            bottomStart = startCornerRadius,
                            topEnd = endCornerRadius,
                            bottomEnd = endCornerRadius
                        )
                    )
            ) {
                // Top Cyan-Purple Gradient Line Indicator
                Box(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .width(36.dp)
                        .height(3.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            Brush.horizontalGradient(
                                listOf(Color(0xFF00F0FF), Color(0xFFA056FF))
                            )
                        )
                )
            }

            // Tab Items Row
            Row(
                modifier = Modifier.fillMaxSize(),
                horizontalArrangement = Arrangement.SpaceAround,
                verticalAlignment = Alignment.CenterVertically
            ) {
                tabs.forEach { tabKey ->
                    val isSelected = currentTab == tabKey
                    val label = when (tabKey) {
                        "home" -> "Home"
                        "work" -> "Work"
                        "earnings" -> "Earnings"
                        else -> "Profile"
                    }

                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .clickable { onSelectTab(tabKey) }
                    ) {
                        Box(contentAlignment = Alignment.TopEnd) {
                            Text(
                                text = when (tabKey) {
                                    "home" -> "⊞"
                                    "work" -> "💼"
                                    "earnings" -> "💳"
                                    else -> "👤"
                                },
                                fontSize = 15.sp,
                                color = if (isSelected) Color(0xFF00F0FF) else MutedText
                            )
                            if (tabKey == "earnings") {
                                Box(
                                    modifier = Modifier
                                        .offset(x = 2.dp, y = (-2).dp)
                                        .size(6.dp)
                                        .clip(CircleShape)
                                        .background(Color(0xFF22C55E))
                                )
                            }
                        }
                        Text(
                            text = label,
                            fontSize = 10.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) Color(0xFF00F0FF) else MutedText,
                            modifier = Modifier.padding(top = 2.dp)
                        )
                    }
                }
            }
        }
    }
}
