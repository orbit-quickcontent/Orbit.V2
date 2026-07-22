# Authentication Flows

Documentation of authentication workflows and session mechanisms.

---

## 1. Login & Signup Flow (Email OTP)
1. **User enters Email:** App calls `POST /api/auth/send-otp` with `{ email: "user@example.com" }`.
2. **Server generates OTP:** Server creates a 6-digit OTP code, stores it in memory/DB, and returns success response.
3. **User enters 6-Digit OTP:** App calls `POST /api/auth/verify-otp` with `{ email: "user@example.com", otp: "123456" }`.
4. **Server returns Session Token:** On valid OTP, server responds with `token` and `user` profile data (including `role`).
5. **Native Storage:** Token is securely stored in Android `SharedPreferences` / iOS `Keychain`.

---

## 2. Session Hydration & Role Routing
1. On app launch, app reads token from local secure storage.
2. If token is present:
   - Call `GET /api/users` with `Authorization: Bearer <token>`.
   - If user role is `PARTNER` -> Route to Partner Native App.
   - If user role is `USER` / `ADMIN` -> Route to Client Native App.
3. If token is invalid/expired or absent -> Route to Native Login Screen.

---

## 3. Biometric & Quick Unlock (Native)
- Native Android (`BiometricPrompt`) and iOS (`LocalAuthentication` / FaceID) unlock the stored session token from `Keychain`/`SharedPreferences` without requiring re-entry of OTP.
