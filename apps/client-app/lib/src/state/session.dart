import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../api/orbit_api.dart';

class ClientSession {
  const ClientSession({this.token, this.userId, this.name, this.email});
  final String? token;
  final String? userId;
  final String? name;
  final String? email;
  bool get isAuthenticated => token != null && token!.isNotEmpty;
}

final orbitApiProvider = Provider<OrbitApi>((ref) => OrbitApi());
final sessionProvider = StateNotifierProvider<ClientSessionNotifier, ClientSession>((ref) => ClientSessionNotifier(ref.read(orbitApiProvider)));

class ClientSessionNotifier extends StateNotifier<ClientSession> {
  ClientSessionNotifier(this.api) : super(const ClientSession());
  final OrbitApi api;

  Future<void> restore() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('orbit_client_token');
    final userId = prefs.getString('orbit_client_user_id');
    final name = prefs.getString('orbit_client_name');
    final email = prefs.getString('orbit_client_email');
    if (token != null) {
      api.accessToken = token;
      state = ClientSession(token: token, userId: userId, name: name, email: email);
    }
  }

  Future<void> saveFromAuth(Map<String, dynamic> data) async {
    final token = (data['accessToken'] ?? data['token'] ?? '').toString();
    final user = Map<String, dynamic>.from((data['user'] ?? {}) as Map);
    if (token.isEmpty) throw Exception('Authentication token missing');
    api.accessToken = token;
    state = ClientSession(token: token, userId: user['id']?.toString(), name: user['name']?.toString(), email: user['email']?.toString());
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('orbit_client_token', token);
    if (state.userId != null) await prefs.setString('orbit_client_user_id', state.userId!);
    if (state.name != null) await prefs.setString('orbit_client_name', state.name!);
    if (state.email != null) await prefs.setString('orbit_client_email', state.email!);
  }

  Future<void> logout() async {
    state = const ClientSession();
    api.accessToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('orbit_client_token');
    await prefs.remove('orbit_client_user_id');
    await prefs.remove('orbit_client_name');
    await prefs.remove('orbit_client_email');
  }
}
