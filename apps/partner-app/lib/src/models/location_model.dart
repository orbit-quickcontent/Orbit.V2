class LocationModel {
  final double latitude;
  final double longitude;
  final double speed;
  final double heading;
  final DateTime timestamp;

  LocationModel({
    required this.latitude,
    required this.longitude,
    this.speed = 0.0,
    this.heading = 0.0,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      'speed': speed,
      'heading': heading,
      'timestamp': timestamp.toIso8601String(),
    };
  }

  factory LocationModel.fromJson(Map<String, dynamic> json) {
    return LocationModel(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      speed: json['speed'] != null ? (json['speed'] as num).toDouble() : 0.0,
      heading: json['heading'] != null ? (json['heading'] as num).toDouble() : 0.0,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
    );
  }
}
