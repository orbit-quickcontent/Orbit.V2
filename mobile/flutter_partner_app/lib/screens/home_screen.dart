import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/socket_service.dart';
import '../services/location_service.dart';
import '../widgets/booking_popup.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  bool _isOnline = false;

  @override
  void initState() {
    super.initState();
    // Connect socket on initial screen load with test token
    WidgetsBinding.of(context).addPostFrameCallback((_) {
      final socketService = ref.read(socketServiceProvider);
      // Demo JWT Token or host URL setup
      const serverUrl = 'http://10.0.2.2:5000'; // Android emulator localhost alias
      const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InBhcnRuZXJfMTAxIiwibmFtZSI6IkFsaSBQYXJ0bmVyIiwicm9sZSI6IlBBUlRORVIiLCJlbWFpbCI6InBhcnRuZXJAb3JiaXQuY29tIn0.placeholder';
      socketService.connect(serverUrl, demoToken);
    });
  }

  void _toggleOnlineState(bool value) async {
    final socketService = ref.read(socketServiceProvider);
    final locationService = ref.read(locationServiceProvider);

    setState(() {
      _isOnline = value;
    });

    if (_isOnline) {
      socketService.goOnline();
      await locationService.startTracking(socketService);
    } else {
      socketService.goOffline();
      locationService.stopTracking();
    }
  }

  void _showBookingModal(BuildContext context, SocketService socketService) {
    final offer = socketService.activeOffer;
    if (offer == null) return;

    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => BookingPopup(
        offer: offer,
        onAccept: () {
          socketService.respondToOffer(offer.bookingId, true);
          Navigator.of(ctx).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎉 Booking Accepted! Navigating to Client...'),
              backgroundColor: Color(0xFF00E676),
            ),
          );
        },
        onReject: () {
          socketService.respondToOffer(offer.bookingId, false);
          Navigator.of(ctx).pop();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final socketService = ref.watch(socketServiceProvider);
    final locationService = ref.watch(locationServiceProvider);

    // Listen for incoming booking offer and trigger popup modal
    ref.listen<SocketService>(socketServiceProvider, (previous, next) {
      if (next.activeOffer != null && (previous == null || previous.activeOffer != next.activeOffer)) {
        _showBookingModal(context, next);
      }
    });

    final currentPos = locationService.lastPosition;

    return Scaffold(
      backgroundColor: const Color(0xFF12121A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E1E2C),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF00E676).withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.videocam, color: Color(0xFF00E676), size: 20),
            ),
            const SizedBox(width: 10),
            const Text(
              'ORBIT PARTNER',
              style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1.5, fontSize: 16),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            child: Chip(
              backgroundColor: socketService.isConnected ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
              avatar: CircleAvatar(
                backgroundColor: socketService.isConnected ? Colors.green : Colors.red,
                radius: 4,
              ),
              label: Text(
                socketService.isConnected ? 'SOCKET CONNECTED' : 'DISCONNECTED',
                style: TextStyle(
                  color: socketService.isConnected ? Colors.greenAccent : Colors.redAccent,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Status Card
            Card(
              color: const Color(0xFF1E1E2C),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  children: [
                    Text(
                      _isOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: _isOnline ? const Color(0xFF00E676) : Colors.redAccent,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _isOnline
                          ? 'Listening for nearby videographer reel shoot requests...'
                          : 'Toggle switch below to start receiving shoot offers.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white54, fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    Transform.scale(
                      scale: 1.3,
                      child: Switch(
                        value: _isOnline,
                        activeColor: const Color(0xFF00E676),
                        activeTrackColor: const Color(0xFF00E676).withOpacity(0.3),
                        inactiveThumbColor: Colors.redAccent,
                        inactiveTrackColor: Colors.redAccent.withOpacity(0.3),
                        onChanged: _toggleOnlineState,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Live Location Info Card
            Card(
              color: const Color(0xFF1E1E2C),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'LIVE GPS TELEMETRY',
                          style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                        Icon(
                          locationService.isTracking ? Icons.gps_fixed : Icons.gps_off,
                          color: locationService.isTracking ? Colors.cyanAccent : Colors.white24,
                          size: 18,
                        ),
                      ],
                    ),
                    const Divider(color: Colors.white10, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Latitude:', style: TextStyle(color: Colors.white54)),
                        Text(
                          currentPos != null ? currentPos.latitude.toStringAsFixed(6) : '--',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Longitude:', style: TextStyle(color: Colors.white54)),
                        Text(
                          currentPos != null ? currentPos.longitude.toStringAsFixed(6) : '--',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('GPS Update Interval:', style: TextStyle(color: Colors.white54)),
                        const Text('Every 5 seconds', style: TextStyle(color: Color(0xFF00E676))),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const Spacer(),

            // Simulated Request Trigger Button for Testing
            ElevatedButton.icon(
              onPressed: _isOnline
                  ? () {
                      // Trigger test offer
                      socketService.respondToOffer('demo_booking_123', false);
                    }
                  : null,
              icon: const Icon(Icons.thunderstorm, size: 20),
              label: const Text('READY FOR DISPATCH'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2A2A3D),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
