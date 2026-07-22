# API Inventory

Complete mapping of Express REST API endpoints in `orbit-marketplace/backend`.

---

## 1. Authentication & Users
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/send-otp` | Request email OTP token | No |
| `POST` | `/api/auth/verify-otp` | Verify OTP code and receive auth session token | No |
| `GET` | `/api/users` | Fetch authenticated user profile | Yes (Bearer Token) |
| `POST` | `/api/users` | Create or update user profile and brand settings | Yes (Bearer Token) |

---

## 2. Packages & Bookings
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/packages` | List available video packages and tiers | No |
| `GET` | `/api/bookings` | List bookings for current client/partner | Yes (Bearer Token) |
| `POST` | `/api/bookings` | Create a new shoot booking | Yes (Bearer Token) |
| `GET` | `/api/bookings/available` | List pending dispatches available for partners | Yes (Bearer Token) |
| `GET` | `/api/bookings/:id` | Get details of a specific booking | Yes (Bearer Token) |
| `PATCH` | `/api/bookings/:id` | Update booking status/details | Yes (Bearer Token) |
| `GET` | `/api/bookings/:id/track` | Live tracking status payload for a booking | Yes (Bearer Token) |

---

## 3. Partner Operations & Dispatches
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/bookings/:id/dispatch` | Trigger dispatch round to eligible partners | Internal / Admin |
| `POST` | `/api/bookings/:id/accept` | Accept a shoot dispatch | Yes (Bearer Token) |
| `POST` | `/api/bookings/:id/decline` | Decline a shoot dispatch | Yes (Bearer Token) |
| `POST` | `/api/bookings/:id/sync-complete` | Mark video footage upload sync as 100% complete | Yes (Bearer Token) |
| `GET` | `/api/partners` | List partner directory | Yes (Bearer Token) |
| `POST` | `/api/partners` | Create partner profile | Yes (Bearer Token) |
| `GET` | `/api/partners/:id` | Get partner details & rating | Yes (Bearer Token) |
| `PATCH` | `/api/partners/:id` | Update partner availability/location | Yes (Bearer Token) |
| `GET` | `/api/partners/:id/wallet` | Fetch wallet balance & transactions | Yes (Bearer Token) |
| `POST` | `/api/partners/:id/withdraw` | Trigger wallet payout withdrawal | Yes (Bearer Token) |
| `POST` | `/api/partners/link-bank` | Submit bank account details for verification | Yes (Bearer Token) |

---

## 4. Video Uploads & Media Processing
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/upload/presigned-url` | Generate S3 upload URL for raw footage | Yes (Bearer Token) |
| `PUT` | `/api/upload/mock-s3` | Upload raw binary video stream | Yes (Bearer Token) |

---

## 5. Editor & Admin Endpoints
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/editor/bookings` | List bookings in EDITING state | Yes (Bearer Token) |
| `GET` | `/api/editor/bookings/:id` | Get raw footage URLs for editor | Yes (Bearer Token) |
| `POST` | `/api/editor/deliver` | Deliver final master reel URL and mark complete | Yes (Bearer Token) |
| `POST` | `/api/upload-reel` | Upload master reel video | Yes (Bearer Token) |
| `GET` | `/api/admin/onboarded-directory` | List partner verification status | Yes (Bearer Token) |
| `POST` | `/api/admin/verify-partner` | Update partner KYC verification status | Yes (Bearer Token) |
| `POST` | `/api/admin/seed` | Seed default packages and users | Yes (Bearer Token) |
| `GET` | `/api/admin/audit-logs` | Fetch system audit logs | Yes (Bearer Token) |
