import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/booking_model.dart';
import '../providers/partner_provider.dart';

class TripScreen extends ConsumerStatefulWidget {
  const TripScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends ConsumerState<TripScreen> {
  BookingStatus _currentStep = BookingStatus.accepted;

  void _advanceStatus() {
    switch (_currentStep) {
      case BookingStatus.accepted:
        setState(() => _currentStep = BookingStatus.enRoute);
        ref.read(partnerProvider.notifier).updateTripStatus(BookingStatus.enRoute);
        break;
      case BookingStatus.enRoute:
        setState(() => _currentStep = BookingStatus.shooting);
        ref.read(partnerProvider.notifier).updateTripStatus(BookingStatus.shooting);
        break;
      case BookingStatus.shooting:
        setState(() => _currentStep = BookingStatus.editing);
        ref.read(partnerProvider.notifier).updateTripStatus(BookingStatus.editing);
        break;
      case BookingStatus.editing:
        setState(() => _currentStep = BookingStatus.delivered);
        ref.read(partnerProvider.notifier).updateTripStatus(BookingStatus.delivered);
        if (mounted) {
          context.go('/home');
        }
        break;
      default:
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(partnerProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        title: Text(
          'Active Booking #${state.activeBookingId?.substring(0, 6) ?? '100'}',
          style: const TextStyle(color: Colors.white),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.camera_roll_rounded,
                      size: 60,
                      color: Color(0xFF6366F1),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _getStatusTitle(_currentStep),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _getStatusSubtitle(_currentStep),
                      style: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'SHOOT PROGRESS',
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 16),
              _buildProgressStep(
                step: BookingStatus.accepted,
                title: 'Offer Accepted',
                isDone: true,
              ),
              _buildProgressStep(
                step: BookingStatus.enRoute,
                title: 'En Route to Location',
                isDone: _currentStep.index >= BookingStatus.enRoute.index,
              ),
              _buildProgressStep(
                step: BookingStatus.shooting,
                title: 'Shooting Video Footage',
                isDone: _currentStep.index >= BookingStatus.shooting.index,
              ),
              _buildProgressStep(
                step: BookingStatus.editing,
                title: 'Post-Production & Editing',
                isDone: _currentStep.index >= BookingStatus.editing.index,
              ),
              _buildProgressStep(
                step: BookingStatus.delivered,
                title: 'Final Reel Delivered',
                isDone: _currentStep == BookingStatus.delivered,
              ),
              const Spacer(),
              ElevatedButton(
                onPressed: _advanceStatus,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  _getButtonText(_currentStep),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProgressStep({
    required BookingStatus step,
    required String title,
    required bool isDone,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          CircleAvatar(
            radius: 12,
            backgroundColor: isDone ? const Color(0xFF10B981) : const Color(0xFF334155),
            child: isDone
                ? const Icon(Icons.check, size: 14, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 16),
          Text(
            title,
            style: TextStyle(
              color: isDone ? Colors.white : const Color(0xFF64748B),
              fontSize: 15,
              fontWeight: isDone ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  String _getStatusTitle(BookingStatus status) {
    switch (status) {
      case BookingStatus.accepted:
        return 'Booking Confirmed';
      case BookingStatus.enRoute:
        return 'Navigating to Shoot';
      case BookingStatus.shooting:
        return 'Recording in Progress';
      case BookingStatus.editing:
        return 'Upload & Edit Phase';
      case BookingStatus.delivered:
        return 'Shoot Delivered!';
      default:
        return 'Active Trip';
    }
  }

  String _getStatusSubtitle(BookingStatus status) {
    switch (status) {
      case BookingStatus.accepted:
        return 'Prepare your gear and head to location';
      case BookingStatus.enRoute:
        return 'Real-time GPS tracking active for client';
      case BookingStatus.shooting:
        return 'Capturing high quality 4K video footage';
      case BookingStatus.editing:
        return 'Syncing proxy files and building main edit';
      case BookingStatus.delivered:
        return 'Client notified and payment released';
      default:
        return '';
    }
  }

  String _getButtonText(BookingStatus status) {
    switch (status) {
      case BookingStatus.accepted:
        return 'START TRIP (EN ROUTE)';
      case BookingStatus.enRoute:
        return 'ARRIVED & START SHOOTING';
      case BookingStatus.shooting:
        return 'FINISH SHOOT & START EDITING';
      case BookingStatus.editing:
        return 'COMPLETE & DELIVER REEL';
      default:
        return 'NEXT STEP';
    }
  }
}
