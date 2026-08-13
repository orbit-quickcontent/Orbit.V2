import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:orbit_client/main.dart';

void main() {
  testWidgets('ORBIT Client boots', (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: OrbitClientApp(),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.byType(OrbitClientApp), findsOneWidget);
    expect(find.text('ORBIT'), findsOneWidget);
  });
}
