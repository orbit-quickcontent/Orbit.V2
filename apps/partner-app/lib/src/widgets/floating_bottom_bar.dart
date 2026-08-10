import 'package:flutter/material.dart';

class FloatingBottomBar extends StatefulWidget {
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final String userInitials;

  const FloatingBottomBar({
    Key? key,
    required this.selectedIndex,
    required this.onTabSelected,
    this.userInitials = 'GC',
  }) : super(key: key);

  @override
  State<FloatingBottomBar> createState() => _FloatingBottomBarState();
}

class _FloatingBottomBarState extends State<FloatingBottomBar> {
  @override
  Widget build(BuildContext context) {
    final items = [
      {'label': 'Home', 'icon': Icons.home_rounded},
      {'label': 'Packages', 'icon': Icons.inventory_2_rounded},
      {'label': 'Track', 'icon': Icons.my_location_rounded},
      {'label': 'Profile', 'icon': null},
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      height: 68,
      decoration: BoxDecoration(
        color: const Color(0xFF0F1015),
        borderRadius: BorderRadius.circular(36),
        border: Border.all(color: const Color(0xFF22242E), width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.6),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(5),
      child: Row(
        children: List.generate(items.length, (index) {
          final isSelected = widget.selectedIndex == index;
          final item = items[index];

          return Expanded(
            child: GestureDetector(
              onTap: () => widget.onTabSelected(index),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF222530) : Colors.transparent,
                  borderRadius: BorderRadius.circular(28),
                  border: isSelected
                      ? Border.all(color: const Color(0xFF333748), width: 1)
                      : null,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    if (isSelected) ...[
                      // Glowing White Top Bar
                      Positioned(
                        top: 0,
                        child: Container(
                          width: 36,
                          height: 3,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.white.withOpacity(0.9),
                                blurRadius: 8,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (index == 3)
                          Container(
                            width: 22,
                            height: 22,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            alignment: Alignment.center,
                            child: Text(
                              widget.userInitials,
                              style: const TextStyle(
                                color: Color(0xFF0F1015),
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          )
                        else
                          Icon(
                            item['icon'] as IconData,
                            size: 20,
                            color: isSelected ? Colors.white : const Color(0xFF8E92A0),
                          ),
                        const SizedBox(height: 3),
                        Text(
                          item['label'] as String,
                          style: TextStyle(
                            color: isSelected ? Colors.white : const Color(0xFF8E92A0),
                            fontSize: 11,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}
