# Feature Inventory

Comprehensive audit of all active modules and capabilities across the Orbit Platform.

---

## 1. Client Features
- **Authentication & User Profiles:** Email OTP authentication, session persistence, role checks, and user profile management (name, phone, brand logo, brand font, brand color, custom editor instructions).
- **Package Browsing:** Tier selection (`PERSONALIZED`, `PROFESSIONAL`), pricing details in INR, features list, and focus area highlights.
- **Booking Creation Engine:** Date selection, time slot grid selection, shoot address input, special shoot notes, payment status initialization.
- **Live Shoot Tracker:** Real-time progress monitoring through booking lifecycle states (`PENDING`, `PAID`, `PARTNER_DISPATCHED`, `EN_ROUTE`, `SHOOTING`, `SYNCING`, `EDITING`, `DELIVERED`, `CANCELLED`).
- **Master Reel & Proxy Delivery:** HLS playlist streaming, proxy footage preview, master reel downloading.

---

## 2. Partner (Shooter) Features
- **Online/Offline Status Management:** Real-time toggle of partner availability via WebSockets and database status flags.
- **Dispatch Alert & Response System:** Incoming dispatch notifications, round tracking, decline tracking, and instant acceptance.
- **Map & Navigation Guidance:** GPS location routing to shoot destination, arrival marking, and shooting phase transition.
- **Camera & Video Upload Engine:** Local footage recording, S3/storage presigned URL requests, resumable multipart video uploads, and progress bar synchronization (`syncPercentage`).
- **Partner Wallet & Earnings:** Real-time wallet balance display, pending clearance balance, total payout logs, instant withdrawal request triggering, and penny-drop bank account verification (`ifscCode`, `accountNumber`, `panNumber`).

---

## 3. Editor & Admin Features
- **Editor Studio:** Booking assignment queue, proxy footage reviewing, master reel upload, delivery completion trigger.
- **Admin Directory:** Partner onboarding verification, KYC document verification, package price/tier management, audit logs inspection.
