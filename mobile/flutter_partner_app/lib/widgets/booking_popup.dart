import 'dart:async';
import 'package:flutter/material.dart';
import '../models/booking.dart';

class BookingPopup extends StatefulWidget {
  final BookingOffer offer;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const BookingPopup({
    super.key,
    required this.offer,
    required this.onAccept,
    required this.onReject,
  });

  @override
  State<BookingPopup> createState() => _BookingPopupState();
}

class _BookingPopupState extends State<BookingPopup> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  int _secondsLeft = 15;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _secondsLeft = widget.offer.timeoutSeconds;

    _animController = AnimationController(
      vsync: this,
      duration: Duration(seconds: _secondsLeft),
    );

    _animController.reverse(from: 1.0);

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsLeft <= 1) {
        timer.cancel();
        widget.onReject(); // Auto-reject on timeout UI expiration
      } else {
        setState(() {
          _secondsLeft--;
        });
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E2C), // Dark theme modal surface
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'NEW REEL SHOOT REQUEST',
                style: TextStyle(
                  color: Color(0xFF00E676),
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                  fontSize: 13,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white10,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'ID: ${widget.offer.bookingId.substring(0, 8)}',
                  style: const TextStyle(color: Colors.white70, fontSize: 11),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Countdown Circle Indicator
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 90,
                height: 90,
                child: AnimatedBuilder(
                  animation: _animController,
                  builder: (context, child) {
                    return CircularProgressIndicator(
                      value: _animController.value,
                      strokeWidth: 8,
                      backgroundColor: Colors.white10,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        _secondsLeft > 5 ? const Color(0xFF00E676) : Colors.redAccent,
                      ),
                    );
                  },
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '$_secondsLeft',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'SEC',
                    style: TextStyle(color: Colors.white54, fontSize: 10),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Distance and Earning Container
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF2A2A3D),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    const Icon(Icons.near_me, color: Colors.cyanAccent, size: 24),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.offer.distanceKm.toStringAsFixed(2)} km',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const Text('Distance', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ],
                ),
                Container(height: 36, width: 1, color: Colors.white10),
                Column(
                  children: [
                    const Icon(Icons.payments_outlined, color: Colors.greenAccent, size: 24),
                    const SizedBox(height: 4),
                    Text(
                      '₹${(widget.offer.price * 0.6).toStringAsFixed(0)}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    const Text('Earnings (60%)', style: TextStyle(color: Colors.white54, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Location Address Card
          Row(
            children: [
              const Icon(Icons.location_on, color: Colors.redAccent, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  widget.offer.clientAddress,
                  maxLines: 2,
                  overflow: TextSpanOverflow.ellipsis,
                  style: const TextStyle(color: Colors.white90, fontSize: 14),
                ),
              ),
            ],
          ),

          const SizedBox(height: 28),

          // Action Buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.onReject,
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.redAccent, width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'DECLINE',
                    style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: widget.onAccept,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00E676),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'ACCEPT SHOOT',
                    style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
        ],
      ),
    );
  }
}
