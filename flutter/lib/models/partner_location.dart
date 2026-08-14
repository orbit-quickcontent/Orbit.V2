class PartnerLocation {
  final String partnerId;
  final double lat;
  final double lng;
  final double speed;
  final double heading;
  final double accuracy;
  final int timestamp;

  PartnerLocation({
    required this.partnerId,
    required this.lat,
    required this.lng,
    this.speed = 0.0,
    this.heading = 0.0,
    this.accuracy = 0.0,
    required this.timestamp,
  });

  factory PartnerLocation.fromJson(Map<String, dynamic> json) {
    return PartnerLocation(
      partnerId: json['partnerId']?.toString() ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
      speed: (json['speed'] as num?)?.toDouble() ?? 0.0,
      heading: (json['heading'] as num?)?.toDouble() ?? 0.0,
      accuracy: (json['accuracy'] as num?)?.toDouble() ?? 0.0,
      timestamp: (json['timestamp'] as num?)?.toInt() ?? DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() => {
    'partnerId': partnerId,
    'lat': lat,
    'lng': lng,
    'speed': speed,
    'heading': heading,
    'accuracy': accuracy,
    'timestamp': timestamp,
  };
}
