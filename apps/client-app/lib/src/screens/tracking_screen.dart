import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:url_launcher/url_launcher.dart';
import '../api/orbit_api.dart';
import '../state/session.dart';

class TrackingScreen extends ConsumerStatefulWidget {
  const TrackingScreen({super.key});
  @override
  ConsumerState<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends ConsumerState<TrackingScreen> {
  String? bookingId;
  Map<String, dynamic>? tracking;
  io.Socket? socket;
  String status = 'PENDING';
  String? reelUrl;
  bool loading = true;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (bookingId == null) {
      final args = ModalRoute.of(context)?.settings.arguments;
      if (args != null) { bookingId = args.toString(); _load(); }
    }
  }

  Future<void> _load() async {
    try {
      final api = ref.read(orbitApiProvider);
      final response = await api.tracking(bookingId!);
      final data = Map<String, dynamic>.from((response['tracking'] ?? response) as Map);
      if (mounted) setState(() {
        tracking = data;
        status = data['status']?.toString() ?? 'PENDING';
        reelUrl = data['masterReelUrl']?.toString() ?? data['reelUrl']?.toString();
        loading = false;
      });
      _connect();
    } catch (_) { if (mounted) setState(() => loading = false); }
  }

  void _connect() {
    final token = ref.read(sessionProvider).token;
    if (token == null || bookingId == null) return;
    final wsUrl = const String.fromEnvironment('ORBIT_WS_URL', defaultValue: 'http://10.0.2.2:5000');
    socket = io.io(wsUrl, io.OptionBuilder().setTransports(['websocket']).setAuth({'token': token}).enableAutoConnect().enableReconnection().build());
    socket!.onConnect((_) => socket!.emit('client:subscribe', {'bookingId': bookingId}));
    socket!.on('booking:statusChanged', (data) => _applyEvent(data));
    socket!.on('booking:payment-confirmed', (data) => _applyEvent(data));
  }

  void _applyEvent(dynamic data) {
    if (!mounted) return;
    final map = data is Map ? Map<String, dynamic>.from(data) : jsonDecode(data.toString()) as Map<String, dynamic>;
    final eventBookingId = map['bookingId']?.toString() ?? map['data']?['bookingId']?.toString();
    if (eventBookingId != null && eventBookingId != bookingId) return;
    final next = map['status']?.toString() ?? map['data']?['status']?.toString();
    if (next != null) setState(() => status = next == 'PARTNER_DISPATCHED' ? 'DISPATCHED' : next);
    if (map['reelUrl'] != null) setState(() => reelUrl = map['reelUrl'].toString());
  }

  Future<void> _openReel() async {
    final url = reelUrl;
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  void dispose() { socket?.disconnect(); socket?.dispose(); super.dispose(); }

  Color _statusColor() {
    if (status == 'DELIVERED') return const Color(0xFF35D07F);
    if (status == 'CANCELLED') return Colors.redAccent;
    return const Color(0xFF7C5CFF);
  }

  @override
  Widget build(BuildContext context) {
    final steps = ['PENDING', 'PAID', 'DISPATCHED', 'EN_ROUTE', 'SHOOTING', 'SYNCING', 'EDITING', 'DELIVERED'];
    final currentIndex = steps.indexOf(status);
    final shortId = (bookingId ?? '').length > 8 ? bookingId!.substring(0, 8) : (bookingId ?? '');
    return Scaffold(
      appBar: AppBar(title: Text('Booking $shortId')),
      body: loading ? const Center(child: CircularProgressIndicator()) : ListView(padding: const EdgeInsets.all(20), children: [
        Container(padding: const EdgeInsets.all(22), decoration: BoxDecoration(color: _statusColor().withValues(alpha: .12), borderRadius: BorderRadius.circular(24), border: Border.all(color: _statusColor().withValues(alpha: .35))), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(status.replaceAll('_', ' '), style: TextStyle(color: _statusColor(), fontSize: 13, fontWeight: FontWeight.w800, letterSpacing: 1.1)),
          const SizedBox(height: 8),
          Text(status == 'DELIVERED' ? 'Your reel is ready.' : 'We are moving your reel through the ORBIT pipeline.', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          if (tracking?['estimatedMinutesRemaining'] != null) ...[
            const SizedBox(height: 8),
            Text('Estimated remaining: ${tracking!['estimatedMinutesRemaining']} min', style: const TextStyle(color: Colors.white70)),
          ],
        ])),
        const SizedBox(height: 18),
        ...List.generate(steps.length, (i) {
          final done = currentIndex >= i;
          return ListTile(leading: CircleAvatar(backgroundColor: done ? _statusColor() : Colors.white12, child: done ? const Icon(Icons.check, size: 17) : Text('${i + 1}')), title: Text(steps[i].replaceAll('_', ' ')), dense: true);
        }),
        if (reelUrl != null && reelUrl!.isNotEmpty) ...[
          const SizedBox(height: 18),
          FilledButton.icon(onPressed: _openReel, icon: const Icon(Icons.play_arrow), label: const Text('Open / download final reel')),
          const SizedBox(height: 8),
          SelectableText(reelUrl!, style: const TextStyle(color: Colors.white60, fontSize: 11)),
        ],
      ]),
    );
  }
}
