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
    final displayName = state.name != null && state.name!.isNotEmpty
        ? state.name!
        : (state.email?.split('@')[0] ?? 'Partner');

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
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const Icon(Icons.radar_rounded, color: Color(0xFF6366F1), size: 20),
                const SizedBox(width: 6),
                Text(
                  displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            if (state.phone != null && state.phone!.isNotEmpty)
              Text(
                state.phone!,
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
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
                  title: displayName,
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
                            displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isOnline
                                ? 'Broadcasting Location (5s Interval)'
                                : 'You are currently offline',
                            style: TextStyle(
                              color: isOnline ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
                              fontSize: 12,
                            ),
                          ),
                          if (state.address != null && state.address!.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              '📍 ${state.address!}',
                              style: const TextStyle(
                                color: Color(0xFFCBD5E1),
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ],
                      ),
                      Switch.adaptive(
                        value: isOnline,
                        activeColor: const Color(0xFF6366F1),
                        activeTrackColor: const Color(0xFF6366F1).withOpacity(0.4),
                        onChanged: (val) {
                          ref.read(partnerProvider.notifier).toggleOnlineStatus(val);
                        },
                      ),
                    ],
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
