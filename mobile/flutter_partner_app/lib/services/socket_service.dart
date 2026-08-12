import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../models/booking.dart';

enum SocketConnectionState { disconnected, connecting, connected, error }

class SocketService extends ChangeNotifier {
  io.Socket? _socket;
  SocketConnectionState _connectionState = SocketConnectionState.disconnected;
  BookingOffer? _activeOffer;

  SocketConnectionState get connectionState => _connectionState;
  BookingOffer? get activeOffer => _activeOffer;
  bool get isConnected => _connectionState == SocketConnectionState.connected;

  void connect(String baseUrl, String token) {
    if (_socket != null && _socket!.connected) return;

    _connectionState = SocketConnectionState.connecting;
    notifyListeners();

    _socket = io.io(
      baseUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('[SocketService] Connected successfully');
      _connectionState = SocketConnectionState.connected;
      notifyListeners();
    });

    _socket!.onDisconnect((_) {
      debugPrint('[SocketService] Disconnected');
      _connectionState = SocketConnectionState.disconnected;
      notifyListeners();
    });

    _socket!.onConnectError((err) {
      debugPrint('[SocketService] Connection Error: $err');
      _connectionState = SocketConnectionState.error;
      notifyListeners();
    });

    // Listen for incoming booking offer
    _socket!.on('new_booking_request', (data) {
      debugPrint('[SocketService] New Booking Offer Received: $data');
      if (data is Map<String, dynamic>) {
        _activeOffer = BookingOffer.fromJson(data);
        notifyListeners();
      }
    });

    // Listen for offer cancelled
    _socket!.on('booking_offer_cancelled', (data) {
      debugPrint('[SocketService] Booking Offer Cancelled');
      _activeOffer = null;
      notifyListeners();
    });

    // Listen for timeout
    _socket!.on('booking_timeout', (data) {
      debugPrint('[SocketService] Booking Offer Timed Out');
      _activeOffer = null;
      notifyListeners();
    });

    _socket!.connect();
  }

  void goOnline() {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('partner_online');
      debugPrint('[SocketService] Emitted partner_online');
    }
  }

  void goOffline() {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('partner_offline');
      debugPrint('[SocketService] Emitted partner_offline');
    }
  }

  void sendLocation(double lat, double lng, {double speed = 0, double heading = 0}) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('partner_location', {
        'lat': lat,
        'lng': lng,
        'speed': speed,
        'heading': heading,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      });
    }
  }

  void respondToOffer(String bookingId, bool accept) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('booking_response', {
        'bookingId': bookingId,
        'accepted': accept,
      });
    }
    _activeOffer = null;
    notifyListeners();
  }

  void clearActiveOffer() {
    _activeOffer = null;
    notifyListeners();
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _connectionState = SocketConnectionState.disconnected;
    _activeOffer = null;
    notifyListeners();
  }
}

final socketServiceProvider = ChangeNotifierProvider<SocketService>((ref) {
  return SocketService();
});
