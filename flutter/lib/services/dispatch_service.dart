import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class DispatchService {
  static Future<bool> triggerDispatch(String bookingId) async {
    try {
      final url = Uri.parse('${AppConfig.apiBaseUrl}/api/dispatch/$bookingId');
      final res = await http.post(url).timeout(const Duration(seconds: 5));
      return res.statusCode == 200;
    } catch (e) {
      print('DispatchService error: $e');
      return false;
    }
  }

  static Future<bool> cancelDispatch(String bookingId) async {
    try {
      final url = Uri.parse('${AppConfig.apiBaseUrl}/api/dispatch/$bookingId/cancel');
      final res = await http.post(url).timeout(const Duration(seconds: 5));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
