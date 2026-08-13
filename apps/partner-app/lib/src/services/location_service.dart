import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../models/location_model.dart';

class LocationService {
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;
  LocationService._internal();

  StreamController<LocationModel>? _locationStreamController;
  Stream<LocationModel>? get locationStream => _locationStreamController?.stream;

  LocationModel? lastKnownLocation;
  Timer? _timer;

  Future<bool> checkAndRequestPermissions() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (kDebugMode) print('[LOCATION_SERVICE] GPS Location services are disabled on device.');
        return false;
      }

      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (kDebugMode) print('[LOCATION_SERVICE] Location permissions are denied by user.');
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (kDebugMode) print('[LOCATION_SERVICE] Location permissions are permanently denied.');
        await openAppSettings();
        return false;
      }

      final backgroundStatus = await Permission.locationAlways.status;
      if (backgroundStatus.isDenied) {
        await Permission.locationAlways.request();
      }

      return true;
    } catch (e) {
      if (kDebugMode) print('[LOCATION_SERVICE] Error checking permissions: $e');
      return false;
    }
  }

  Future<LocationModel?> getCurrentLocation() async {
    try {
      final hasPermission = await checkAndRequestPermissions();
      if (!hasPermission) return null;

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      final location = LocationModel(
        latitude: position.latitude,
        longitude: position.longitude,
        speed: position.speed,
        heading: position.heading,
      );

      lastKnownLocation = location;
      return location;
    } catch (e) {
      if (kDebugMode) print('[LOCATION_SERVICE] Error fetching current location: $e');
      return lastKnownLocation;
    }
  }

  void start5SecondTracking(Function(LocationModel) onLocationUpdate) {
    stopTracking();
    _locationStreamController = StreamController<LocationModel>.broadcast();

    _timer = Timer.periodic(const Duration(seconds: 5), (timer) async {
      final loc = await getCurrentLocation();
      if (loc != null) {
        _locationStreamController?.add(loc);
        onLocationUpdate(loc);
      }
    });
  }

  void stopTracking() {
    _timer?.cancel();
    _timer = null;
    _locationStreamController?.close();
    _locationStreamController = null;
  }
}
