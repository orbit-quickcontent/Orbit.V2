import 'package:latlong2/latlong.dart';

class RouteData {
  final int distanceMeters;
  final int durationSeconds;
  final int estimatedMinutes;
  final List<LatLng> points;
  final bool fallback;

  RouteData({
    required this.distanceMeters,
    required this.durationSeconds,
    required this.estimatedMinutes,
    required this.points,
    this.fallback = false,
  });

  factory RouteData.fromJson(Map<String, dynamic> json) {
    final coords = json['geometry']?['coordinates'] as List? ?? [];
    final pts = coords.map((c) => LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble())).toList();

    return RouteData(
      distanceMeters: (json['distanceMeters'] as num?)?.toInt() ?? 0,
      durationSeconds: (json['durationSeconds'] as num?)?.toInt() ?? 0,
      estimatedMinutes: (json['estimatedMinutes'] as num?)?.toInt() ??
          Math.max(1, (((json['durationSeconds'] as num?)?.toInt() ?? 0) / 60).ceil()),
      points: pts,
      fallback: json['fallback'] == true,
    );
  }
}

class Math {
  static int max(int a, int b) => a > b ? a : b;
}
