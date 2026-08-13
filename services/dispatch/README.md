# ORBIT Nearby Partner Dispatch Engine

High-performance real-time dispatch service modeled after Uber/Ola for **ORBIT QuickContent**.

---

## Key Features

- **Express & Node.js Backend**: Fast HTTP API for client bookings and partner lifecycle.
- **Socket.IO Real-time Communication**: Instant push of booking requests to nearest online partners.
- **Redis GEO Support**: `GEOADD` and `GEOSEARCH` within 5 km radius, sorted ascending by proximity. (Includes automatic in-memory haversine fallback when running in dev mode without Docker/Redis).
- **Automated Proximity Dispatch**: Automatic 20-second offer waterfall to the closest connected partner; escalates to the 2nd nearest partner if rejected or timed out.
- **Accept/Reject Flow**: Instant reassignment and booking status updates.
- **JWT Auth Placeholder**: Token verification middleware for secure partner communication.

---

## 1. Quick Start

### Install Dependencies
```bash
cd services/dispatch
npm install
```

### Start Redis (Docker)
```bash
docker run -d -p 6379:6379 --name orbit-redis redis
```

### Start Dispatch Server
```bash
npm start
# or: node src/server.js
```
The server will run on `http://localhost:5000` with WebSocket endpoint `ws://localhost:5000`.

---

## 2. API Endpoints

### 📍 Partner Updates Location / Goes Online
```bash
curl -X POST http://localhost:5000/partner/location \
  -H "Content-Type: application/json" \
  -d '{"partnerId":"p1","lat":19.0781,"lng":72.8792,"online":true}'
```

### 🎬 Client Creates Booking
```bash
curl -X POST http://localhost:5000/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 19.0760,
    "lng": 72.8777,
    "service": "Instagram Reel Shoot (60 min)",
    "amount": 499,
    "partnerEarning": 350
  }'
```

### ✅ Partner Accepts Booking Offer
```bash
curl -X POST http://localhost:5000/partner/bookings/<BOOKING_ID>/accept \
  -H "Content-Type: application/json" \
  -d '{"partnerId":"p1"}'
```

### ❌ Partner Rejects Booking Offer (Immediately re-dispatches to next partner)
```bash
curl -X POST http://localhost:5000/partner/bookings/<BOOKING_ID>/reject \
  -H "Content-Type: application/json" \
  -d '{"partnerId":"p1", "reason":"Unavailable"}'
```

---

## 3. Flutter Partner App Listener

Add dependency to `pubspec.yaml`:
```yaml
dependencies:
  socket_io_client: ^2.0.3+1
  http: ^1.2.0
```

### PartnerSocketService Implementation
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as IO;

class PartnerSocketService {
  late IO.Socket socket;
  final String serverUrl = 'http://10.0.2.2:5000'; // For Android emulator (use localhost for iOS)

  void connect(String partnerId) {
    socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.connect();

    socket.onConnect((_) {
      print('Connected to ORBIT Dispatch WebSocket');
      socket.emit('partner:register', {'partnerId': partnerId});
    });

    // Real-time booking offer from Dispatch Engine
    socket.on('booking_request', (data) {
      print('⚡ New Booking Request Received: $data');
      // e.g., show incoming booking bottom sheet / alert with 20s timer
    });

    // Offer expired or reassigned to another partner
    socket.on('booking:offer_expired', (data) {
      print('Offer expired for booking: ${data['bookingId']}');
    });

    // Booking confirmed & assigned to this partner
    socket.on('booking:assigned', (data) {
      print('Booking assigned successfully: $data');
    });
  }

  // Stream current partner GPS to dispatch engine
  void updateLocation(String partnerId, double lat, double lng) {
    socket.emit('partner:location:update', {
      'partnerId': partnerId,
      'lat': lat,
      'lng': lng,
    });
  }

  // Accept booking offer
  Future<bool> acceptBooking(String bookingId, String partnerId) async {
    final response = await http.post(
      Uri.parse('$serverUrl/partner/bookings/$bookingId/accept'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'partnerId': partnerId}),
    );

    final resData = jsonDecode(response.body);
    return resData['success'] == true;
  }

  // Reject booking offer
  Future<bool> rejectBooking(String bookingId, String partnerId, {String? reason}) async {
    final response = await http.post(
      Uri.parse('$serverUrl/partner/bookings/$bookingId/reject'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'partnerId': partnerId, 'reason': reason ?? 'REJECTED'}),
    );

    final resData = jsonDecode(response.body);
    return resData['success'] == true;
  }
}
```
