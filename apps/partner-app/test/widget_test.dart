import 'package:flutter_test/flutter_test.dart';
import 'package:partner_app/main.dart';

void main() {
  testWidgets('Partner app boots', (tester) async {
    await tester.pumpWidget(const OrbitPartnerApp());
    expect(find.byType(OrbitPartnerApp), findsOneWidget);
  });
}
