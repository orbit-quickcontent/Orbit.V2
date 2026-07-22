# Production Release Checklist

Verification steps before deploying native applications to Google Play Store & Apple App Store.

---

## 1. Android Release Tasks
- [ ] Generate Production Keystore and sign release AABs.
- [ ] Replace `http://10.0.2.2:3001` backend URLs with production HTTPS domains.
- [ ] Add production `google-services.json` to `mobile/android-client/app/` and `mobile/android-partner/app/`.
- [ ] Provide Google Maps API Key in `AndroidManifest.xml`.

---

## 2. iOS Release Tasks
- [ ] Set App Store Signing Identity & Provisioning Profiles in Xcode.
- [ ] Replace `http://localhost:3001` backend URLs with production HTTPS endpoints.
- [ ] Add production `GoogleService-Info.plist` to `mobile/ios-client/` and `mobile/ios-partner/`.
- [ ] Configure Apple Developer Push Notification certificates (APNs).
