# ORBIT Client — Flutter WebView Wrapper

## Overview

This Flutter app is a **pure native WebView container** for the ORBIT Client web app.  
**Zero UI is built in Flutter.** All screens, components, styles and logic live in the Next.js web app.

## Architecture

```
Flutter (Native Shell)
  └── flutter_inappwebview
        └── Loads: https://orbit-quickcontent.vercel.app?role=USER
              └── Next.js Web App (ALL UI/UX)
```

## What Flutter provides (ONLY)

| Capability | How |
|---|---|
| WebView container | `flutter_inappwebview` |
| GPS one-shot | `geolocator` → dispatches `orbit_gps` event |
| Connectivity status | `connectivity_plus` → dispatches `orbit_connectivity` event |
| Biometric auth | `local_auth` → dispatches `orbit_biometric_result` event |
| Camera / File upload | Native file chooser via `onShowFileChooser` |
| Native Share | `share_plus` via `OrbitBridge.share()` |
| Downloads | Routed to system browser |
| Deep linking | `orbit-client://` scheme + HTTPS App Links |
| Back navigation | WebView history → double-press to exit |
| Offline detection | Live connectivity stream |
| Pull-to-refresh | Built-in `PullToRefreshController` |

## JavaScript Bridge

The web app can call native features via:

```js
// Wait for bridge to be ready
window.addEventListener("orbit_bridge_ready", () => {
  // Request GPS
  window.OrbitBridge.requestGPS();
  // Listen for GPS result
  window.addEventListener("orbit_gps", (e) => {
    const { lat, lng } = e.detail;
  });

  // Biometric auth
  window.OrbitBridge.biometricAuth("Confirm your identity");
  window.addEventListener("orbit_biometric_result", (e) => {
    if (e.detail.success) { /* proceed */ }
  });

  // Native share
  window.OrbitBridge.share("Check out Orbit!", "https://orbit-quickcontent.vercel.app");

  // Check if running in native app
  if (window.OrbitBridge.isNativeApp) { /* native-specific UI */ }
});
```

## Setup & Build

### Prerequisites
- Flutter 3.22+ (`flutter --version`)
- Android Studio / Xcode
- JDK 17+

### Install dependencies
```bash
cd client-app
flutter pub get
```

### Generate splash screen
```bash
dart run flutter_native_splash:create
```

### Run on emulator (dev)
```bash
flutter run
# Default URL: http://10.0.2.2:3000?role=USER
```

### Build Android APK (debug)
```bash
flutter build apk --debug
```

### Build Android APK (release)
```bash
flutter build apk --release --obfuscate --split-debug-info=build/debug-info
```

### Build Android App Bundle (Play Store)
```bash
flutter build appbundle --release
```

### Build iOS (requires Mac + Xcode)
```bash
flutter build ios --release
```

## Production URL

Edit `main.dart` line:
```dart
const String _kProductionUrl = 'https://orbit-quickcontent.vercel.app';
```

Replace with your actual deployed domain.

## Android Signing (required for Play Store)

1. Generate keystore: `keytool -genkey -v -keystore orbit-client.jks -keyalg RSA -keysize 2048 -validity 10000 -alias orbit`
2. Add to `android/key.properties`
3. Reference in `android/app/build.gradle`

## CRITICAL RULES

- ❌ Do NOT modify any web app code
- ❌ Do NOT add Flutter widgets that replace web UI
- ❌ Do NOT change any API routes or backend logic
- ✅ Only add NEW native capabilities via the JavaScript bridge