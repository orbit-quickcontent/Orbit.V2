import 'package:flutter_test/flutter_test.dart';
import 'package:orbit_client/main.dart';

void main() {
  testWidgets('ORBIT Client boots', (tester) async {
    await tester.pumpWidget(const OrbitClientApp());
    expect(find.byType(OrbitClientApp), findsOneWidget);

    await tester.pumpAndSettle(const Duration(milliseconds: 500));

    expect(
      find.text('ORBIT'),
      findsAtLeastNWidgets(1),
    );
  });
}
