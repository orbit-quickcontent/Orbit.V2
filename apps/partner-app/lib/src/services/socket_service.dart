import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/booking_model.dart';
import '../models/location_model.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  final StreamController<BookingOffer> _bookingOfferController =
      StreamController<BookingOffer>.broadcast();
  final StreamController<Map<String, dynamic>> _statusChangeController =
      StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<String> _errorController =
      StreamController<String>.broadcast();

  Stream<BookingOffer> get bookingOfferStream => _bookingOfferController.stream;
  Stream<Map<String, dynamic>> get statusChangeStream => _statusChangeController.stream;
  Stream<String> get errorStream => _errorController.stream;

  bool get isConnected => _socket?.connected ?? false;

  /// Determines default server host URL based on platform (Android Emulator vs iOS/Desktop)
  static String get defaultSocketUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5000'; // Android emulator host localhost loopback
    }
    return 'http://localhost:5000';
  }

  void init({String? baseUrl, String? authToken}) {
    final targetUrl = baseUrl ?? defaultSocketUrl;

    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
    }

    try {
      _socket = io.io(
        targetUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(10)
            .setReconnectionDelay(1000)
            .setExtraHeaders(
              authToken != null ? {'Authorization': 'Bearer $authToken'} : {},
            )
            .build(),
      );

      _socket!.onConnect((_) {
        if (kDebugMode) print('[SOCKET_CONNECTED] Socket ID: ${_socket!.id}');
      });

      _socket!.onConnectError((err) {
        if (kDebugMode) print('[SOCKET_CONNECT_ERROR] $err');
        _errorController.add('Socket connection error: $err');
      });

      _socket!.onError((err) {
        if (kDebugMode) print('[SOCKET_ERROR] $err');
        _errorController.add('Socket error: $err');
      });

      _socket!.onDisconnect((reason) {
        if (kDebugMode) print('[SOCKET_DISCONNECTED] Reason: $reason');
      });

      // Listen for incoming booking dispatch offers
      _socket!.on('booking:offer', (data) {
        try {
          if (kDebugMode) print('[SOCKET_RECEIVED_BOOKING_OFFER]: $data');
          if (data != null) {
            final offer = BookingOffer.fromJson(Map<String, dynamic>.from(data));
            _bookingOfferController.add(offer);
          }
        } catch (e) {
          if (kDebugMode) print('[SOCKET_OFFER_PARSE_ERR]: $e');
        }
      });

      // Listen for status changes
      _socket!.on('booking:statusChanged', (data) {
        try {
          if (kDebugMode) print('[SOCKET_STATUS_CHANGED]: $data');
          if (data != null) {
            _statusChangeController.add(Map<String, dynamic>.from(data));
          }
        } catch (e) {
          if (kDebugMode) print('[SOCKET_STATUS_PARSE_ERR]: $e');
        }
      });
    } catch (e) {
      if (kDebugMode) print('[SOCKET_INIT_FAILED] $e');
      _errorController.add('Failed to initialize socket: $e');
    }
  }

  void connectPartner(String partnerId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('partner:connect', {'partnerId': partnerId});
    }
  }

  void sendLocationUpdate(LocationModel location) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('partner:location', {
        'latitude': location.latitude,
        'longitude': location.longitude,
        'speed': location.speed,
        'heading': location.heading,
      });
    }
  }

  void acceptBookingOffer(String bookingId, String partnerId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('booking:accepted', {
        'bookingId': bookingId,
        'partnerId': partnerId,
      });
    }
  }

  void rejectBookingOffer(String bookingId, String partnerId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('booking:rejected', {
        'bookingId': bookingId,
        'partnerId': partnerId,
      });
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
