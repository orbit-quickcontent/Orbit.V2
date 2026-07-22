// This is a basic Flutter widget test for Orbit Client app.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:orbit_client/main.dart';

void main() {
  testWidgets('MyApp renders custom home widget test', (WidgetTester tester) async {
    await tester.pumpWidget(const MyApp());

    // Verify that the webview home screen loads.
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
