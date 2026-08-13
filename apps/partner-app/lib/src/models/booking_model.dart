enum BookingStatus {
  pending,
  paid,
  dispatched,
  enRoute,
  shooting,
  syncing,
  editing,
  delivered,
  cancelled,
}

extension BookingStatusExtension on BookingStatus {
  String toShortString() {
    switch (this) {
      case BookingStatus.pending: return 'PENDING';
      case BookingStatus.paid: return 'PAID';
      case BookingStatus.dispatched: return 'DISPATCHED';
      case BookingStatus.enRoute: return 'EN_ROUTE';
      case BookingStatus.shooting: return 'SHOOTING';
      case BookingStatus.syncing: return 'SYNCING';
      case BookingStatus.editing: return 'EDITING';
      case BookingStatus.delivered: return 'DELIVERED';
      case BookingStatus.cancelled: return 'CANCELLED';
    }
  }

  static BookingStatus fromString(String? status) {
    switch ((status ?? 'PENDING').toUpperCase()) {
      case 'PAID': return BookingStatus.paid;
      case 'DISPATCHED':
      case 'PARTNER_DISPATCHED': return BookingStatus.dispatched;
      case 'EN_ROUTE': return BookingStatus.enRoute;
      case 'SHOOTING': return BookingStatus.shooting;
      case 'SYNCING': return BookingStatus.syncing;
      case 'EDITING': return BookingStatus.editing;
      case 'DELIVERED': return BookingStatus.delivered;
      case 'CANCELLED': return BookingStatus.cancelled;
      default: return BookingStatus.pending;
    }
  }
}

class BookingOffer {
  final String bookingId;
  final String clientId;
  final double pickupLat;
  final double pickupLng;
  final double destinationLat;
  final double destinationLng;
  final double distanceKm;
  final int etaMinutes;
  final int expiresInSeconds;

  BookingOffer({
    required this.bookingId,
    required this.clientId,
    required this.pickupLat,
    required this.pickupLng,
    required this.destinationLat,
    required this.destinationLng,
    required this.distanceKm,
    required this.etaMinutes,
    this.expiresInSeconds = 15,
  });

  factory BookingOffer.fromJson(Map<String, dynamic>? json) {
    final source = json ?? const <String, dynamic>{};
    return BookingOffer(
      bookingId: source['bookingId'] as String? ?? '',
      clientId: source['clientId'] as String? ?? '',
      pickupLat: (source['pickupLat'] as num?)?.toDouble() ?? 0,
      pickupLng: (source['pickupLng'] as num?)?.toDouble() ?? 0,
      destinationLat: (source['destinationLat'] as num?)?.toDouble() ?? 0,
      destinationLng: (source['destinationLng'] as num?)?.toDouble() ?? 0,
      distanceKm: (source['distanceKm'] as num?)?.toDouble() ?? 0,
      etaMinutes: (source['etaMinutes'] as num?)?.toInt() ?? 0,
      expiresInSeconds: (source['expiresInSeconds'] as num?)?.toInt() ?? 15,
    );
  }
}

class BookingModel {
  final String id;
  final String clientId;
  final String? partnerId;
  final double pickupLat;
  final double pickupLng;
  final double destinationLat;
  final double destinationLng;
  final BookingStatus status;

  BookingModel({
    required this.id,
    required this.clientId,
    this.partnerId,
    required this.pickupLat,
    required this.pickupLng,
    required this.destinationLat,
    required this.destinationLng,
    required this.status,
  });

  factory BookingModel.fromJson(Map<String, dynamic>? json) {
    final source = json ?? const <String, dynamic>{};
    return BookingModel(
      id: source['id'] as String? ?? source['bookingId'] as String? ?? '',
      clientId: source['clientId'] as String? ?? source['userId'] as String? ?? '',
      partnerId: source['partnerId'] as String?,
      pickupLat: (source['pickupLat'] as num?)?.toDouble() ?? (source['latitude'] as num?)?.toDouble() ?? 0,
      pickupLng: (source['pickupLng'] as num?)?.toDouble() ?? (source['longitude'] as num?)?.toDouble() ?? 0,
      destinationLat: (source['destinationLat'] as num?)?.toDouble() ?? 0,
      destinationLng: (source['destinationLng'] as num?)?.toDouble() ?? 0,
      status: BookingStatusExtension.fromString(source['status'] as String?),
    );
  }
}
