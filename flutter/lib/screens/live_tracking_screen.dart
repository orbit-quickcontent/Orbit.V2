import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import '../services/socket_service.dart';

class LiveTrackingScreen extends StatefulWidget {
  final String serverUrl;
  final String authToken;
  final String? bookingId;
  final LatLng clientLocation;

  const LiveTrackingScreen({
    super.key,
    this.serverUrl = 'http://10.0.2.2:5000', // Default Android emulator host
    this.authToken = 'orbit_demo_token',
    this.bookingId,
    this.clientLocation = const LatLng(18.9582, 72.8171), // Mumbai default
  });

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> {
  final MapController _mapController = MapController();
  final SocketService _socketService = SocketService();

  LatLng? _partnerLocation;
  List<LatLng> _routePoints = [];
  int? _etaMinutes;
  double? _distanceKm;
  bool _isLoadingNearby = false;
  List<Map<String, dynamic>> _nearbyPartners = [];
  String? _selectedPartnerId;

  @override
  void initState() {
    super.initState();
    _initializeTracking();
  }

  void _initializeTracking() {
    // 1. Connect Socket.IO
    _socketService.connect(
      serverUrl: widget.serverUrl,
      token: widget.authToken,
      onConnect: () {
        if (widget.bookingId != null) {
          _socketService.joinBooking(widget.bookingId!);
        }
      },
    );

    // 2. Listen to real-time partner location events
    _socketService.onPartnerUpdate((data) {
      if (!mounted || data == null) return;

      final dynamic latRaw = data['lat'];
      final dynamic lngRaw = data['lng'];
      final String? pid = data['partnerId'];

      if (latRaw != null && lngRaw != null) {
        final double lat = (latRaw as num).toDouble();
        final double lng = (lngRaw as num).toDouble();

        setState(() {
          _partnerLocation = LatLng(lat, lng);
        });

        // Recalculate route whenever partner moves significantly
        _fetchRoute(from: LatLng(lat, lng), to: widget.clientLocation);
      }
    });

    // 3. Scan nearby partners on load
    _fetchNearbyPartners();
  }

  /// REST: GET /partners/nearby?lat=&lng=&radius=
  Future<void> _fetchNearbyPartners() async {
    setState(() => _isLoadingNearby = true);
    try {
      final url = Uri.parse(
        '${widget.serverUrl}/partners/nearby?lat=${widget.clientLocation.latitude}&lng=${widget.clientLocation.longitude}&radius=10',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        setState(() {
          _nearbyPartners = data.cast<Map<String, dynamic>>();
          if (_nearbyPartners.isNotEmpty && _partnerLocation == null) {
            final first = _nearbyPartners.first;
            if (first['lat'] != null && first['lng'] != null) {
              _partnerLocation = LatLng(
                (first['lat'] as num).toDouble(),
                (first['lng'] as num).toDouble(),
              );
              _selectedPartnerId = first['partnerId'];
              _fetchRoute(from: _partnerLocation!, to: widget.clientLocation);
            }
          }
        });
      }
    } catch (e) {
      print('[LiveTrackingScreen] Fetch nearby error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingNearby = false);
    }
  }

  /// REST: GET /route?fromLat=&fromLng=&toLat=&toLng=
  Future<void> _fetchRoute({required LatLng from, required LatLng to}) async {
    try {
      final url = Uri.parse(
        '${widget.serverUrl}/route?fromLat=${from.latitude}&fromLng=${from.longitude}&toLat=${to.latitude}&toLng=${to.longitude}',
      );
      final response = await http.get(url).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final dynamic geometry = data['geometry'];

        List<LatLng> points = [];
        if (geometry != null && geometry['coordinates'] != null) {
          final List<dynamic> coords = geometry['coordinates'];
          points = coords.map<LatLng>((c) {
            return LatLng((c[1] as num).toDouble(), (c[0] as num).toDouble());
          }).toList();
        }

        if (mounted) {
          setState(() {
            _routePoints = points;
            _etaMinutes = data['etaMinutes'];
            _distanceKm = (data['distanceKm'] as num?)?.toDouble();
          });
        }
      }
    } catch (e) {
      print('[LiveTrackingScreen] Fetch route error: $e');
    }
  }

  @override
  void dispose() {
    _socketService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF05060A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D0F17),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF00F0FF).withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text('⚡', style: TextStyle(fontSize: 16)),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ORBIT LIVE TRACKING',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.5,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'Open-Source Real-time Dispatch',
                  style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: _isLoadingNearby
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF00F0FF)),
                  )
                : const Icon(Icons.refresh, color: Color(0xFF00F0FF)),
            onPressed: _fetchNearbyPartners,
          ),
        ],
      ),
      body: Stack(
        children: [
          // ── Map View (Free OSM Tiles + flutter_map) ──────────────────────
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: widget.clientLocation,
              initialZoom: 14.5,
              maxZoom: 18.0,
              minZoom: 4.0,
            ),
            children: [
              // Free OpenStreetMap Tile Layer
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.orbitlogic.app',
                maxZoom: 19,
              ),

              // OSRM Route Polyline
              if (_routePoints.isNotEmpty)
                PolylineLayer(
                  polylines: [
                    Polyline(
                      points: _routePoints,
                      strokeWidth: 5.0,
                      color: const Color(0xFF00F0FF),
                    ),
                  ],
                ),

              // Marker Layer
              MarkerLayer(
                markers: [
                  // 1. Client Destination Marker (Blue Glow)
                  Marker(
                    point: widget.clientLocation,
                    width: 44,
                    height: 44,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF00F0FF),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2.5),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF00F0FF).withOpacity(0.6),
                            blurRadius: 10,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.location_on, color: Colors.black, size: 24),
                    ),
                  ),

                  // 2. Partner Live Moving Marker (Purple / Animated)
                  if (_partnerLocation != null)
                    Marker(
                      point: _partnerLocation!,
                      width: 50,
                      height: 50,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFA855F7),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2.5),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFA855F7).withOpacity(0.7),
                              blurRadius: 12,
                              spreadRadius: 3,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.videocam, color: Colors.white, size: 26),
                      ),
                    ),

                  // 3. Other Nearby Online Partners
                  ..._nearbyPartners
                      .where((p) =>
                          p['lat'] != null &&
                          p['lng'] != null &&
                          p['partnerId'] != _selectedPartnerId)
                      .map(
                        (p) => Marker(
                          point: LatLng(
                            (p['lat'] as num).toDouble(),
                            (p['lng'] as num).toDouble(),
                          ),
                          width: 36,
                          height: 36,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _selectedPartnerId = p['partnerId'];
                                _partnerLocation = LatLng(
                                  (p['lat'] as num).toDouble(),
                                  (p['lng'] as num).toDouble(),
                                );
                              });
                              _fetchRoute(
                                from: _partnerLocation!,
                                to: widget.clientLocation,
                              );
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: const Color(0xFF1E293B),
                                shape: BoxShape.circle,
                                border: Border.all(color: const Color(0xFF00F0FF), width: 1.5),
                              ),
                              child: const Icon(Icons.camera_alt, color: Color(0xFF00F0FF), size: 18),
                            ),
                          ),
                        ),
                      ),
                ],
              ),
            ],
          ),

          // ── Top ETA & Distance Floating Card ─────────────────────────────
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF0D0F17).withOpacity(0.92),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF1E2132)),
                boxShadow: const [
                  BoxShadow(color: Colors.black54, blurRadius: 12, offset: Offset(0, 4)),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00F0FF).withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.schedule, color: Color(0xFF00F0FF), size: 20),
                      ),
                      const SizedBox(width: 10),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ESTIMATED ARRIVAL',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF94A3B8),
                              letterSpacing: 1,
                            ),
                          ),
                          Text(
                            _etaMinutes != null ? '$_etaMinutes mins' : 'Calculating...',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E293B),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF334155)),
                    ),
                    child: Text(
                      _distanceKm != null ? '${_distanceKm!.toStringAsFixed(1)} km away' : 'Nearby',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF00F0FF),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Bottom Sheet: Partner Dispatch Info ──────────────────────────
          Positioned(
            bottom: 24,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0D0F17),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFF1E2132)),
                boxShadow: const [
                  BoxShadow(color: Colors.black80, blurRadius: 20, offset: Offset(0, 8)),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFA855F7).withOpacity(0.2),
                          border: Border.all(color: const Color(0xFFA855F7)),
                        ),
                        child: const Center(
                          child: Text('🎬', style: TextStyle(fontSize: 22)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _selectedPartnerId != null
                                  ? 'Visual Architect #${_selectedPartnerId!.take(8)}'
                                  : 'Visual Architect En Route',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                            const Row(
                              children: [
                                Icon(Icons.star, color: Color(0xFFFBBF24), size: 14),
                                SizedBox(width: 4),
                                Text(
                                  '4.9 (120+ shoots) • Top Creator',
                                  style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF22C55E).withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.circle, color: Color(0xFF22C55E), size: 8),
                            SizedBox(width: 4),
                            Text(
                              'LIVE',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF22C55E),
                              ),
                            ),
                          ],
                        ),
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

extension StringExtension on String {
  String take(int n) => length <= n ? this : substring(0, n);
}
