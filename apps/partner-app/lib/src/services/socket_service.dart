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
  String? _partnerId;
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

  static String get defaultSocketUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:5000';
    }
    return 'http://localhost:5000';
  }

  void init({String? baseUrl, String? authToken}) {
    final targetUrl = baseUrl ?? defaultSocketUrl;

    _socket?.disconnect();
    _socket?.dispose();

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
        if (_partnerId != null) {
          _socket!.emit('partner:online', {'partnerId': _partnerId});
        }
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

      _socket!.on('booking:offer', (data) {
        try {
          if (data != null) {
            final offer = BookingOffer.fromJson(Map<String, dynamic>.from(data));
            _bookingOfferController.add(offer);
          }
        } catch (e) {
          if (kDebugMode) print('[SOCKET_OFFER_PARSE_ERR]: $e');
        }
      });

      _socket!.on('booking:statusChanged', (data) {
        try {
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
    _partnerId = partnerId;
    if (_socket != null && _socket!.connected) {
      _socket!.emit('partner:online', {'partnerId': partnerId});
    }
  }

  void sendLocationUpdate(LocationModel location) {
    if (_socket != null && _socket!.connected && _partnerId != null) {
      _socket!.emit('partner:updateLocation', {
        'partnerId': _partnerId,
        'lat': location.latitude,
        'lng': location.longitude,
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
    if (_socket != null && _socket!.connected && _partnerId != null) {
      _socket!.emit('partner:offline', {'partnerId': _partnerId});
    }
    _socket?.disconnect();
    _socket = null;
    _partnerId = null;
  }
}
