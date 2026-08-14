import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'socket_service.dart';

class LocationService {
  final SocketService socketService;
  StreamSubscription<Position>? _sub;

  LocationService(this.socketService);

  Future<void> start({String? bookingId}) async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        print('Location permission denied');
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      print('Location permission permanently denied');
      return;
    }

    _sub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5, // Update every 5 meters
      ),
    ).listen((pos) {
      socketService.sendPartnerLocation(
        pos.latitude,
        pos.longitude,
        bookingId: bookingId,
      );
    });
  }

  void stop() {
    _sub?.cancel();
    _sub = null;
  }
}
