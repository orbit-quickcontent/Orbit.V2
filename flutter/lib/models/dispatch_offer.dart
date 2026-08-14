class DispatchOffer {
  final String bookingId;
  final String dispatchId;
  final int round;
  final double partnerEarningAmount; // ₹700
  final String currency;
  final String expiresAt;
  final int timeoutSeconds;
  final double distanceKm;
  final int etaMinutes;
  final Map<String, dynamic>? bookingDetails;

  DispatchOffer({
    required this.bookingId,
    required this.dispatchId,
    required this.round,
    required this.partnerEarningAmount,
    this.currency = 'INR',
    required this.expiresAt,
    required this.timeoutSeconds,
    required this.distanceKm,
    required this.etaMinutes,
    this.bookingDetails,
  });

  factory DispatchOffer.fromJson(Map<String, dynamic> json) {
    final booking = json['booking'] is Map ? Map<String, dynamic>.from(json['booking']) : null;
    return DispatchOffer(
      bookingId: json['bookingId']?.toString() ?? json['id']?.toString() ?? '',
      dispatchId: json['dispatchId']?.toString() ?? '',
      round: (json['round'] as num?)?.toInt() ?? 1,
      partnerEarningAmount: (json['partnerEarningAmount'] as num?)?.toDouble() ??
          (json['earningAmount'] as num?)?.toDouble() ?? 700.0,
      currency: json['currency']?.toString() ?? 'INR',
      expiresAt: json['expiresAt']?.toString() ?? '',
      timeoutSeconds: (json['timeoutSeconds'] as num?)?.toInt() ??
          (json['expiresInSeconds'] as num?)?.toInt() ?? 20,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ?? 1.5,
      etaMinutes: (json['etaMinutes'] as num?)?.toInt() ?? 5,
      bookingDetails: booking,
    );
  }
}
