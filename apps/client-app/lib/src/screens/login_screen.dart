import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../state/session.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _email = TextEditingController();
  final _otp = TextEditingController();
  bool sent = false;
  bool busy = false;
  String? error;

  @override
  void dispose() { _email.dispose(); _otp.dispose(); super.dispose(); }

  Future<void> _submit() async {
    setState(() { busy = true; error = null; });
    try {
      final api = ref.read(orbitApiProvider);
      if (!sent) {
        await api.sendOtp(_email.text.trim());
        setState(() => sent = true);
      } else {
        final result = await api.verifyOtp(_email.text.trim(), _otp.text.trim());
        await ref.read(sessionProvider.notifier).saveFromAuth(result);
        if (mounted) Navigator.pushNamedAndRemoveUntil(context, '/home', (_) => false);
      }
    } catch (e) {
      setState(() => error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF0E1020), Color(0xFF050609)])),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 460),
                child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  const Text('ORBIT', textAlign: TextAlign.center, style: TextStyle(fontSize: 48, fontWeight: FontWeight.w900, letterSpacing: -2)),
                  const SizedBox(height: 8),
                  const Text('Book a reel. Track the shoot. Get the reel.', textAlign: TextAlign.center, style: TextStyle(color: Color(0xFFA7ADBE))),
                  const SizedBox(height: 40),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: .05), borderRadius: BorderRadius.circular(28), border: Border.all(color: Colors.white.withValues(alpha: .08))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                      Text(sent ? 'Verify your code' : 'Sign in to ORBIT', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 18),
                      TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email address', prefixIcon: Icon(Icons.email_outlined)), enabled: !sent),
                      if (sent) ...[
                        const SizedBox(height: 14),
                        TextField(controller: _otp, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'One-time code', prefixIcon: Icon(Icons.lock_outline)), obscureText: true),
                      ],
                      if (error != null) ...[
                        const SizedBox(height: 12),
                        Text(error!, style: const TextStyle(color: Colors.redAccent)),
                      ],
                      const SizedBox(height: 18),
                      FilledButton(onPressed: busy ? null : _submit, child: Padding(padding: const EdgeInsets.symmetric(vertical: 14), child: Text(busy ? 'Please wait…' : sent ? 'Verify & Continue' : 'Send Code'))),
                      if (sent) TextButton(onPressed: busy ? null : () => setState(() { sent = false; _otp.clear(); }), child: const Text('Use a different email')),
                    ]),
                  ),
                ]),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
