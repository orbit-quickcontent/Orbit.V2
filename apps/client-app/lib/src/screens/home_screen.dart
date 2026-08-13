import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../state/session.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});
  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  List<Map<String, dynamic>> packages = [];
  List<Map<String, dynamic>> bookings = [];
  bool loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final api = ref.read(orbitApiProvider);
      final results = await Future.wait([api.packages(), api.bookings()]);
      if (mounted) setState(() { packages = results[0]; bookings = results[1]; loading = false; });
    } catch (_) {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('ORBIT'),
        actions: [IconButton(onPressed: () => ref.read(sessionProvider.notifier).logout().then((_) => Navigator.pushNamedAndRemoveUntil(context, '/login', (_) => false)), icon: const Icon(Icons.logout))],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(padding: const EdgeInsets.fromLTRB(20, 12, 20, 32), children: [
          Text('Good to see you${session.name == null ? '' : ', ${session.name!.split(' ').first}'}', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          const Text('Create something people will stop scrolling for.', style: TextStyle(color: Color(0xFF9DA4B4))),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF7C5CFF), Color(0xFF18C8FF)]), borderRadius: BorderRadius.circular(24)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('On-demand reels', style: TextStyle(color: Colors.white70)),
              const SizedBox(height: 5),
              const Text('Shoot → edit → deliver', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900)),
              const SizedBox(height: 14),
              FilledButton.tonal(onPressed: () => Navigator.pushNamed(context, '/booking'), child: const Text('Book a reel')),
            ]),
          ),
          const SizedBox(height: 28),
          const Text('Packages', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (loading) const LinearProgressIndicator(),
          if (!loading && packages.isEmpty) const Text('Packages will appear here when the API is seeded.', style: TextStyle(color: Colors.white60)),
          ...packages.take(5).map((p) => Card(
            child: ListTile(
              title: Text((p['name'] ?? 'ORBIT Reel').toString()),
              subtitle: Text('${p['price'] ?? '—'} • ${p['deliveryTime'] ?? 'Fast delivery'}'),
              trailing: const Icon(Icons.arrow_forward_ios, size: 16),
              onTap: () => Navigator.pushNamed(context, '/booking', arguments: p),
            ),
          )),
          const SizedBox(height: 24),
          const Text('Your bookings', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (bookings.isEmpty) const Text('No bookings yet.', style: TextStyle(color: Colors.white60)),
          ...bookings.take(8).map((b) {
            final id = b['id']?.toString() ?? '';
            final status = b['status']?.toString() ?? 'PENDING';
            return Card(
              child: ListTile(
                leading: CircleAvatar(child: Text(status.substring(0, 1))),
                title: Text((b['package']?['name'] ?? 'ORBIT Reel').toString()),
                subtitle: Text('$status • ${b['location'] ?? 'Location pending'}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: id.isEmpty ? null : () => Navigator.pushNamed(context, '/tracking', arguments: id),
              ),
            );
          }),
        ]),
      ),
    );
  }
}
