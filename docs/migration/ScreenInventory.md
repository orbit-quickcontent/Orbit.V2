# Screen Inventory

Comprehensive audit mapping every Web Component to its native Android Jetpack Compose and iOS SwiftUI screen equivalents.

---

## 1. Client Screens
| Web Component | Native Android Screen (Compose) | Native iOS Screen (SwiftUI) | Purpose |
|---|---|---|---|
| `LoginPage.tsx` | `LoginScreen.kt` | `LoginView.swift` | Role selection & OTP authentication |
| `DashboardHome.tsx` | `DashboardHomeScreen.kt` | `DashboardHomeView.swift` | Main dashboard feed, quick actions |
| `PackageDashboard.tsx` | `PackagesScreen.kt` | `PackagesView.swift` | Video package pricing & tier selection |
| `BookingFlow.tsx` | `BookingFlowScreen.kt` | `BookingFlowView.swift` | Shoot date/slot picker & location form |
| `TrackingDashboard.tsx` | `TrackingScreen.kt` | `TrackingView.swift` | Real-time shoot progress tracker |
| `ProfileView.tsx` | `ProfileScreen.kt` | `ProfileView.swift` | Brand settings, font/logo customization |

---

## 2. Partner Screens
| Web Component | Native Android Screen (Compose) | Native iOS Screen (SwiftUI) | Purpose |
|---|---|---|---|
| `PartnerDashboard.tsx` | `PartnerDashboardScreen.kt` | `PartnerDashboardView.swift` | Availability toggle & dispatch alerts |
| `MapNavigation.tsx` | `MapNavigationScreen.kt` | `MapNavigationView.swift` | En route GPS map navigation to shoot |
| `ShootingPhase.tsx` | `CameraScreen.kt` | `CameraView.swift` | Camera recording & raw clip cache |
| `SyncModule.tsx` | `VideoSyncScreen.kt` | `VideoSyncView.swift` | Resumable multipart upload progress |
| `PartnerProfileView.tsx` | `PartnerProfileScreen.kt` | `PartnerProfileView.swift` | Partner KYC verification & rating |
| `PartnerEarnings.tsx` | `PartnerWalletScreen.kt` | `PartnerWalletView.swift` | Balance tracker, bank link, payouts |
