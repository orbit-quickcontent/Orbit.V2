import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  void connect({
    required String serverUrl,
    required String token,
    Function()? onConnect,
    Function(dynamic)? onDisconnect,
    Function(dynamic)? onError,
  }) {
    if (_socket?.connected == true) return;

    _socket = IO.io(
      serverUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(10)
          .setReconnectionDelay(2000)
          .build(),
    );

    _socket?.onConnect((_) {
      print('[SocketService] Connected to dispatch server: $serverUrl');
      onConnect?.call();
    });

    _socket?.onDisconnect((data) {
      print('[SocketService] Disconnected: $data');
      onDisconnect?.call(data);
    });

    _socket?.onConnectError((data) {
      print('[SocketService] Connection error: $data');
      onError?.call(data);
    });

    _socket?.connect();
  }

  /// Send partner GPS location updates (rate-limited and compressed)
  void sendPartnerLocation({
    required double lat,
    required double lng,
    double? speed,
    double? heading,
    String? partnerId,
  }) {
    if (_socket?.connected != true) return;

    _socket?.emit('partner_location', {
      'partnerId': partnerId,
      'lat': lat,
      'lng': lng,
      'speed': speed ?? 0.0,
      'heading': heading ?? 0.0,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  /// Subscribe to room by booking ID
  void joinBooking(String bookingId) {
    if (_socket?.connected != true) return;
    _socket?.emit('join_booking', bookingId);
  }

  /// Track specific partner
  void trackPartner(String partnerId) {
    if (_socket?.connected != true) return;
    _socket?.emit('track_partner', partnerId);
  }

  /// Listen for live partner location updates
  void onPartnerUpdate(Function(dynamic) callback) {
    _socket?.on('partner_location_update', callback);
  }

  /// Remove listener
  void offPartnerUpdate(Function(dynamic) callback) {
    _socket?.off('partner_location_update', callback);
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
