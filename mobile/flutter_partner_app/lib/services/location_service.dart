import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'socket_service.dart';

class LocationService extends ChangeNotifier {
  Timer? _timer;
  Position? _lastPosition;
  bool _isTracking = false;

  Position? get lastPosition => _lastPosition;
  bool get isTracking => _isTracking;

  Future<bool> checkAndRequestPermission() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('[LocationService] Location services are disabled.');
      return false;
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('[LocationService] Location permissions are denied');
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('[LocationService] Location permissions are permanently denied.');
      return false;
    }

    return true;
  }

  Future<void> startTracking(SocketService socketService) async {
    final hasPermission = await checkAndRequestPermission();
    if (!hasPermission) return;

    _isTracking = true;
    notifyListeners();

    // Send initial location immediately
    try {
      Position pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 5),
        ),
      );
      _lastPosition = pos;
      socketService.sendLocation(pos.latitude, pos.longitude, speed: pos.speed, heading: pos.heading);
      notifyListeners();
    } catch (e) {
      debugPrint('[LocationService] Initial position fetch failed: $e');
    }

    // High accuracy 5-second periodic update loop
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) async {
      try {
        Position pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
          ),
        );
        _lastPosition = pos;
        socketService.sendLocation(
          pos.latitude,
          pos.longitude,
          speed: pos.speed,
          heading: pos.heading,
        );
        notifyListeners();
      } catch (err) {
        debugPrint('[LocationService] Periodic GPS update error: $err');
      }
    });
  }

  void stopTracking() {
    _timer?.cancel();
    _timer = null;
    _isTracking = false;
    notifyListeners();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

final locationServiceProvider = ChangeNotifierProvider<LocationService>((ref) {
  return LocationService();
});
