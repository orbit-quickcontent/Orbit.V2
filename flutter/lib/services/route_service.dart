import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/route_data.dart';

class RouteService {
  static Future<RouteData?> fetchRoute({
    required double fromLat,
    required double fromLng,
    required double toLat,
    required double toLng,
  }) async {
    try {
      final url = Uri.parse(
        '${AppConfig.apiBaseUrl}/api/route?fromLat=$fromLat&fromLng=$fromLng&toLat=$toLat&toLng=$toLng',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return RouteData.fromJson(data);
      }
    } catch (e) {
      print('RouteService error: $e');
    }
    return null;
  }
}
