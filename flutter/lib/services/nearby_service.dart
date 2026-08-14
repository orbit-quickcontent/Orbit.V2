import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class NearbyPartnerInfo {
  final String partnerId;
  final double distanceKm;
  final double lat;
  final double lng;
  final String availability;
  final double rating;

  NearbyPartnerInfo({
    required this.partnerId,
    required this.distanceKm,
    required this.lat,
    required this.lng,
    required this.availability,
    this.rating = 4.9,
  });

  factory NearbyPartnerInfo.fromJson(Map<String, dynamic> json) {
    return NearbyPartnerInfo(
      partnerId: json['partnerId']?.toString() ?? '',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
      availability: json['availability']?.toString() ?? 'AVAILABLE',
      rating: (json['rating'] as num?)?.toDouble() ?? 4.9,
    );
  }
}

class NearbyService {
  static Future<List<NearbyPartnerInfo>> getNearbyPartners({
    required double lat,
    required double lng,
    double radiusKm = 5.0,
  }) async {
    try {
      final url = Uri.parse(
        '${AppConfig.apiBaseUrl}/api/partners/nearby?lat=$lat&lng=$lng&radius=$radiusKm',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 4));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = data['partners'] as List? ?? [];
        return list.map((p) => NearbyPartnerInfo.fromJson(p)).toList();
      }
    } catch (e) {
      print('NearbyService error: $e');
    }
    return [];
  }
}
