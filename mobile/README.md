# Orbit Native Mobile Applications

This directory contains the fully native Android and iOS mobile applications for the Orbit cinematic UGC shoot platform, replacing the previous Flutter WebView wrapper.

## Directory Structure

```
mobile/
├── android-client/       # Native Kotlin / Compose app for Clients
├── android-partner/      # Native Kotlin / Compose app for Partners (Shooters)
├── ios-client/           # Native Swift / SwiftUI app for Clients
└── ios-partner/          # Native Swift / SwiftUI app for Partners (Shooters)
```

## Android Studio Projects

Both `android-client` and `android-partner` are fully structured Android Studio projects.

### Requirements:
* Android Studio Iguana (or newer)
* JDK 17
* Android SDK 34 (Target) / Android SDK 26 (Min)

### How to Build & Run:
1. Open Android Studio.
2. Select **Open** and choose either `mobile/android-client` or `mobile/android-partner`.
3. Gradle will synchronize automatically.
4. Replace connection details in `.env` or in the build gradle options if needed.
5. Click **Run** to launch on an Emulator or physical device.
6. Alternatively, build via CLI:
   ```bash
   ./gradlew assembleDebug
   ```

---

## Xcode Projects (iOS)

Both `ios-client` and `ios-partner` are built using SwiftUI.

### Requirements:
* macOS with Xcode 15+
* iOS 16.0+ Target

### How to Build & Run:
1. Open Xcode.
2. Select **Open** and select either `mobile/ios-client` or `mobile/ios-partner`.
3. Choose your target simulator (e.g. iPhone 15).
4. Press `Cmd + R` to compile and run.
5. In production, configure your developer profile in the **Signing & Capabilities** tab.

---

## Native Bridges & Architecture

* **REST API:** Fully native HTTP communication using `Retrofit` (Android) and `URLSession` (iOS). No JS/WebView bridges.
* **Real-time Sync:** Uses `socket.io-client` (Android) and `URLSessionWebSocketTask` (iOS) to handle instant dispatch alerts.
* **Camera Interface:** Fully native viewfinders using `CameraX` (Android) and `AVFoundation` stubs (iOS).
* **Storage:** Secured with `SharedPreferences` (Android) and `Keychain` (iOS).
* **CI/CD:** Configured with GitHub Actions workflows in `.github/workflows/`.
