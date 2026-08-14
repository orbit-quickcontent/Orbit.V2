import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import '../services/socket_service.dart';

class LiveTrackingScreen extends StatefulWidget {
  final String? bookingId;
  final String? serverUrl;
  const LiveTrackingScreen({
    super.key,
    this.bookingId,
    this.serverUrl,
  });

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> {
  late SocketService _socketService;
  final MapController _mapController = MapController();

  LatLng partner = const LatLng(19.0760, 72.8777); // Default Mumbai
  LatLng clientLocation = const LatLng(19.0820, 72.8890);
  List<LatLng> routePoints = [];

  String etaMinutes = 'Calculating...';
  String distanceKm = 'Calculating...';
  bool isConnected = false;

  @override
  void initState() {
    super.initState();
    _socketService = SocketService();
    _connectAndTrack();
    _fetchRoute();
  }

  void _connectAndTrack() {
    final baseUrl = widget.serverUrl ?? 'http://10.0.2.2:5000';
    _socketService.connect(serverUrl: baseUrl);
    setState(() => isConnected = true);

    if (widget.bookingId != null) {
      _socketService.joinBooking(widget.bookingId!);
    }

    _socketService.onPartnerUpdate((data) {
      if (!mounted) return;
      final map = data is Map ? data : jsonDecode(data.toString());
      final lat = double.tryParse(map['lat']?.toString() ?? '');
      final lng = double.tryParse(map['lng']?.toString() ?? '');
      if (lat != null && lng != null) {
        setState(() {
          partner = LatLng(lat, lng);
        });
        _mapController.move(partner, _mapController.camera.zoom);
        _fetchRoute();
      }
    });
  }

  Future<void> _fetchRoute() async {
    try {
      final baseUrl = widget.serverUrl ?? 'http://10.0.2.2:5000';
      final url = Uri.parse(
        '$baseUrl/route?fromLat=${partner.latitude}&fromLng=${partner.longitude}&toLat=${clientLocation.latitude}&toLng=${clientLocation.longitude}',
      );
      final res = await http.get(url).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final coords = data['geometry']?['coordinates'] as List?;
        if (coords != null) {
          final pts = coords.map((c) => LatLng(c[1].toDouble(), c[0].toDouble())).toList();
          setState(() {
            routePoints = pts;
            etaMinutes = '${data['estimatedMinutes'] ?? 5} min';
            distanceKm = '${((data['distanceMeters'] ?? 1000) / 1000).toStringAsFixed(1)} km';
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _socketService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.bookingId != null ? 'Tracking #${widget.bookingId}' : 'ORBIT Live Tracking'),
        backgroundColor: const Color(0xFF0F172A),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: isConnected ? Colors.green.withValues(alpha: 0.2) : Colors.red.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isConnected ? Colors.green : Colors.red),
            ),
            child: Row(
              children: [
                CircleAvatar(radius: 3, backgroundColor: isConnected ? Colors.green : Colors.red),
                const SizedBox(width: 4),
                Text(isConnected ? 'LIVE' : 'OFFLINE', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // ── Free OSM Map ──────────────────────────────────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: partner,
              initialZoom: 15,
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.orbit.app',
                maxZoom: 19,
              ),
              if (routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: routePoints,
                      strokeWidth: 4.5,
                      color: const Color(0xFF6366F1),
                    ),
                  ],
                ),
              MarkerLayer(
                markers: [
                  // Client Location Marker
                  Marker(
                    point: clientLocation,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.person_pin_circle, color: Colors.white, size: 24),
                    ),
                  ),
                  // Moving Partner Location Marker
                  Marker(
                    point: partner,
                    width: 50,
                    height: 50,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6366F1).withValues(alpha: 0.5),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.videocam, color: Colors.white, size: 24),
                    ),
                  ),
                ],
              ),
            ],
          ),

          // ── ETA & Distance Info Card ──────────────────────────────────────
          Positioned(
            bottom: 24,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('ETA', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(etaMinutes, style: const TextStyle(color: Color(0xFF6366F1), fontSize: 22, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  Container(height: 30, width: 1, color: Colors.white12),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('DISTANCE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(distanceKm, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  Container(height: 30, width: 1, color: Colors.white12),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('CREATOR', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      const Text('En Route', style: TextStyle(color: Color(0xFF10B981), fontSize: 14, fontWeight: FontWeight.bold)),
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
