enum PartnerStatus { offline, online, busy, onTrip }

extension PartnerStatusExtension on PartnerStatus {
  String toShortString() {
    switch (this) {
      case PartnerStatus.offline:
        return 'OFFLINE';
      case PartnerStatus.online:
        return 'ONLINE';
      case PartnerStatus.busy:
        return 'BUSY';
      case PartnerStatus.onTrip:
        return 'ON_TRIP';
    }
  }

  static PartnerStatus fromString(String? status) {
    if (status == null) return PartnerStatus.offline;
    switch (status.toUpperCase()) {
      case 'ONLINE':
        return PartnerStatus.online;
      case 'BUSY':
        return PartnerStatus.busy;
      case 'ON_TRIP':
        return PartnerStatus.onTrip;
      case 'OFFLINE':
      default:
        return PartnerStatus.offline;
    }
  }
}

class PartnerModel {
  final String id;
  final String? name; // Nullable optional field
  final String? phone;
  final String? email;
  final String? vehicleType;
  final PartnerStatus status;
  final double rating;
  final double latitude;
  final double longitude;
  final double distanceKm;
  final int etaMinutes;

  PartnerModel({
    required this.id,
    this.name,
    this.phone,
    this.email,
    this.vehicleType,
    required this.status,
    this.rating = 5.0,
    required this.latitude,
    required this.longitude,
    this.distanceKm = 0.0,
    this.etaMinutes = 0,
  });

  factory PartnerModel.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return PartnerModel(
        id: '',
        name: 'Unknown Partner',
        status: PartnerStatus.offline,
        latitude: 0.0,
        longitude: 0.0,
      );
    }

    return PartnerModel(
      id: json['id'] as String? ?? json['partnerId'] as String? ?? '',
      name: json['name'] as String? ?? 'Unknown Partner',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      vehicleType: json['vehicleType'] as String?,
      status: PartnerStatusExtension.fromString(json['status'] as String?),
      rating: (json['rating'] as num?)?.toDouble() ?? 5.0,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
      etaMinutes: (json['etaMinutes'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'email': email,
      'vehicleType': vehicleType,
      'status': status.toShortString(),
      'rating': rating,
      'latitude': latitude,
      'longitude': longitude,
      'distanceKm': distanceKm,
      'etaMinutes': etaMinutes,
    };
  }
}
