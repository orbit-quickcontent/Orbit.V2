import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../api/orbit_api.dart';
import '../state/session.dart';

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key});
  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  late final Razorpay _razorpay;
  Map<String, dynamic>? package;
  Map<String, dynamic>? booking;
  double? lat;
  double? lng;
  bool busy = false;
  String location = 'Detecting your location…';
  final notes = TextEditingController();

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
    final p = ModalRoute.of(context)?.settings.arguments;
    if (p is Map) package = Map<String, dynamic>.from(p);
    _locate();
  }

  @override
  void dispose() { _razorpay.clear(); notes.dispose(); super.dispose(); }

  Future<void> _locate() async {
    try {
      if (!await Geolocator.isLocationServiceEnabled()) { setState(() => location = 'Location services are off'); return; }
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) { setState(() => location = 'Location permission required'); return; }
      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 10)));
      setState(() { lat = pos.latitude; lng = pos.longitude; location = 'Current location ready'; });
    } catch (_) { setState(() => location = 'Location unavailable'); }
  }

  Future<void> _start() async {
    if (package == null || lat == null || lng == null) return;
    setState(() => busy = true);
    try {
      final api = ref.read(orbitApiProvider);
      final created = await api.createBooking(
        packageId: package!['id'].toString(),
        bookingDate: DateTime.now().toIso8601String(),
        timeSlot: 'ASAP',
        location: location,
        lat: lat!,
        lng: lng!,
        notes: notes.text.trim().isEmpty ? null : notes.text.trim(),
      );
      booking = Map<String, dynamic>.from(created['booking'] as Map);
      final order = await api.createPaymentOrder(amount: (package!['price'] as num?)?.toDouble() ?? 0, bookingId: booking!['id'].toString());
      final session = ref.read(sessionProvider);
      final options = {
        'key': order['keyId'],
        'order_id': order['orderId'],
        'amount': order['amount'],
        'currency': order['currency'] ?? 'INR',
        'name': 'ORBIT QuickContent',
        'description': package!['name'] ?? 'ORBIT Reel',
        'prefill': {'email': session.email ?? '', 'contact': ''},
        'theme': {'color': '#7C5CFF'},
      };
      _razorpay.open(options);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))));
    } finally { if (mounted) setState(() => busy = false); }
  }

  void _onPaymentSuccess(PaymentSuccessResponse response) {
    if (!mounted) return;
    Navigator.pushNamedAndRemoveUntil(context, '/tracking', (route) => route.settings.name == '/home' || route.isFirst, arguments: booking?['id']);
  }
  void _onPaymentError(PaymentFailureResponse response) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment failed: ${response.message ?? 'Please try again'}')));
  }
  void _onExternalWallet(ExternalWalletResponse response) {}

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book a reel')),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        if (package == null) ...[
          const Text('Choose a package from Home first.', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ] else ...[
          Container(padding: const EdgeInsets.all(20), decoration: BoxDecoration(color: Colors.white.withValues(alpha: .05), borderRadius: BorderRadius.circular(24)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(package!['name']?.toString() ?? 'ORBIT Reel', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800)),
            const SizedBox(height: 8), Text('₹${package!['price'] ?? '—'} • ${package!['deliveryTime'] ?? 'Fast delivery'}', style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 18), Text(location, style: const TextStyle(color: Colors.white70)),
            const SizedBox(height: 12),
            TextField(controller: notes, maxLines: 4, decoration: const InputDecoration(labelText: 'Shoot notes / creative brief', hintText: 'Tell the partner what you want to capture…')),
          ])),
          const SizedBox(height: 18),
          FilledButton(onPressed: busy ? null : _start, child: Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: Text(busy ? 'Preparing secure checkout…' : 'Pay securely with Razorpay'))),
          const SizedBox(height: 10),
          const Text('Your booking remains PENDING until Razorpay confirms payment. Partner dispatch begins only after verified payment.', style: TextStyle(color: Colors.white54, fontSize: 12)),
        ],
      ]),
    );
  }
}
