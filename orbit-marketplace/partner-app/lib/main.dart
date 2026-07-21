// ============================================================================
// ORBIT PARTNER — Production Flutter WebView Wrapper
// ============================================================================
// Flutter acts ONLY as a native container.
// ALL UI is rendered by the existing Next.js web application.
// Flutter only provides: WebView, GPS bridge (for live location tracking),
// camera/file permissions, biometrics, connectivity, deep linking.
//
// DO NOT modify any web app code, backend, APIs, or business logic.
// ============================================================================

import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:geolocator/geolocator.dart';
import 'package:local_auth/local_auth.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';

// ─── Production URL ──────────────────────────────────────────────────────────
// Replace with your deployed domain before releasing to stores.
const String _kProductionUrl = 'https://two-impalas-sniff.loca.lt';
const String _kRoleParam = '?role=PARTNER';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Edge-to-edge rendering — web app controls its own layout
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  if (Platform.isAndroid) {
    await InAppWebViewController.setWebContentsDebuggingEnabled(false);
  }

  runApp(const OrbitPartnerApp());
}

// ─── Root App ────────────────────────────────────────────────────────────────
class OrbitPartnerApp extends StatelessWidget {
  const OrbitPartnerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Orbit Partner',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Colors.black,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFA020F0), // Orbit Purple
          secondary: Color(0xFF00BFFF), // Orbit Cyan
          surface: Colors.black,
        ),
        useMaterial3: true,
      ),
      home: const OrbitPartnerWebView(),
    );
  }
}

// ─── Main WebView Screen ──────────────────────────────────────────────────────
class OrbitPartnerWebView extends StatefulWidget {
  const OrbitPartnerWebView({super.key});

  @override
  State<OrbitPartnerWebView> createState() => _OrbitPartnerWebViewState();
}

class _OrbitPartnerWebViewState extends State<OrbitPartnerWebView> {
  InAppWebViewController? _webViewController;
  late final PullToRefreshController _pullToRefreshController;
  late final LocalAuthentication _localAuth;

  // URL management
  String _currentUrl = '$_kProductionUrl$_kRoleParam';

  // Loading state
  bool _isLoading = true;
  double _loadingProgress = 0.0;
  bool _hasError = false;
  String _errorMessage = '';

  // Connectivity
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isOffline = false;

  // GPS streaming for live partner location tracking
  StreamSubscription<Position>? _gpsStream;
  bool _isStreamingGPS = false;

  // Dev settings overlay
  bool _showDevSettings = false;
  final TextEditingController _urlController = TextEditingController();

  // Back navigation
  DateTime? _lastBackPressTime;

  @override
  void initState() {
    super.initState();
    _localAuth = LocalAuthentication();
    _initPullToRefresh();
    _initConnectivityWatcher();
    _loadPersistedUrl();
  }

  void _initPullToRefresh() {
    _pullToRefreshController = PullToRefreshController(
      settings: PullToRefreshSettings(
        color: const Color(0xFFA020F0),
        backgroundColor: Colors.black,
      ),
      onRefresh: () async {
        await _webViewController?.reload();
        _pullToRefreshController.endRefreshing();
      },
    );
  }

  void _initConnectivityWatcher() {
    _connectivitySubscription = Connectivity()
        .onConnectivityChanged
        .listen((List<ConnectivityResult> results) {
      final offline = results.every((r) => r == ConnectivityResult.none);
      if (offline != _isOffline) {
        setState(() => _isOffline = offline);
        if (!offline && _hasError) {
          _webViewController?.reload();
        }
      }
    });
  }

  Future<void> _loadPersistedUrl() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('orbit_partner_url');
    final localIp = prefs.getString('orbit_partner_local_ip') ?? '10.0.2.2';
    final useLocal = prefs.getBool('orbit_partner_use_local') ?? false;

    String url;
    if (useLocal) {
      url = 'http://$localIp:3000$_kRoleParam';
    } else {
      url = saved ?? '$_kProductionUrl$_kRoleParam';
    }

    setState(() {
      _currentUrl = url;
      _urlController.text = url;
    });
  }

  Future<void> _saveAndNavigate(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('orbit_partner_url', url);
    setState(() {
      _currentUrl = url;
      _hasError = false;
      _isLoading = true;
    });
    _webViewController?.loadUrl(
      urlRequest: URLRequest(
        url: WebUri(url),
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
        },
      ),
    );
  }

  // ── GPS: One-shot position ──────────────────────────────────────────────────
  Future<void> _injectOneTimeGPS() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
      await _dispatchGPSEvent(position);
    } catch (e) {
      await _webViewController?.evaluateJavascript(source: '''
        window.dispatchEvent(new CustomEvent("orbit_gps_error", {
          detail: { error: "${e.toString().replaceAll('"', '\\"')}" }
        }));
      ''');
    }
  }

  // ── GPS: Start continuous streaming (for partner live tracking) ─────────────
  Future<void> _startGPSStream() async {
    if (_isStreamingGPS) return;
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      await Geolocator.requestPermission();
    }
    final locationSettings = AndroidSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10, // meters
      intervalDuration: const Duration(seconds: 5),
      foregroundNotificationConfig: const ForegroundNotificationConfig(
        notificationText: 'Orbit is tracking your location for active bookings',
        notificationTitle: 'Orbit Partner — Location Active',
        enableWakeLock: true,
      ),
    );
    _gpsStream = Geolocator.getPositionStream(
      locationSettings: Platform.isAndroid
          ? locationSettings
          : const LocationSettings(
              accuracy: LocationAccuracy.high,
              distanceFilter: 10,
            ),
    ).listen((position) {
      _dispatchGPSEvent(position);
    });
    setState(() => _isStreamingGPS = true);
    await _webViewController?.evaluateJavascript(source: '''
      window.dispatchEvent(new CustomEvent("orbit_gps_stream_started", { detail: {} }));
    ''');
  }

  Future<void> _stopGPSStream() async {
    await _gpsStream?.cancel();
    _gpsStream = null;
    setState(() => _isStreamingGPS = false);
    await _webViewController?.evaluateJavascript(source: '''
      window.dispatchEvent(new CustomEvent("orbit_gps_stream_stopped", { detail: {} }));
    ''');
  }

  Future<void> _dispatchGPSEvent(Position position) async {
    await _webViewController?.evaluateJavascript(source: '''
      window.dispatchEvent(new CustomEvent("orbit_gps", {
        detail: {
          lat: ${position.latitude},
          lng: ${position.longitude},
          accuracy: ${position.accuracy},
          altitude: ${position.altitude},
          heading: ${position.heading},
          speed: ${position.speed},
          timestamp: "${DateTime.now().toIso8601String()}"
        }
      }));
    ''');
  }

  // ── Connectivity inject ─────────────────────────────────────────────────────
  Future<void> _injectConnectivityStatus() async {
    final results = await Connectivity().checkConnectivity();
    final isOnline = results.any((r) => r != ConnectivityResult.none);
    await _webViewController?.evaluateJavascript(source: '''
      window.dispatchEvent(new CustomEvent("orbit_connectivity", {
        detail: { online: $isOnline }
      }));
    ''');
  }

  // ── Biometrics ──────────────────────────────────────────────────────────────
  Future<void> _handleBiometricAuth(String reason) async {
    try {
      final canAuth = await _localAuth.canCheckBiometrics;
      if (!canAuth) {
        await _webViewController?.evaluateJavascript(source: '''
          window.dispatchEvent(new CustomEvent("orbit_biometric_result", {
            detail: { success: false, error: "Biometrics not available" }
          }));
        ''');
        return;
      }
      final authenticated = await _localAuth.authenticate(
        localizedReason: reason.isNotEmpty ? reason : 'Authenticate to continue',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
        ),
      );
      await _webViewController?.evaluateJavascript(source: '''
        window.dispatchEvent(new CustomEvent("orbit_biometric_result", {
          detail: { success: $authenticated }
        }));
      ''');
    } catch (e) {
      await _webViewController?.evaluateJavascript(source: '''
        window.dispatchEvent(new CustomEvent("orbit_biometric_result", {
          detail: { success: false, error: "${e.toString().replaceAll('"', '\\"')}" }
        }));
      ''');
    }
  }

  // ── Native Share ────────────────────────────────────────────────────────────
  Future<void> _handleNativeShare(String text, String? url) async {
    try {
      await Share.share(url != null ? '$text\n$url' : text);
    } catch (_) {}
  }

  // ── Register JS handlers ────────────────────────────────────────────────────
  void _registerJavascriptHandlers(InAppWebViewController controller) {
    controller.addJavaScriptHandler(
      handlerName: 'orbit_request_gps',
      callback: (_) async {
        await _injectOneTimeGPS();
        return null;
      },
    );

    controller.addJavaScriptHandler(
      handlerName: 'orbit_start_gps_stream',
      callback: (_) async {
        await _startGPSStream();
        return null;
      },
    );

    controller.addJavaScriptHandler(
      handlerName: 'orbit_stop_gps_stream',
      callback: (_) async {
        await _stopGPSStream();
        return null;
      },
    );

    controller.addJavaScriptHandler(
      handlerName: 'orbit_request_connectivity',
      callback: (_) async {
        await _injectConnectivityStatus();
        return null;
      },
    );

    controller.addJavaScriptHandler(
      handlerName: 'orbit_biometric_auth',
      callback: (args) async {
        final reason = args.isNotEmpty ? args[0].toString() : '';
        await _handleBiometricAuth(reason);
        return null;
      },
    );

    controller.addJavaScriptHandler(
      handlerName: 'orbit_native_share',
      callback: (args) async {
        final text = args.isNotEmpty ? args[0].toString() : '';
        final url = args.length > 1 ? args[1].toString() : null;
        await _handleNativeShare(text, url);
        return null;
      },
    );

    controller.addJavaScriptHandler(
      handlerName: 'orbit_get_platform',
      callback: (_) {
        return {
          'platform': Platform.isAndroid ? 'android' : 'ios',
          'isNativeApp': true,
          'appVersion': '1.0.0',
          'role': 'PARTNER',
        };
      },
    );
  }

  // ── Bridge script injection ─────────────────────────────────────────────────
  Future<void> _injectBridgeScript() async {
    await _webViewController?.evaluateJavascript(source: '''
      (function() {
        if (window.OrbitBridge) return;
        window.OrbitBridge = {
          requestGPS: function() {
            window.flutter_inappwebview.callHandler("orbit_request_gps");
          },
          startGPSStream: function() {
            window.flutter_inappwebview.callHandler("orbit_start_gps_stream");
          },
          stopGPSStream: function() {
            window.flutter_inappwebview.callHandler("orbit_stop_gps_stream");
          },
          requestConnectivity: function() {
            window.flutter_inappwebview.callHandler("orbit_request_connectivity");
          },
          biometricAuth: function(reason) {
            window.flutter_inappwebview.callHandler("orbit_biometric_auth", reason || "");
          },
          share: function(text, url) {
            window.flutter_inappwebview.callHandler("orbit_native_share", text || "", url || null);
          },
          getPlatform: function() {
            return window.flutter_inappwebview.callHandler("orbit_get_platform");
          },
          isNativeApp: true,
          platform: "${Platform.isAndroid ? 'android' : 'ios'}",
          role: "PARTNER"
        };
        window.dispatchEvent(new CustomEvent("orbit_bridge_ready", {
          detail: { platform: window.OrbitBridge.platform, role: "PARTNER" }
        }));
      })();
    ''');
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    _gpsStream?.cancel();
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final canGoBack = await _webViewController?.canGoBack() ?? false;
        if (canGoBack) {
          _webViewController?.goBack();
          return;
        }
        final now = DateTime.now();
        if (_lastBackPressTime == null ||
            now.difference(_lastBackPressTime!) > const Duration(seconds: 2)) {
          _lastBackPressTime = now;
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Press back again to exit'),
                duration: Duration(seconds: 2),
                backgroundColor: Color(0xFF1A1A1A),
              ),
            );
          }
        } else {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            // ── WebView (Always in tree to keep controller alive) ────────────
            _buildWebView(),
            if (_isOffline) _buildOfflineView(),
            if (_hasError && !_isOffline) _buildErrorView(),

            if (_isLoading && !_hasError && !_isOffline)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  value: _loadingProgress > 0 ? _loadingProgress : null,
                  minHeight: 2,
                  backgroundColor: Colors.transparent,
                  color: const Color(0xFFA020F0),
                ),
              ),

            // GPS streaming indicator (shows when partner location is active)
            if (_isStreamingGPS)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: const Color(0xFFA020F0).withOpacity(0.5)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.location_on,
                          color: Color(0xFFA020F0), size: 12),
                      SizedBox(width: 4),
                      Text('Live',
                          style: TextStyle(
                              fontSize: 10,
                              color: Color(0xFFA020F0),
                              fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),

            // Dev settings FAB
            Positioned(
              bottom: 24,
              right: 16,
              child: Opacity(
                opacity: 0.4,
                child: FloatingActionButton.small(
                  backgroundColor: Colors.grey[900],
                  foregroundColor: const Color(0xFFA020F0),
                  heroTag: 'orbit_partner_settings',
                  onPressed: () =>
                      setState(() => _showDevSettings = !_showDevSettings),
                  child: Icon(
                      _showDevSettings ? Icons.close : Icons.developer_mode),
                ),
              ),
            ),

            if (_showDevSettings) _buildDevSettings(),
          ],
        ),
      ),
    );
  }

  Widget _buildWebView() {
    return InAppWebView(
      initialUrlRequest: URLRequest(
        url: WebUri(_currentUrl),
        headers: {
          'Bypass-Tunnel-Reminder': 'true',
        },
      ),
      pullToRefreshController: _pullToRefreshController,
      initialSettings: InAppWebViewSettings(
        javaScriptEnabled: true,
        javaScriptCanOpenWindowsAutomatically: true,
        domStorageEnabled: true,
        databaseEnabled: true,
        hardwareAcceleration: true,
        transparentBackground: true,
        mediaPlaybackRequiresUserGesture: false,
        allowsInlineMediaPlayback: true,
        allowsPictureInPictureMediaPlayback: true,
        allowsBackForwardNavigationGestures: true,
        useWideViewPort: true,
        loadWithOverviewMode: true,
        cacheEnabled: true,
        cacheMode: CacheMode.LOAD_DEFAULT,
        userAgent:
            'OrbitPartnerApp/1.0 Flutter/${Platform.isAndroid ? "Android" : "iOS"}',
        geolocationEnabled: true,
        allowsLinkPreview: false,
      ),
      onWebViewCreated: (controller) {
        _webViewController = controller;
        _registerJavascriptHandlers(controller);
      },
      onReceivedServerTrustAuthRequest: (controller, challenge) async {
        return ServerTrustAuthResponse(action: ServerTrustAuthResponseAction.PROCEED);
      },
      onLoadStart: (controller, url) {
        setState(() {
          _isLoading = true;
          _hasError = false;
        });
      },
      onLoadStop: (controller, url) async {
        _pullToRefreshController.endRefreshing();
        setState(() => _isLoading = false);
        await _injectBridgeScript();
      },
      onProgressChanged: (controller, progress) {
        setState(() => _loadingProgress = progress / 100.0);
        if (progress == 100) _pullToRefreshController.endRefreshing();
      },
      onReceivedError: (controller, request, error) {
        _pullToRefreshController.endRefreshing();
        if (request.isForMainFrame == true) {
          setState(() {
            _hasError = true;
            _isLoading = false;
            _errorMessage = error.description;
          });
        }
      },
      shouldOverrideUrlLoading: (controller, navigationAction) async {
        final uri = navigationAction.request.url;
        if (uri == null) return NavigationActionPolicy.CANCEL;
        final scheme = uri.scheme.toLowerCase();
        if (scheme == 'https' || scheme == 'http') {
          return NavigationActionPolicy.ALLOW;
        }
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
        return NavigationActionPolicy.CANCEL;
      },
      onPermissionRequest: (controller, request) async {
        return PermissionResponse(
          resources: request.resources,
          action: PermissionResponseAction.GRANT,
        );
      },
      onGeolocationPermissionsShowPrompt: (controller, origin) async {
        await Permission.location.request();
        return GeolocationPermissionShowPromptResponse(
          origin: origin,
          allow: true,
          retain: true,
        );
      },
      onDownloadStartRequest: (controller, downloadRequest) async {
        final uri = Uri.parse(downloadRequest.url.toString());
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      onCreateWindow: (controller, createWindowAction) async {
        final uri = createWindowAction.request.url;
        if (uri != null && await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
        return false;
      },
    );
  }

  Widget _buildOfflineView() {
    return Container(
      color: Colors.black,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                color: Colors.grey[900], shape: BoxShape.circle),
            child: const Icon(Icons.wifi_off_rounded,
                color: Color(0xFFA020F0), size: 48),
          ),
          const SizedBox(height: 24),
          const Text('No Internet Connection',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white)),
          const SizedBox(height: 8),
          const Text('Check your connection and try again.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: Colors.grey)),
        ],
      ),
    );
  }

  Widget _buildErrorView() {
    return Container(
      color: Colors.black,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
                color: Colors.red[950], shape: BoxShape.circle),
            child:
                const Icon(Icons.error_outline_rounded, color: Colors.red, size: 48),
          ),
          const SizedBox(height: 24),
          const Text('Could Not Load',
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white)),
          const SizedBox(height: 8),
          Text(_errorMessage,
              textAlign: TextAlign.center,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              setState(() {
                _hasError = false;
                _isLoading = true;
              });
              _webViewController?.reload();
            },
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFA020F0),
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDevSettings() {
    return Container(
      color: Colors.black87,
      alignment: Alignment.center,
      child: SingleChildScrollView(
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 20),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF111111),
            borderRadius: BorderRadius.circular(16),
            border:
                Border.all(color: const Color(0xFFA020F0).withOpacity(0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  Icon(Icons.developer_mode, color: Color(0xFFA020F0)),
                  SizedBox(width: 8),
                  Text('Dev Settings',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white)),
                ],
              ),
              const SizedBox(height: 4),
              const Text(
                'This overlay is for development only.',
                style: TextStyle(fontSize: 11, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _urlController,
                style: const TextStyle(fontSize: 13, color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Server URL',
                  hintText: 'https://your-domain.com or http://10.0.2.2:3000',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.link),
                ),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 8),
              const Text(
                '• Production: https://orbit-quickcontent.vercel.app\n'
                '• Android Emulator: http://10.0.2.2:3000\n'
                '• Real device: http://<your-local-ip>:3000',
                style: TextStyle(fontSize: 11, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () =>
                        setState(() => _showDevSettings = false),
                    child: const Text('Cancel'),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      var url = _urlController.text.trim();
                      if (!url.startsWith('http')) url = 'https://$url';
                      if (!url.contains('role=')) {
                        url += (url.contains('?') ? '&' : '?') + 'role=PARTNER';
                      }
                      _saveAndNavigate(url);
                      setState(() => _showDevSettings = false);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFA020F0),
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Connect'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
