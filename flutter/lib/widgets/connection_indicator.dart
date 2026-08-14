import 'package:flutter/material.dart';

class ConnectionIndicatorWidget extends StatelessWidget {
  final bool isConnected;
  const ConnectionIndicatorWidget({super.key, required this.isConnected});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isConnected
            ? const Color(0xFF10B981).withValues(alpha: 0.15)
            : const Color(0xFFEF4444).withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isConnected ? const Color(0xFF10B981) : const Color(0xFFEF4444),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CircleAvatar(
            radius: 3.5,
            backgroundColor: isConnected ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          ),
          const SizedBox(width: 5),
          Text(
            isConnected ? 'LIVE TRACKING' : 'OFFLINE',
            style: TextStyle(
              color: isConnected ? const Color(0xFF10B981) : const Color(0xFFEF4444),
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}
