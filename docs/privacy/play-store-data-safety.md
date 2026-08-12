# Google Play Store — Data Safety Declaration

**Application Name:** Orbit Creator & Partner Network  
**Package ID:** `com.orbitlogic.client` / `com.orbitlogic.partner`  
**Last Updated:** August 2026

---

## Data Collection & Sharing Summary

Orbit collects data strictly for core app functionality, account management, fraud prevention, and real-time dispatch services.

### 1. Location Data (Precise & Approximate)
* **Collected:** Yes (Foreground & Background for Partner App during active jobs).
* **Purpose:** Live partner dispatch, ETA calculation, and emergency SOS tracking.
* **Sharing:** Shared with assigned client for real-time tracking.
* **Retention:** Stored during active job lifecycle, purged after 30 days.

### 2. Personal Information
* **Collected:** Name, Email Address, Phone Number.
* **Purpose:** User authentication, account management, customer support, and SMS/WhatsApp notifications.
* **Sharing:** Not shared with third parties (except SMS gateway providers like Resend/Twilio).

### 3. Financial Information
* **Collected:** Bank account numbers, IFSC codes, Razorpay transaction IDs.
* **Purpose:** Payout processing and payment settlement.
* **Encryption:** Bank account details are encrypted using AES-256 (`ENCRYPTION_KEY`).

### 4. Photos and Videos
* **Collected:** User avatars, raw camera footage, and delivered reels.
* **Purpose:** Content creation, editing delivery, and partner profile verification.

---

## Security Practices

1. **Encryption in Transit:** All network traffic is encrypted over HTTPS (TLS 1.3) and Secure WebSockets (WSS).
2. **Account Deletion:** Users can request full account and data deletion via `/api/auth/delete-account` or by emailing `support@orbit-quickcontent.com`.
