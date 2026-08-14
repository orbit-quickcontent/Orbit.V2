import 'package:flutter/material.dart';
import '../models/dispatch_offer.dart';
import '../services/socket_service.dart';

class DispatchOfferScreen extends StatefulWidget {
  final DispatchOffer offer;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const DispatchOfferScreen({
    super.key,
    required this.offer,
    required this.onAccept,
    required this.onReject,
  });

  @override
  State<DispatchOfferScreen> createState() => _DispatchOfferScreenState();
}

class _DispatchOfferScreenState extends State<DispatchOfferScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _progressController;

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.offer.timeoutSeconds),
    )..forward();

    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        widget.onReject();
      }
    });
  }

  @override
  void dispose() {
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: const Color(0xFF0F172A),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0xFF6366F1).withValues(alpha: 0.4), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF6366F1).withValues(alpha: 0.25),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Timeout Progress Bar
            AnimatedBuilder(
              animation: _progressController,
              builder: (context, child) {
                return ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: 1.0 - _progressController.value,
                    backgroundColor: Colors.white12,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
                    minHeight: 5,
                  ),
                );
              },
            ),
            const SizedBox(height: 20),

            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'NEW SHOOT OFFER',
                  style: TextStyle(
                    color: Color(0xFF6366F1),
                    fontSize: 12,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${widget.offer.distanceKm} km away',
                    style: const TextStyle(
                      color: Color(0xFF10B981),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Guaranteed Earnings Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                ),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                children: [
                  const Text('GUARANTEED PAYOUT', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(
                    '₹${widget.offer.partnerEarningAmount.toInt()}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 38,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text('ETA ~ ${widget.offer.etaMinutes} min', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Accept & Decline Buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white60,
                      side: const BorderSide(color: Colors.white24),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedCornerShape(16),
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: ElevatedButton(
                    onPressed: widget.onAccept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedCornerShape(16),
                      elevation: 4,
                    ),
                    child: const Text('Accept Shoot', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

RoundedCornerShape(double r) => RoundedRectangleBorder(borderRadius: BorderRadius.circular(r));
