# ORBIT Real-Time Nearby Partner Tracking and Dispatch System

Production-grade Uber/Ola-style nearby partner matching and dispatch engine for videographers and creators on the **ORBIT Platform**.

---

## 🏗️ Repository Architecture

```text
orbit/
  apps/
    partner-app/         # Complete Flutter 3.x Partner Mobile Application
    admin-dashboard/     # Next.js 15 + Tailwind Live Map Admin Fleet Control Center
  services/
    api/                 # Node.js 20 + Express + Socket.IO + Redis GEO Backend
  packages/
    shared/              # Shared TypeScript types & client integration samples
  docs/
    PRODUCTION_NOTES.md  # Scaling, H3 indexing, Sticky sessions & Prometheus monitoring
```

---

## ⚡ Tech Stack

- **Backend**: Node.js 20, TypeScript, Express, Socket.IO, Redis (GEO Index), PostgreSQL with Prisma, JWT Auth, Docker Compose.
- **Mobile Partner App**: Flutter 3.x, Riverpod, GoRouter, Socket.IO client, `geolocator`, `permission_handler`, `flutter_background_service`, `google_maps_flutter`.
- **Admin Dashboard**: Next.js 15, Tailwind CSS, Socket.IO client, Google Maps visualizer.

---

## 🚀 Step-by-Step Setup & Execution Commands

### 1. Launch Infrastructure Services (PostgreSQL + Redis)

```bash
docker compose up -d
```
*Exposes PostgreSQL on port `5432` and Redis on port `6379`.*

---

### 2. Backend API Setup & Seed

```bash
cd services/api
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```
*API server will start on `http://localhost:5000` with OpenAPI documentation accessible at `http://localhost:5000/docs`.*

---

### 3. Run Backend Automated Tests

```bash
cd services/api
npm test
```
*Runs Jest unit tests for Haversine distance, ETA calculations, GPS anti-spoofing detection, and Socket.IO integration.*

---

### 4. Admin Dashboard Setup (`apps/admin-dashboard`)

```bash
cd apps/admin-dashboard
npm install
npm run dev
```
*Open `http://localhost:3000/live-map` in your browser to view the real-time partner fleet control center.*

---

### 5. Flutter Partner App Setup (`apps/partner-app`)

```bash
cd apps/partner-app
flutter pub get
flutter run
```

---

## 📡 API Endpoints & Socket Events Quick Reference

### REST Endpoints
- `POST /api/auth/login`: Authenticate partner/client & receive JWT Bearer token.
- `POST /api/partner/location`: Continuous background GPS ping (`{ latitude, longitude, speed, heading }`).
- `GET /api/partners/nearby?lat=19.0728&lng=72.8826&radius=5`: Redis GEOSEARCH query returning online partners sorted by ETA.
- `POST /api/bookings`: Request new booking & trigger 15-second sequential dispatch engine.
- `POST /api/bookings/:id/accept`: Partner accepts booking offer.
- `POST /api/bookings/:id/reject`: Partner rejects booking offer.
- `PATCH /api/bookings/:id/status`: Transition booking state (`EN_ROUTE`, `SHOOTING`, `EDITING`, `DELIVERED`).

### Socket.IO Real-Time Protocol
- `partner:connect`: Join room `partner:<partnerId>`.
- `partner:location`: Emit continuous GPS coordinates.
- `booking:offer`: Broadcasted to candidate partner with 15-second timer payload.
- `booking:accepted` / `booking:rejected`: Responded by partner socket.
- `admin:joinMap`: Joins `admin:map` room for live fleet updates.
- `booking:statusChanged`: Broadcasted to client room `booking:<bookingId>`.

---

## 📄 Postman Collection & Production Documentation

- **Postman Collection**: Refer to [`orbit_postman_collection.json`](file:///c:/Users/utkar/OneDrive/Documents/Desktop/Orbit/orbit_postman_collection.json) in the workspace root.
- **Production Scaling & Architecture Notes**: Refer to [`docs/PRODUCTION_NOTES.md`](file:///c:/Users/utkar/OneDrive/Documents/Desktop/Orbit/docs/PRODUCTION_NOTES.md).
