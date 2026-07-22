# Migration Checklist

Verification checklist across all migration phases.

---

- [x] **Phase 1: Repository Analysis & Native Setup**
  - [x] Inventory all screens, routes, and APIs
  - [x] Map Firestore collections and WebSocket channels
  - [x] Create `docs/migration/` documentation suite
  - [x] Archive old Flutter/WebView code into `archive/flutter/`

- [x] **Phase 2: Bootstrap Native Projects**
  - [x] Configure `mobile/android` and `mobile/ios` shared core, logging, themes, and networking
  - [x] Setup error handlers, logger utilities, DI foundations, and keychain wrappers
  - [x] Configure `.github/workflows/ci.yml` pipeline for testing, linting, and APK/AAB artifacts

- [x] **Phase 3: Authentication Implementation**
  - [x] Email OTP login on Android & iOS
  - [x] Native session storage (Keychain / SharedPreferences)
  - [x] Native Biometric unlock (FaceID/TouchID/Fingerprint)
  - [x] Role-based auto-login routing

- [x] **Phase 4: Client Native Features**
  - [x] Landing Dashboard, Package Selection, Booking Flow
  - [x] Live Shoot Tracker & Master Reel Player

- [x] **Phase 5: Partner Native Features**
  - [x] Live Dispatch Overlay & Accept/Decline actions
  - [x] Native CameraX / AVFoundation recording engine
  - [x] Video Upload & Sync Progress bar
  - [x] Partner Earnings & Payout Request system

- [x] **Phase 6: Final Validation & CI/CD**
  - [x] GitHub Actions compilation & APK/AAB build artifact validation
  - [x] Parity check against Feature Parity Matrix
  - [x] Generate final documentation suite (`MigrationReport.md`, `TestingReport.md`, `ProductionChecklist.md`, `ArchitectureDiagram.md`, `DeploymentGuide.md`)
