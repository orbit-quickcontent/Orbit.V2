import 'package:flutter_test/flutter_test.dart';
import 'package:orbit_client/main.dart';

void main() {
  testWidgets('ORBIT Client boots', (tester) async {
    await tester.pumpWidget(const OrbitClientApp());
    expect(find.text('ORBIT'), findsOneWidget);
  });
}
