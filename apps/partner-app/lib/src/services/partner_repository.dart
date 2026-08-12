import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/location_model.dart';

class PartnerRepository {
  late String baseUrl;
  String? authToken;

  PartnerRepository({
    String? baseUrl,
    this.authToken,
  }) {
    this.baseUrl = baseUrl ?? defaultApiUrl;
  }

  static String get defaultApiUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5000/api'; // Android emulator host loopback
    }
    return 'http://localhost:5000/api';
  }

  Future<Map<String, dynamic>?> login(String email) async {
    try {
      final url = Uri.parse('$baseUrl/auth/login');
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'role': 'PARTNER'}),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        authToken = data['token'] ?? data['accessToken'];
        return data;
      } else {
        if (kDebugMode) print('[API_LOGIN_ERR] Status Code: ${response.statusCode}, Body: ${response.body}');
        return null;
      }
    } catch (e) {
      if (kDebugMode) print('[API_LOGIN_EXCEPTION] $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> loginGoogle({
    required String email,
    String? name,
    String? photoURL,
    String? idToken,
    String role = 'PARTNER',
  }) async {
    try {
      final url = Uri.parse('$baseUrl/auth/google');
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email,
              'name': name ?? 'Google Partner',
              'photoURL': photoURL,
              'idToken': idToken,
              'role': role,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        authToken = data['token'] ?? data['accessToken'];
        return data;
      } else {
        if (kDebugMode) print('[API_GOOGLE_LOGIN_ERR] Status: ${response.statusCode}, Body: ${response.body}');
        return null;
      }
    } catch (e) {
      if (kDebugMode) print('[API_GOOGLE_LOGIN_EXCEPTION] $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> loginApple({
    required String email,
    String? name,
    String? identityToken,
    String role = 'PARTNER',
  }) async {
    try {
      final url = Uri.parse('$baseUrl/auth/apple');
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'email': email,
              'name': name ?? 'Apple Partner',
              'identityToken': identityToken,
              'role': role,
            }),
          )
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        authToken = data['token'] ?? data['accessToken'];
        return data;
      } else {
        if (kDebugMode) print('[API_APPLE_LOGIN_ERR] Status: ${response.statusCode}, Body: ${response.body}');
        return null;
      }
    } catch (e) {
      if (kDebugMode) print('[API_APPLE_LOGIN_EXCEPTION] $e');
      return null;
    }
  }

  Future<bool> updateProfile({
    required String name,
    required String phone,
    String? address,
  }) async {
    if (authToken == null) return false;

    try {
      final url = Uri.parse('$baseUrl/users');
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $authToken',
            },
            body: jsonEncode({
              'name': name,
              'phone': phone,
              'address': address,
            }),
          )
          .timeout(const Duration(seconds: 8));

      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) print('[API_UPDATE_PROFILE_ERR] $e');
      return false;
    }
  }

  Future<bool> sendLocationUpdateRest(LocationModel location) async {
    if (authToken == null) return false;

    try {
      final url = Uri.parse('$baseUrl/partner/location');
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $authToken',
            },
            body: jsonEncode({
              'latitude': location.latitude,
              'longitude': location.longitude,
              'speed': location.speed,
              'heading': location.heading,
            }),
          )
          .timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) print('[API_LOCATION_ERR] $e');
      return false;
    }
  }

  Future<bool> acceptBooking(String bookingId) async {
    if (authToken == null) return false;

    try {
      final url = Uri.parse('$baseUrl/bookings/$bookingId/accept');
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $authToken',
            },
          )
          .timeout(const Duration(seconds: 8));

      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) print('[API_ACCEPT_ERR] $e');
      return false;
    }
  }

  Future<bool> rejectBooking(String bookingId) async {
    if (authToken == null) return false;

    try {
      final url = Uri.parse('$baseUrl/bookings/$bookingId/reject');
      final response = await http
          .post(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $authToken',
            },
          )
          .timeout(const Duration(seconds: 8));

      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) print('[API_REJECT_ERR] $e');
      return false;
    }
  }

  Future<bool> updateBookingStatus(String bookingId, String status) async {
    if (authToken == null) return false;

    try {
      final url = Uri.parse('$baseUrl/bookings/$bookingId/status');
      final response = await http
          .patch(
            url,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $authToken',
            },
            body: jsonEncode({'status': status}),
          )
          .timeout(const Duration(seconds: 8));

      return response.statusCode == 200;
    } catch (e) {
      if (kDebugMode) print('[API_STATUS_UPDATE_ERR] $e');
      return false;
    }
  }
}
