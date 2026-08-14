import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  late IO.Socket socket;
  bool isConnected = false;

  void connect({required String serverUrl, String? token}) {
    final opts = IO.OptionBuilder()
        .setTransports(['websocket'])
        .enableAutoConnect()
        .enableReconnection();

    if (token != null && token.isNotEmpty) {
      opts.setAuth({'token': token});
    }

    socket = IO.io(serverUrl, opts.build());

    socket.onConnect((_) {
      isConnected = true;
      print('SocketService: Connected to $serverUrl');
    });

    socket.onDisconnect((_) {
      isConnected = false;
      print('SocketService: Disconnected');
    });

    socket.connect();
  }

  void sendPartnerLocation(double lat, double lng, {String? bookingId, double? speed, double? heading, double? accuracy}) {
    socket.emit('partner_location', {
      'lat': lat,
      'lng': lng,
      if (speed != null) 'speed': speed,
      if (heading != null) 'heading': heading,
      if (accuracy != null) 'accuracy': accuracy,
      if (bookingId != null) 'bookingId': bookingId,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void joinBooking(String bookingId) {
    socket.emit('join_booking', {'bookingId': bookingId});
  }

  void leaveBooking(String bookingId) {
    socket.emit('leave_booking', {'bookingId': bookingId});
  }

  void acceptBooking(String bookingId, {String? partnerName}) {
    socket.emit('partner_accept_booking', {
      'bookingId': bookingId,
      'partnerName': partnerName ?? 'Assigned Partner',
    });
  }

  void rejectBooking(String bookingId) {
    socket.emit('partner_reject_booking', {'bookingId': bookingId});
  }

  void partnerArrived(String bookingId) {
    socket.emit('partner_arrived', {'bookingId': bookingId});
  }

  void onPartnerUpdate(Function(dynamic) callback) {
    socket.on('partner_location_update', callback);
    socket.on('location_update', callback);
  }

  void onDispatchOffer(Function(dynamic) callback) {
    socket.on('dispatch_offer', callback);
  }

  void onPartnerAssigned(Function(dynamic) callback) {
    socket.on('partner_assigned', callback);
  }

  void onBookingStatus(Function(dynamic) callback) {
    socket.on('booking_status_update', callback);
  }

  void dispose() {
    socket.disconnect();
    socket.dispose();
  }
}
