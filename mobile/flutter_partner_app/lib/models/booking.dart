enum BookingStatus {
  pending,
  searching,
  offered,
  accepted,
  enRoute,
  arrived,
  shooting,
  uploading,
  editing,
  delivered,
  cancelled,
  expired
}

BookingStatus parseBookingStatus(String statusStr) {
  switch (statusStr.toUpperCase()) {
    case 'PENDING':
      return BookingStatus.pending;
    case 'SEARCHING':
      return BookingStatus.searching;
    case 'OFFERED':
      return BookingStatus.offered;
    case 'ACCEPTED':
      return BookingStatus.accepted;
    case 'EN_ROUTE':
      return BookingStatus.enRoute;
    case 'ARRIVED':
      return BookingStatus.arrived;
    case 'SHOOTING':
      return BookingStatus.shooting;
    case 'UPLOADING':
      return BookingStatus.uploading;
    case 'EDITING':
      return BookingStatus.editing;
    case 'DELIVERED':
      return BookingStatus.delivered;
    case 'CANCELLED':
      return BookingStatus.cancelled;
    case 'EXPIRED':
      return BookingStatus.expired;
    default:
      return BookingStatus.pending;
  }
}

class BookingOffer {
  final String bookingId;
  final double clientLat;
  final double clientLng;
  final String clientAddress;
  final double distanceKm;
  final double price;
  final int timeoutSeconds;
  final String createdAt;

  BookingOffer({
    required this.bookingId,
    required this.clientLat,
    required this.clientLng,
    required this.clientAddress,
    required this.distanceKm,
    required this.price,
    required this.timeoutSeconds,
    required this.createdAt,
  });

  factory BookingOffer.fromJson(Map<String, dynamic> json) {
    return BookingOffer(
      bookingId: json['bookingId'] ?? '',
      clientLat: (json['clientLat'] as num?)?.toDouble() ?? 0.0,
      clientLng: (json['clientLng'] as num?)?.toDouble() ?? 0.0,
      clientAddress: json['clientAddress'] ?? 'Client Location',
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 0.0,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      timeoutSeconds: json['timeoutSeconds'] ?? 15,
      createdAt: json['createdAt'] ?? '',
    );
  }
}
