# Orbit Backend API Reference

**Base URL:** `${NEXT_PUBLIC_API_URL}` (Default: `http://localhost:5000/api`)

---

## Authentication (`/api/auth`)

### POST `/api/auth/register`
Registers a new user (Client or Partner).
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "Password123!",
    "name": "Jane Doe",
    "phone": "+91 9876543210",
    "role": "CLIENT" // "CLIENT" | "PARTNER"
  }
  ```
* **Response `200 OK`:** `{ "success": true, "token": "JWT...", "user": { ... } }`

### POST `/api/auth/login`
Authenticates user with email & password.
* **Body:** `{ "email": "user@example.com", "password": "Password123!" }`
* **Response `200 OK`:** `{ "success": true, "token": "JWT...", "user": { ... } }`

### GET `/api/auth/me`
Fetches active user profile session.
* **Headers:** `Authorization: Bearer <token>`
* **Response `200 OK`:** `{ "user": { ... }, "partnerProfile": { ... } }`

---

## Bookings (`/api/bookings`)

### GET `/api/bookings`
Retrieves bookings for authenticated user or list.
* **Headers:** `Authorization: Bearer <token>`

### POST `/api/bookings`
Creates a new booking request and triggers automatic partner dispatch.
* **Headers:** `Authorization: Bearer <token>`
* **Body:**
  ```json
  {
    "packageId": "pkg-professional",
    "bookingDate": "2026-08-10T10:00:00Z",
    "timeSlot": "10:00 AM - 12:00 PM",
    "location": "Bandra, Mumbai",
    "editorRequirements": "Cinematic transition, fast pace"
  }
  ```

### POST `/api/bookings/:id/accept`
Partner accepts a dispatched booking.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `PARTNER`, `ADMIN`, `SUPER_ADMIN`)

### POST `/api/bookings/:id/sync-complete`
Partner finishes raw footage sync.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `PARTNER`, `ADMIN`, `SUPER_ADMIN`)

---

## Editor (`/api/editor`)

### GET `/api/editor/bookings`
Lists assigned and available editing projects.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `EDITOR`, `ADMIN`, `SUPER_ADMIN`)

### POST `/api/editor/deliver`
Delivers completed reel for a booking and enqueues transcoding worker.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `EDITOR`, `ADMIN`, `SUPER_ADMIN`)
* **Body:** `{ "bookingId": "...", "reelUrl": "..." }`

---

## Wallet & Payouts (`/api/partners`)

### GET `/api/partners/:id/wallet`
Fetches wallet balance, pending clearance, and transaction ledger.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `PARTNER`, `ADMIN`, `SUPER_ADMIN`)

### POST `/api/partners/:id/withdraw`
Submits a withdrawal request with idempotency protection.
* **Headers:**
  - `Authorization: Bearer <token>`
  - `Idempotency-Key: <unique-uuid>`
* **Body:** `{ "amount": 1000 }`
* **Response `200 OK`:** `{ "success": true, "status": "PENDING_APPROVAL", "newBalance": 14500 }`

---

## Admin (`/api/admin`)

### POST `/api/admin/verify-partner`
Verifies partner KYC status.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `SUPER_ADMIN`)

### POST `/api/admin/seed`
Seeds initial system packages and default entries.
* **Headers:** `Authorization: Bearer <token>` (Required Role: `SUPER_ADMIN`)
