import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../config/app_config.dart';
import '../models/dispatch_offer.dart';
import '../services/location_service.dart';
import '../services/socket_service.dart';
import 'dispatch_offer_screen.dart';
import 'live_tracking_screen.dart';

class PartnerHomeScreen extends StatefulWidget {
  final String partnerId;
  final String token;
  const PartnerHomeScreen({
    super.key,
    required this.partnerId,
    required this.token,
  });

  @override
  State<PartnerHomeScreen> createState() => _PartnerHomeScreenState();
}

class _PartnerHomeScreenState extends State<PartnerHomeScreen> {
  late SocketService _socketService;
  late LocationService _locationService;
  final MapController _mapController = MapController();

  bool isOnline = false;
  LatLng currentPos = const LatLng(19.0760, 72.8777);
  String? activeBookingId;

  @override
  void initState() {
    super.initState();
    _socketService = SocketService();
    _locationService = LocationService(_socketService);

    _socketService.connect(serverUrl: AppConfig.wsUrl, token: widget.token);

    // Listen for dispatch offers from backend
    _socketService.socket.on('dispatch_offer', (data) {
      if (!isOnline || !mounted) return;
      final offer = DispatchOffer.fromJson(Map<String, dynamic>.from(data));
      _showOfferDialog(offer);
    });
  }

  void _toggleOnline(bool value) {
    setState(() => isOnline = value);
    if (isOnline) {
      _socketService.socket.emit('partner_online', {'partnerId': widget.partnerId});
      _locationService.start();
    } else {
      _socketService.socket.emit('partner_offline', {'partnerId': widget.partnerId});
      _locationService.stop();
    }
  }

  void _showOfferDialog(DispatchOffer offer) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => DispatchOfferScreen(
        offer: offer,
        onAccept: () {
          Navigator.of(ctx).pop();
          _socketService.acceptBooking(offer.bookingId);
          setState(() => activeBookingId = offer.bookingId);
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => LiveTrackingScreen(
                bookingId: offer.bookingId,
                serverUrl: AppConfig.apiBaseUrl,
              ),
            ),
          );
        },
        onReject: () {
          Navigator.of(ctx).pop();
          _socketService.rejectBooking(offer.bookingId);
        },
      ),
    );
  }

  @override
  void dispose() {
    _locationService.stop();
    _socketService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        title: const Text('ORBIT Partner Console'),
        backgroundColor: const Color(0xFF1E293B),
        actions: [
          Switch.adaptive(
            value: isOnline,
            activeColor: const Color(0xFF10B981),
            onChanged: _toggleOnline,
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: Stack(
        children: [
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: currentPos,
              initialZoom: 15,
            ),
            children: [
              TileLayer(
                urlTemplate: AppConfig.osmTileUrl,
                userAgentPackageName: AppConfig.appPackageName,
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: currentPos,
                    width: 48,
                    height: 48,
                    child: Container(
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFF10B981) : const Color(0xFF64748B),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.videocam, color: Colors.white, size: 24),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Online Status Banner
          Positioned(
            bottom: 24,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.5),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        isOnline ? 'ONLINE — READY FOR SHOOTS' : 'OFFLINE',
                        style: TextStyle(
                          color: isOnline ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        isOnline ? 'Streaming GPS to Redis GEO' : 'Switch toggle to receive nearby offers',
                        style: const TextStyle(color: Color(0xFF64748B), fontSize: 11),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () => _toggleOnline(!isOnline),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isOnline ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(isOnline ? 'Go Offline' : 'Go Online'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
