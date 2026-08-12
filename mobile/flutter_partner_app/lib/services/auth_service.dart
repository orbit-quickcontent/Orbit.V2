import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class PartnerUser {
  final String id;
  final String name;
  final String email;
  final String token;

  PartnerUser({
    required this.id,
    required this.name,
    required this.email,
    required this.token,
  });
}

class AuthService {
  final _storage = const FlutterSecureStorage();

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'jwt_token', value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: 'jwt_token');
  }

  Future<void> logout() async {
    await _storage.delete(key: 'jwt_token');
  }
}

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService();
});
