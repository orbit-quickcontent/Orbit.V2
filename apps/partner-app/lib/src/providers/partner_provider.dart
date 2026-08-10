import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/partner_model.dart';
import '../models/location_model.dart';
import '../models/booking_model.dart';
import '../services/partner_repository.dart';
import '../services/location_service.dart';
import '../services/socket_service.dart';

final partnerRepositoryProvider = Provider<PartnerRepository>((ref) {
  return PartnerRepository();
});

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

final socketServiceProvider = Provider<SocketService>((ref) {
  return SocketService();
});

class PartnerState {
  final PartnerStatus status;
  final LocationModel? currentLocation;
  final BookingOffer? activeOffer;
  final String? activeBookingId;
  final String? partnerId;
  final String? email;

  PartnerState({
    this.status = PartnerStatus.offline,
    this.currentLocation,
    this.activeOffer,
    this.activeBookingId,
    this.partnerId,
    this.email,
  });

  PartnerState copyWith({
    PartnerStatus? status,
    LocationModel? currentLocation,
    BookingOffer? activeOffer,
    String? activeBookingId,
    String? partnerId,
    String? email,
  }) {
    return PartnerState(
      status: status ?? this.status,
      currentLocation: currentLocation ?? this.currentLocation,
      activeOffer: activeOffer,
      activeBookingId: activeBookingId ?? this.activeBookingId,
      partnerId: partnerId ?? this.partnerId,
      email: email ?? this.email,
    );
  }
}

class PartnerNotifier extends StateNotifier<PartnerState> {
  final Ref ref;

  PartnerNotifier(this.ref) : super(PartnerState()) {
    _listenToSocketOffers();
  }

  void _listenToSocketOffers() {
    ref.read(socketServiceProvider).bookingOfferStream.listen((offer) {
      state = state.copyWith(activeOffer: offer);
    });
  }

  void setPartnerCredentials(String partnerId, String email, String token) {
    state = state.copyWith(partnerId: partnerId, email: email);
    final repo = ref.read(partnerRepositoryProvider);
    repo.authToken = token;
    final socketBaseUrl = repo.baseUrl.replaceAll('/api', '');
    ref.read(socketServiceProvider).init(
          baseUrl: socketBaseUrl,
          authToken: token,
        );
    ref.read(socketServiceProvider).connectPartner(partnerId);
  }

  Future<bool> loginGoogle(String email, {String? name, String? photoURL}) async {
    final repo = ref.read(partnerRepositoryProvider);
    final data = await repo.loginGoogle(email: email, name: name, photoURL: photoURL);
    if (data != null && data['success'] == true) {
      final user = data['user'] ?? {};
      final token = data['token'] ?? data['accessToken'] ?? '';
      final pid = user['partnerId'] ?? data['partnerId'] ?? user['id'] ?? 'prt-google';
      setPartnerCredentials(pid, email, token);
      return true;
    }
    return false;
  }

  Future<bool> loginApple(String email, {String? name}) async {
    final repo = ref.read(partnerRepositoryProvider);
    final data = await repo.loginApple(email: email, name: name);
    if (data != null && data['success'] == true) {
      final user = data['user'] ?? {};
      final token = data['token'] ?? data['accessToken'] ?? '';
      final pid = user['partnerId'] ?? data['partnerId'] ?? user['id'] ?? 'prt-apple';
      setPartnerCredentials(pid, email, token);
      return true;
    }
    return false;
  }

  void toggleOnlineStatus(bool online) {
    final newStatus = online ? PartnerStatus.online : PartnerStatus.offline;
    state = state.copyWith(status: newStatus);

    final locService = ref.read(locationServiceProvider);
    final repo = ref.read(partnerRepositoryProvider);
    final socket = ref.read(socketServiceProvider);

    if (online) {
      locService.start5SecondTracking((location) {
        state = state.copyWith(currentLocation: location);
        repo.sendLocationUpdateRest(location);
        socket.sendLocationUpdate(location);
      });
    } else {
      locService.stopTracking();
    }
  }

  Future<bool> acceptActiveOffer() async {
    if (state.activeOffer == null || state.partnerId == null) return false;
    final bookingId = state.activeOffer!.bookingId;

    final repo = ref.read(partnerRepositoryProvider);
    final socket = ref.read(socketServiceProvider);

    final success = await repo.acceptBooking(bookingId);
    if (success) {
      socket.acceptBookingOffer(bookingId, state.partnerId!);
      state = state.copyWith(
        status: PartnerStatus.busy,
        activeBookingId: bookingId,
        activeOffer: null,
      );
      return true;
    }
    return false;
  }

  void rejectActiveOffer() {
    if (state.activeOffer == null || state.partnerId == null) return;
    final bookingId = state.activeOffer!.bookingId;

    ref.read(partnerRepositoryProvider).rejectBooking(bookingId);
    ref.read(socketServiceProvider).rejectBookingOffer(bookingId, state.partnerId!);

    state = state.copyWith(activeOffer: null);
  }

  void updateTripStatus(BookingStatus status) {
    if (state.activeBookingId == null) return;

    ref
        .read(partnerRepositoryProvider)
        .updateBookingStatus(state.activeBookingId!, status.toShortString());

    if (status == BookingStatus.delivered || status == BookingStatus.cancelled) {
      state = state.copyWith(
        status: PartnerStatus.online,
        activeBookingId: null,
      );
    } else {
      state = state.copyWith(status: PartnerStatus.onTrip);
    }
  }
}

final partnerProvider = StateNotifierProvider<PartnerNotifier, PartnerState>((ref) {
  return PartnerNotifier(ref);
});
