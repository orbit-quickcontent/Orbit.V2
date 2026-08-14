import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  late IO.Socket socket;

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
      print('SocketService: Connected to $serverUrl');
    });

    socket.onDisconnect((_) {
      print('SocketService: Disconnected');
    });

    socket.connect();
  }

  void sendPartnerLocation(double lat, double lng, {String? bookingId}) {
    socket.emit('partner_location', {
      'lat': lat,
      'lng': lng,
      if (bookingId != null) 'bookingId': bookingId,
    });
  }

  void joinBooking(String bookingId) {
    socket.emit('join_booking', {'bookingId': bookingId});
  }

  void onPartnerUpdate(Function(dynamic) callback) {
    socket.on('partner_location_update', callback);
    socket.on('location_update', callback);
  }

  void dispose() {
    socket.disconnect();
    socket.dispose();
  }
}
