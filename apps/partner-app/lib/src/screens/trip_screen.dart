import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/booking_model.dart';
import '../providers/partner_provider.dart';

class TripScreen extends ConsumerStatefulWidget {
  const TripScreen({super.key});
  @override
  ConsumerState<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends ConsumerState<TripScreen> {
  BookingStatus _currentStep = BookingStatus.enRoute;

  void _advanceStatus() {
    final next = switch (_currentStep) {
      BookingStatus.enRoute => BookingStatus.shooting,
      BookingStatus.shooting => BookingStatus.syncing,
      BookingStatus.syncing => BookingStatus.editing,
      BookingStatus.editing => BookingStatus.delivered,
      _ => _currentStep,
    };
    if (next == _currentStep) return;
    setState(() => _currentStep = next);
    ref.read(partnerProvider.notifier).updateTripStatus(next);
    if (next == BookingStatus.delivered && mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(partnerProvider);
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text('Active Booking #${(state.activeBookingId ?? '100').substring(0, 6)}', style: const TextStyle(color: Colors.white)),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: const Color(0xFF1E293B), borderRadius: BorderRadius.circular(16)),
              child: Column(children: [
                const Icon(Icons.camera_roll_rounded, size: 60, color: Color(0xFF6366F1)),
                const SizedBox(height: 12),
                Text(_title(_currentStep), style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(_subtitle(_currentStep), textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14)),
              ]),
            ),
            const SizedBox(height: 28),
            const Text('SHOOT PROGRESS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
            const SizedBox(height: 12),
            ...[(BookingStatus.enRoute, 'En Route to Location'), (BookingStatus.shooting, 'Shooting Video Footage'), (BookingStatus.syncing, 'Syncing Raw Footage'), (BookingStatus.editing, 'Editor Processing Reel'), (BookingStatus.delivered, 'Final Reel Delivered')].map((entry) => _step(entry.$1, entry.$2)),
            const Spacer(),
            FilledButton(onPressed: _currentStep == BookingStatus.delivered ? null : _advanceStatus, child: Padding(padding: const EdgeInsets.symmetric(vertical: 16), child: Text(_buttonText(_currentStep)))),
          ]),
        ),
      ),
    );
  }

  Widget _step(BookingStatus step, String title) {
    final done = _currentStep.index >= step.index;
    return ListTile(leading: CircleAvatar(radius: 12, backgroundColor: done ? const Color(0xFF10B981) : const Color(0xFF334155), child: done ? const Icon(Icons.check, size: 14) : null), title: Text(title, style: TextStyle(color: done ? Colors.white : const Color(0xFF64748B), fontWeight: done ? FontWeight.w600 : FontWeight.normal)));
  }

  String _title(BookingStatus status) => switch (status) {
        BookingStatus.enRoute => 'Navigating to Shoot',
        BookingStatus.shooting => 'Recording in Progress',
        BookingStatus.syncing => 'Syncing Footage',
        BookingStatus.editing => 'Editing in Progress',
        BookingStatus.delivered => 'Shoot Delivered',
        _ => 'Active Trip',
      };

  String _subtitle(BookingStatus status) => switch (status) {
        BookingStatus.enRoute => 'Client tracking is live.',
        BookingStatus.shooting => 'Capture the agreed creative brief.',
        BookingStatus.syncing => 'Upload raw footage securely to ORBIT.',
        BookingStatus.editing => 'The editor is preparing the final 9:16 reel.',
        BookingStatus.delivered => 'The client has been notified.',
        _ => '',
      };

  String _buttonText(BookingStatus status) => switch (status) {
        BookingStatus.enRoute => 'ARRIVED & START SHOOTING',
        BookingStatus.shooting => 'FINISH SHOOT & SYNC FOOTAGE',
        BookingStatus.syncing => 'MARK SYNC COMPLETE',
        BookingStatus.editing => 'COMPLETE & DELIVER REEL',
        _ => 'NEXT STEP',
      };
}
