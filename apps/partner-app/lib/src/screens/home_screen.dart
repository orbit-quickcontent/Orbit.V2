import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../models/partner_model.dart';
import '../providers/partner_provider.dart';
import '../widgets/booking_offer_sheet.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(partnerProvider);
    final isOnline = state.status == PartnerStatus.online || state.status == PartnerStatus.busy;

    // Show booking offer modal when active offer arrives
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (state.activeOffer != null) {
        showModalBottomSheet(
          context: context,
          isDismissible: false,
          enableDrag: false,
          backgroundColor: Colors.transparent,
          builder: (ctx) => BookingOfferSheet(offer: state.activeOffer!),
        );
      }
    });

    final currentLat = state.currentLocation?.latitude ?? 19.0760;
    final currentLng = state.currentLocation?.longitude ?? 72.8777;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.radar_rounded, color: Color(0xFF6366F1)),
            const SizedBox(width: 8),
            const Text(
              'ORBIT Partner GPS',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: isOnline
                  ? const Color(0xFF10B981).withOpacity(0.2)
                  : const Color(0xFF64748B).withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isOnline ? const Color(0xFF10B981) : const Color(0xFF64748B),
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 4,
                  backgroundColor:
                      isOnline ? const Color(0xFF10B981) : const Color(0xFF64748B),
                ),
                const SizedBox(width: 6),
                Text(
                  isOnline ? 'ONLINE' : 'OFFLINE',
                  style: TextStyle(
                    color: isOnline ? const Color(0xFF10B981) : const Color(0xFF64748B),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Google Map live view with error handling fallback
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: LatLng(currentLat, currentLng),
              zoom: 15.0,
            ),
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            markers: {
              Marker(
                markerId: const MarkerId('current_partner_pos'),
                position: LatLng(currentLat, currentLng),
                infoWindow: InfoWindow(
                  title: state.email ?? 'Your Location',
                  snippet: 'Status: ${state.status.toShortString()}',
                ),
                icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet),
              ),
            },
          ),

          // Floating Online Toggle & Location Telemetry Control
          Positioned(
            bottom: 32,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.4),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            isOnline ? 'Broadcasting Location' : 'You are Offline',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isOnline
                                ? 'GPS ping every 5s • Redis GEO active'
                                : 'Tap switch to go online for bookings',
                            style: const TextStyle(
                              color: Color(0xFF94A3B8),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      Switch(
                        value: isOnline,
                        activeColor: const Color(0xFF6366F1),
                        onChanged: (val) {
                          ref.read(partnerProvider.notifier).toggleOnlineStatus(val);
                        },
                      ),
                    ],
                  ),
                  if (state.currentLocation != null) ...[
                    const Divider(color: Color(0xFF334155), height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Lat: ${state.currentLocation!.latitude.toStringAsFixed(4)}',
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                        ),
                        Text(
                          'Lng: ${state.currentLocation!.longitude.toStringAsFixed(4)}',
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                        ),
                        Text(
                          'Speed: ${state.currentLocation!.speed.toStringAsFixed(1)} km/h',
                          style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
