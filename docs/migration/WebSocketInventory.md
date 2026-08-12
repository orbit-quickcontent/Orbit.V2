# WebSocket Inventory

Comprehensive documentation of real-time WebSocket channels, rooms, and payload schemas managed by `backend/src/services/websocket.service.ts` on port 3003 / standard socket connection.

---

## 1. Socket Rooms
- `booking:{bookingId}`: Subscribed by client app to receive live shoot progress updates.
- Partner Sockets: Tracked via `onlinePartners` map (`partnerId -> Set<socketId>`) for targeted dispatches.

---

## 2. Client-to-Server Events
- `partner:online`
  - **Payload:** `{ partnerId: string }`
  - **Description:** Registers partner socket as online and ready for dispatch.
- `partner:offline`
  - **Payload:** `{ partnerId: string }`
  - **Description:** Removes partner socket from online map.
- `client:subscribe`
  - **Payload:** `{ bookingId: string }`
  - **Description:** Joins `booking:{bookingId}` room for live tracking updates.
- `locationChanged`
  - **Payload:** `{ latitude: number, longitude: number, bookingId: string }`
  - **Description:** Emits partner live location to client room.

---

## 3. Server-to-Client Events
- `booking:dispatched`
  - **Payload:** `{ booking: BookingDto, dispatchId: string, round: number }`
  - **Description:** Sent to eligible online partners when a new dispatch occurs.
- `booking:partner-assigned`
  - **Payload:** `{ bookingId: string, partnerId: string, partnerName: string }`
  - **Description:** Emitted to client room when a partner accepts the shoot.
- `booking:accepted-by-other`
  - **Payload:** `{ bookingId: string, acceptedByPartnerId: string }`
  - **Description:** Sent to all other online partners to clear the dispatch alert.
- `[dynamic_event]` (e.g. `statusChanged`, `syncProgressUpdated`)
  - **Payload:** Custom payload objects
  - **Description:** Emitted via `/internal/notify-client` HTTP endpoint.
