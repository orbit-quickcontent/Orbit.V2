# Firestore Collections Inventory

Comprehensive documentation of Firestore collections and document schema definitions.

---

## 1. Core Collections

### `client_users` / `users`
- **Fields:** `id`, `email`, `name`, `phone`, `role`, `brandLogo`, `brandFont`, `brandColor`, `editorRequirements`, `avatar`, `createdAt`, `updatedAt`
- **Used by:** Client App, Auth Handler, Admin Dashboard

### `partner_users`
- **Fields:** `id`, `email`, `name`, `phone`, `role`, `createdAt`, `updatedAt`
- **Used by:** Partner App, Admin Dashboard

### `partner_profiles`
- **Fields:** `id`, `userId`, `location`, `latitude`, `longitude`, `availability`, `isVerified`, `rating`, `completedProjects`, `deviceInfo`, `accountHolderName`, `encryptedAccountNumber`, `ifscCode`, `bankName`, `branchName`, `panNumber`, `verificationStatus`, `verificationMethod`, `payoutEnabled`, `walletBalance`, `pendingClearance`, `totalWithdrawn`, `createdAt`, `updatedAt`
- **Used by:** Dispatch Engine, Partner App, Wallet Manager

### `packages`
- **Fields:** `id`, `name`, `tier`, `price`, `focus`, `deliveryTime`, `features` (array), `popular`, `createdAt`, `updatedAt`
- **Used by:** Package Dashboard, Booking Flow

### `bookings`
- **Fields:** `id`, `userId`, `packageId`, `partnerId`, `status`, `paymentStatus`, `paymentId`, `paymentMethod`, `bookingDate`, `timeSlot`, `location`, `syncPercentage`, `editCountdown`, `deliveredAt`, `cancelledBy`, `notes`, `footageUrls`, `masterReelUrl`, `hlsPlaylistUrl`, `proxyFootageUrl`, `dispatchRound`, `declinedBy`, `createdAt`, `updatedAt`
- **Used by:** Client Tracker, Dispatch Engine, Editor Studio

### `work_dispatches`
- **Fields:** `id`, `bookingId`, `partnerId`, `status`, `dispatchedAt`, `respondedAt`, `round`, `createdAt`, `updatedAt`
- **Used by:** Dispatch Engine, Partner Dispatches UI

### `partner_transactions`
- **Fields:** `id`, `partnerId`, `bookingId`, `type`, `amount`, `status`, `description`, `createdAt`
- **Used by:** Partner Wallet, Payout Engine

### `client_audit_logs` / `partner_audit_logs` / `auditLogs`
- **Fields:** `id`, `userId`, `action`, `entity`, `entityId`, `details`, `ipAddress`, `userAgent`, `createdAt`
- **Used by:** Security Auditor, Admin Console
