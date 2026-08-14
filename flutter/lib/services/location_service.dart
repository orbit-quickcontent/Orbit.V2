import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'socket_service.dart';

class LocationService {
  final SocketService socketService;
  final String? partnerId;

  LocationService({
    required this.socketService,
    this.partnerId,
  });

  StreamSubscription<Position>? _sub;
  bool _isTracking = false;
  bool get isTracking => _isTracking;

  /// Request permissions and start continuous 5-second GPS updates
  Future<bool> start() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      print('[LocationService] Location services are disabled.');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        print('[LocationService] Location permissions are denied.');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      print('[LocationService] Location permissions permanently denied.');
      return false;
    }

    // Capture initial one-shot position immediately
    try {
      Position initialPos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      socketService.sendPartnerLocation(
        lat: initialPos.latitude,
        lng: initialPos.longitude,
        speed: initialPos.speed,
        heading: initialPos.heading,
        partnerId: partnerId,
      );
    } catch (e) {
      print('[LocationService] Initial position error: $e');
    }

    // Continuous position stream
    const locationSettings = LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 5, // send updates when moved 5 meters
      timeLimit: null,
    );

    _sub = Geolocator.getPositionStream(locationSettings: locationSettings).listen(
      (Position pos) {
        socketService.sendPartnerLocation(
          lat: pos.latitude,
          lng: pos.longitude,
          speed: pos.speed,
          heading: pos.heading,
          partnerId: partnerId,
        );
      },
      onError: (err) {
        print('[LocationService] Stream error: $err');
      },
    );

    _isTracking = true;
    return true;
  }

  void stop() {
    _sub?.cancel();
    _sub = null;
    _isTracking = false;
  }
}
