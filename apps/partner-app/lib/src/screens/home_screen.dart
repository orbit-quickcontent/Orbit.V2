import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../models/partner_model.dart';
import '../providers/partner_provider.dart';
import '../widgets/booking_offer_sheet.dart';
import '../widgets/floating_bottom_bar.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(partnerProvider);
    final isOnline = state.status == PartnerStatus.online || state.status == PartnerStatus.busy;
    final displayName = state.name != null && state.name!.isNotEmpty
        ? state.name!
        : (state.email?.split('@')[0] ?? 'Partner');

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
                  ? const Color(0xFF10B981).withValues(alpha: 0.2)
                  : const Color(0xFF64748B).withValues(alpha: 0.2),
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
          // Free OSM map via flutter_map — no API key required
          FlutterMap(
            options: MapOptions(
              initialCenter: LatLng(currentLat, currentLng),
              initialZoom: 15.0,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.orbit.partner_app',
                maxZoom: 19,
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: LatLng(currentLat, currentLng),
                    width: 48,
                    height: 48,
                    child: Container(
                      decoration: BoxDecoration(
                        color: isOnline ? const Color(0xFF6366F1) : const Color(0xFF64748B),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: (isOnline ? const Color(0xFF6366F1) : const Color(0xFF64748B))
                                .withValues(alpha: 0.6),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.videocam, color: Colors.white, size: 22),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // Status / Online toggle card
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
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
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
                    activeThumbColor: const Color(0xFF6366F1),
                    activeTrackColor: const Color(0xFF6366F1).withValues(alpha: 0.4),
                    onChanged: (val) {
                      ref.read(partnerProvider.notifier).toggleOnlineStatus(val);
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: FloatingBottomBar(
        selectedIndex: 0,
        onTabSelected: (index) {},
        userInitials: displayName.split(' ').map((e) => e.isNotEmpty ? e[0] : '').join('').toUpperCase().padRight(2, 'C').substring(0, 2),
      ),
    );
  }
}
