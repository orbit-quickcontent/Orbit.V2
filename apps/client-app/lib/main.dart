import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'src/state/session.dart';
import 'src/screens/login_screen.dart';
import 'src/screens/home_screen.dart';
import 'src/screens/booking_screen.dart';
import 'src/screens/tracking_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ProviderScope(child: OrbitClientApp()));
}

class OrbitClientApp extends ConsumerStatefulWidget {
  const OrbitClientApp({super.key, this.restoreSession = true});

  final bool restoreSession;

  @override
  ConsumerState<OrbitClientApp> createState() => _OrbitClientAppState();
}

class _OrbitClientAppState extends ConsumerState<OrbitClientApp> {
  @override
  void initState() {
    super.initState();
    if (widget.restoreSession) {
      ref.read(sessionProvider.notifier).restore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'ORBIT Client',
      theme: ThemeData(
        brightness: Brightness.dark,
        useMaterial3: true,
        scaffoldBackgroundColor: const Color(0xFF06070B),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF7C5CFF), brightness: Brightness.dark),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF10131A),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
        ),
      ),
      initialRoute: session.isAuthenticated ? '/home' : '/login',
      routes: {
        '/login': (_) => const LoginScreen(),
        '/home': (_) => const HomeScreen(),
        '/booking': (_) => const BookingScreen(),
        '/tracking': (_) => const TrackingScreen(),
      },
    );
  }
}
