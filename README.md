# Orbit Platform (Orbit.V2)

**Orbit** is a real-time marketplace platform for instant content creation, videographer dispatch, and reel editing delivery.

---

## Architecture Diagram

```
                                   ┌─────────────────────────────┐
                                   │        End Users            │
                                   │  Client / Partner / Editor  │
                                   └──────────────┬───────────────┘
                    ┌───────────────────┬──────────┴──────────┬───────────────────┐
                    ▼                   ▼                     ▼                   ▼
             Web (Next.js PWA)   Android App (Native)   iOS App (Native)     Editor Web App
             dashboard-web-app   mobile/android-client  mobile/ios-client    editor-web-app
                    │                   │                     │                   │
                    └───────────────────┴──────────┬──────────┴───────────────────┘
                                                     ▼
                                        ┌────────────────────────┐
                                        │ API Gateway (Express)  │
                                        │  requireAuth middleware│
                                        │  Idempotency & RBAC    │
                                        └────────────┬───────────┘
                    ┌───────────────────┬────────────┼────────────┬───────────────────┐
                    ▼                   ▼            ▼            ▼                   ▼
              Auth Service        Booking/Dispatch  Wallet &    Media/Upload     In-Process WS
              (JWT, OAuth,        Service (state     Payout     Service (Mock    Notifications
              RBAC, Zod)          machine, matching) Service    S3 / Presigned)  (Socket.IO)
                    │                   │            │            │                   │
                    └───────────────────┴─────┬──────┴────────────┴───────────────────┘
                                               ▼
                                  ┌─────────────────────────┐
                                  │    Firebase Firestore   │
                                  │   (Unified Data Store)  │
                                  └─────────────────────────┘
```

---

## Workspace Directory Structure

- `backend/`: Express + TypeScript API gateway server (Port 5000 & WebSocket Port 3003)
- `dashboard-web-app/`: Next.js client & partner web application
- `editor-web-app/`: Next.js video editor studio web application
- `mobile/android-client/`: Android native Client App
- `mobile/android-partner/`: Android native Partner App
- `mobile/ios-client/`: iOS native Client App
- `docs/`: Architecture Decision Records (ADRs) and API reference documentation

---

## Environment Setup & Running Locally

1. **Backend Server:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Dashboard Web App:**
   ```bash
   cd dashboard-web-app
   npm install
   npm run dev
   ```

3. **Editor Web App:**
   ```bash
   cd editor-web-app
   npm install
   npm run dev
   ```

---

## Verification & Quality Assurance

- **ADR-001:** [docs/adr-001-express-single-source-of-truth.md](docs/adr-001-express-single-source-of-truth.md)
- **API Reference:** [docs/api-reference.md](docs/api-reference.md)
