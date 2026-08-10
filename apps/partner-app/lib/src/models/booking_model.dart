enum BookingStatus {
  pending,
  assigned,
  accepted,
  enRoute,
  shooting,
  editing,
  delivered,
  cancelled,
}

extension BookingStatusExtension on BookingStatus {
  String toShortString() {
    switch (this) {
      case BookingStatus.pending:
        return 'PENDING';
      case BookingStatus.assigned:
        return 'ASSIGNED';
      case BookingStatus.accepted:
        return 'ACCEPTED';
      case BookingStatus.enRoute:
        return 'EN_ROUTE';
      case BookingStatus.shooting:
        return 'SHOOTING';
      case BookingStatus.editing:
        return 'EDITING';
      case BookingStatus.delivered:
        return 'DELIVERED';
      case BookingStatus.cancelled:
        return 'CANCELLED';
    }
  }

  static BookingStatus fromString(String? status) {
    if (status == null) return BookingStatus.pending;
    switch (status.toUpperCase()) {
      case 'ASSIGNED':
        return BookingStatus.assigned;
      case 'ACCEPTED':
        return BookingStatus.accepted;
      case 'EN_ROUTE':
        return BookingStatus.enRoute;
      case 'SHOOTING':
        return BookingStatus.shooting;
      case 'EDITING':
        return BookingStatus.editing;
      case 'DELIVERED':
        return BookingStatus.delivered;
      case 'CANCELLED':
        return BookingStatus.cancelled;
      case 'PENDING':
      default:
        return BookingStatus.pending;
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
    if (json == null) {
      return BookingOffer(
        bookingId: '',
        clientId: '',
        pickupLat: 0.0,
        pickupLng: 0.0,
        destinationLat: 0.0,
        destinationLng: 0.0,
        distanceKm: 0.0,
        etaMinutes: 0,
        expiresInSeconds: 15,
      );
    }

    return BookingOffer(
      bookingId: json['bookingId'] as String? ?? '',
      clientId: json['clientId'] as String? ?? '',
      pickupLat: (json['pickupLat'] as num?)?.toDouble() ?? 0.0,
      pickupLng: (json['pickupLng'] as num?)?.toDouble() ?? 0.0,
      destinationLat: (json['destinationLat'] as num?)?.toDouble() ?? 0.0,
      destinationLng: (json['destinationLng'] as num?)?.toDouble() ?? 0.0,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
      etaMinutes: (json['etaMinutes'] as num?)?.toInt() ?? 0,
      expiresInSeconds: (json['expiresInSeconds'] as num?)?.toInt() ?? 15,
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
    if (json == null) {
      return BookingModel(
        id: '',
        clientId: '',
        pickupLat: 0.0,
        pickupLng: 0.0,
        destinationLat: 0.0,
        destinationLng: 0.0,
        status: BookingStatus.pending,
      );
    }

    return BookingModel(
      id: json['id'] as String? ?? json['bookingId'] as String? ?? '',
      clientId: json['clientId'] as String? ?? '',
      partnerId: json['partnerId'] as String?,
      pickupLat: (json['pickupLat'] as num?)?.toDouble() ?? 0.0,
      pickupLng: (json['pickupLng'] as num?)?.toDouble() ?? 0.0,
      destinationLat: (json['destinationLat'] as num?)?.toDouble() ?? 0.0,
      destinationLng: (json['destinationLng'] as num?)?.toDouble() ?? 0.0,
      status: BookingStatusExtension.fromString(json['status'] as String?),
    );
  }
}
