import 'package:flutter/material.dart';

class PartnerMarkerWidget extends StatelessWidget {
  final double heading;
  final bool isMoving;
  const PartnerMarkerWidget({
    super.key,
    this.heading = 0.0,
    this.isMoving = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: const Color(0xFF6366F1),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF6366F1).withValues(alpha: 0.5),
            blurRadius: 12,
            spreadRadius: 3,
          ),
        ],
      ),
      child: Transform.rotate(
        angle: (heading * 3.141592653589793) / 180,
        child: const Icon(
          Icons.videocam_rounded,
          color: Colors.white,
          size: 26,
        ),
      ),
    );
  }
}
