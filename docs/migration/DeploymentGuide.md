# Deployment Guide

Instructions for deploying Orbit native applications to production stores and CI/CD environments.

---

## 1. Automated GitHub Actions Deployments
1. Push changes to the `main` or `master` branch.
2. The pipeline defined in `.github/workflows/ci.yml` will automatically:
   - Run backend typechecks and linters.
   - Run security vulnerability scans.
   - Build Android Client & Partner debug APKs.
   - Publish build artifacts under the GitHub Actions run tab.

---

## 2. Manual Android Build & Signing
```bash
# Build release Android App Bundle (AAB) for Google Play Console
cd mobile/android-client
./gradlew assembleRelease bundleRelease

cd ../android-partner
./gradlew assembleRelease bundleRelease
```

---

## 3. Manual iOS Build & Archive
```bash
# Archive iOS Client app for TestFlight / App Store submission
cd mobile/ios-client
xcodebuild -project OrbitClient.xcodeproj -scheme OrbitClient -sdk iphoneos -configuration Release archive -archivePath ./build/OrbitClient.xcarchive

# Archive iOS Partner app
cd ../ios-partner
xcodebuild -project OrbitPartner.xcodeproj -scheme OrbitPartner -sdk iphoneos -configuration Release archive -archivePath ./build/OrbitPartner.xcarchive
```
