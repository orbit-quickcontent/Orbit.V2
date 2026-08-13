import 'dart:convert';
import 'package:http/http.dart' as http;

class OrbitApi {
  OrbitApi({String? baseUrl}) : baseUrl = (baseUrl ?? const String.fromEnvironment('ORBIT_API_URL', defaultValue: 'http://10.0.2.2:5000/api')).replaceAll(RegExp(r'/$'), '');

  final String baseUrl;
  String? accessToken;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (accessToken != null) 'Authorization': 'Bearer $accessToken',
      };

  Future<Map<String, dynamic>> _json(http.Response response) async {
    final body = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(body['error']?.toString() ?? 'ORBIT request failed (${response.statusCode})');
    }
    return body;
  }

  Future<List<Map<String, dynamic>>> packages() async {
    final r = await http.get(Uri.parse('$baseUrl/packages'));
    final data = await _json(r);
    final items = (data['packages'] ?? data['data'] ?? []) as List;
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<void> sendOtp(String email) async {
    await _json(await http.post(Uri.parse('$baseUrl/auth/send-otp'), headers: _headers, body: jsonEncode({'email': email, 'role': 'CLIENT'})));
  }

  Future<Map<String, dynamic>> verifyOtp(String email, String code) async {
    return _json(await http.post(Uri.parse('$baseUrl/auth/verify-otp'), headers: _headers, body: jsonEncode({'email': email, 'otp': code, 'role': 'CLIENT'})));
  }

  Future<Map<String, dynamic>> createPaymentOrder({required double amount, required String bookingId}) async {
    return _json(await http.post(Uri.parse('$baseUrl/payments/order'), headers: {..._headers, 'Idempotency-Key': 'client-$bookingId'}, body: jsonEncode({'amount': amount, 'currency': 'INR', 'bookingId': bookingId})));
  }

  Future<Map<String, dynamic>> createBooking({required String packageId, required String bookingDate, required String timeSlot, required String location, required double lat, required double lng, String? notes}) async {
    return _json(await http.post(Uri.parse('$baseUrl/bookings'), headers: {..._headers, 'Idempotency-Key': 'booking-${DateTime.now().microsecondsSinceEpoch}'}, body: jsonEncode({
      'packageId': packageId,
      'bookingDate': bookingDate,
      'timeSlot': timeSlot,
      'location': location,
      'lat': lat,
      'lng': lng,
      'notes': notes,
    })));
  }

  Future<List<Map<String, dynamic>>> bookings() async {
    final data = await _json(await http.get(Uri.parse('$baseUrl/bookings'), headers: _headers));
    final items = (data['bookings'] ?? []) as List;
    return items.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  Future<Map<String, dynamic>> tracking(String bookingId) async {
    return _json(await http.get(Uri.parse('$baseUrl/bookings/$bookingId/track'), headers: _headers));
  }
}
