# Apple App Store — Privacy Nutrition Label Declaration

**App Name:** Orbit  
**Bundle Identifier:** `com.orbitlogic.client` / `com.orbitlogic.partner`  
**Last Updated:** August 2026

---

## Privacy Details Matrix

| Data Type | Collected? | Linked to User? | Used for Tracking? | Purpose |
|---|---|---|---|---|
| **Precise Location** | Yes | Yes | No | Dispatch & Realtime Tracking |
| **Contact Info (Name, Email, Phone)** | Yes | Yes | No | Account & Authentication |
| **Financial Info (Bank Details, Payment IDs)** | Yes | Yes | No | Payouts & Payments |
| **User Content (Photos, Videos)** | Yes | Yes | No | Video Editing & Reel Delivery |
| **Identifiers (User ID, Device ID)** | Yes | Yes | No | Push Notifications & Session Auth |
| **Diagnostics (Crash Data, Performance)** | Yes | No | No | Sentry Crash Reporting |

---

## Location Usage Description (`Info.plist`)

* **NSLocationWhenInUseUsageDescription:** "Orbit requires your location to match you with nearby creators and provide real-time arrival estimates."
* **NSLocationAlwaysAndWhenInUseUsageDescription:** "Orbit Partner requires background location access during active bookings to update clients on your arrival progress."
