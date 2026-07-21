// ============================================================================
// ORBIT CLIENT — Production Flutter WebView Wrapper
// ============================================================================
// Flutter acts ONLY as a native container.  
// ALL UI is rendered by the existing Next.js web application.
// Flutter only provides: WebView, GPS bridge, camera/file permissions,
// biometrics, downloads, connectivity, deep linking, native share.
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
const String _kLocalEmulatorUrl = 'http://10.0.2.2:3000';
const String _kRoleParam = '?role=USER';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Edge-to-edge: Let the web app control its own insets
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.black,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

  // Allow HTTP for local dev (no cleartext policy needed for HTTPS production)
  if (Platform.isAndroid) {
    await InAppWebViewController.setWebContentsDebuggingEnabled(false);
  }

  runApp(const OrbitClientApp());
}

// ─── Root App ────────────────────────────────────────────────────────────────
class OrbitClientApp extends StatelessWidget {
  const OrbitClientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Orbit',
      debugShowCheckedModeBanner: false,
      // Minimal theme — all real UI comes from the web app
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: Colors.black,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF00BFFF), // Orbit Cyan
          secondary: Color(0xFFA020F0), // Orbit Purple
          surface: Colors.black,
        ),
        useMaterial3: true,
      ),
      home: const OrbitWebView(),
    );
  }
}

// ─── Main WebView Screen ──────────────────────────────────────────────────────
class OrbitWebView extends StatefulWidget {
  const OrbitWebView({super.key});

  @override
  State<OrbitWebView> createState() => _OrbitWebViewState();
}

class _OrbitWebViewState extends State<OrbitWebView> {
  InAppWebViewController? _webViewController;
  late final PullToRefreshController _pullToRefreshController;
  late final LocalAuthentication _localAuth;

  // URL management
  String _currentUrl = '$_kProductionUrl$_kRoleParam';
  bool _useLocalDev = false;

  // Loading state
  bool _isLoading = true;
  double _loadingProgress = 0.0;
  bool _hasError = false;
  String _errorMessage = '';

  // Connectivity
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isOffline = false;

  // Dev settings overlay
  bool _showDevSettings = false;
  final TextEditingController _urlController = TextEditingController();

  // Back navigation support
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
        color: const Color(0xFF00BFFF),
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
    final saved = prefs.getString('orbit_client_url');
    final useLocal = prefs.getBool('orbit_client_use_local') ?? false;
    final localIp = prefs.getString('orbit_client_local_ip') ?? '10.0.2.2';

    String url;
    if (useLocal) {
      url = 'http://$localIp:3000$_kRoleParam';
    } else {
      url = saved ?? '$_kProductionUrl$_kRoleParam';
    }

    setState(() {
      _currentUrl = url;
      _useLocalDev = useLocal;
      _urlController.text = url;
    });
  }

  Future<void> _saveAndNavigate(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('orbit_client_url', url);
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

  // ── JavaScript Bridge: GPS ──────────────────────────────────────────────────
  Future<void> _injectGPS() async {
    try {
      final permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        await Geolocator.requestPermission();
      }
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );
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
    } catch (e) {
      await _webViewController?.evaluateJavascript(source: '''
        window.dispatchEvent(new CustomEvent("orbit_gps_error", {
          detail: { error: "${e.toString().replaceAll('"', '\\"')}" }
        }));
      ''');
    }
  }

  // ── JavaScript Bridge: Connectivity ────────────────────────────────────────
  Future<void> _injectConnectivityStatus() async {
    final results = await Connectivity().checkConnectivity();
    final isOnline = results.any((r) => r != ConnectivityResult.none);
    await _webViewController?.evaluateJavascript(source: '''
      window.dispatchEvent(new CustomEvent("orbit_connectivity", {
        detail: { online: $isOnline }
      }));
    ''');
  }

  // ── JavaScript Bridge: Biometrics ──────────────────────────────────────────
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

  // ── JavaScript Bridge: Native Share ────────────────────────────────────────
  Future<void> _handleNativeShare(String text, String? url) async {
    try {
      await Share.share(url != null ? '$text\n$url' : text);
    } catch (_) {}
  }

  // ── JavaScript Channel Setup ────────────────────────────────────────────────
  void _registerJavascriptHandlers(InAppWebViewController controller) {
    // GPS request from web
    controller.addJavaScriptHandler(
      handlerName: 'orbit_request_gps',
      callback: (_) async {
        await _injectGPS();
        return null;
      },
    );

    // Connectivity request from web
    controller.addJavaScriptHandler(
      handlerName: 'orbit_request_connectivity',
      callback: (_) async {
        await _injectConnectivityStatus();
        return null;
      },
    );

    // Biometric auth request from web
    controller.addJavaScriptHandler(
      handlerName: 'orbit_biometric_auth',
      callback: (args) async {
        final reason = args.isNotEmpty ? args[0].toString() : '';
        await _handleBiometricAuth(reason);
        return null;
      },
    );

    // Native share from web
    controller.addJavaScriptHandler(
      handlerName: 'orbit_native_share',
      callback: (args) async {
        final text = args.isNotEmpty ? args[0].toString() : '';
        final url = args.length > 1 ? args[1].toString() : null;
        await _handleNativeShare(text, url);
        return null;
      },
    );

    // App version info
    controller.addJavaScriptHandler(
      handlerName: 'orbit_get_platform',
      callback: (_) {
        return {
          'platform': Platform.isAndroid ? 'android' : 'ios',
          'isNativeApp': true,
          'appVersion': '1.0.0',
          'role': 'USER',
        };
      },
    );
  }

  // ── Inject helper script so web can call Flutter via window.OrbitBridge ─────
  Future<void> _injectBridgeScript() async {
    await _webViewController?.evaluateJavascript(source: '''
      (function() {
        if (window.OrbitBridge) return;
        window.OrbitBridge = {
          requestGPS: function() {
            window.flutter_inappwebview.callHandler("orbit_request_gps");
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
          role: "USER"
        };
        // Notify web app that native bridge is ready
        window.dispatchEvent(new CustomEvent("orbit_bridge_ready", {
          detail: { platform: window.OrbitBridge.platform, role: "USER" }
        }));
      })();
    ''');
  }

  // ── Permissions ─────────────────────────────────────────────────────────────
  Future<void> _requestEssentialPermissions() async {
    await [
      Permission.camera,
      Permission.location,
      Permission.microphone,
    ].request();
  }

  // ── File chooser for uploads ─────────────────────────────────────────────────
  Future<List<Uri>?> _showFilePicker() async {
    final result = await FilePicker.platform.pickFiles(
      allowMultiple: true,
      type: FileType.any,
    );
    if (result == null) return null;
    return result.paths
        .where((p) => p != null)
        .map((p) => Uri.file(p!))
        .toList();
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
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
        // Double-back to exit
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

            // ── Offline Banner ───────────────────────────────────────────────
            if (_isOffline) _buildOfflineView(),

            // ── Connection Error ─────────────────────────────────────────────
            if (_hasError && !_isOffline) _buildErrorView(),

            // ── Thin progress bar at top ─────────────────────────────────────
            if (_isLoading && !_hasError && !_isOffline)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: LinearProgressIndicator(
                  value: _loadingProgress > 0 ? _loadingProgress : null,
                  minHeight: 2,
                  backgroundColor: Colors.transparent,
                  color: const Color(0xFF00BFFF),
                ),
              ),

            // ── Dev Settings (semi-transparent FAB — production: remove) ─────
            Positioned(
              bottom: 24,
              right: 16,
              child: Opacity(
                opacity: 0.4,
                child: FloatingActionButton.small(
                  backgroundColor: Colors.grey[900],
                  foregroundColor: const Color(0xFF00BFFF),
                  heroTag: 'orbit_client_settings',
                  onPressed: () =>
                      setState(() => _showDevSettings = !_showDevSettings),
                  child: Icon(
                      _showDevSettings ? Icons.close : Icons.developer_mode),
                ),
              ),
            ),

            // ── Dev Settings overlay ─────────────────────────────────────────
            if (_showDevSettings) _buildDevSettings(),
          ],
        ),
      ),
    );
  }

  // ── InAppWebView builder ─────────────────────────────────────────────────────
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
        // JavaScript
        javaScriptEnabled: true,
        javaScriptCanOpenWindowsAutomatically: true,

        // DOM / Storage / Cookies
        domStorageEnabled: true,
        databaseEnabled: true,
        allowFileAccessFromFileURLs: false,
        allowUniversalAccessFromFileURLs: false,

        // Hardware acceleration & rendering
        hardwareAcceleration: true,
        transparentBackground: true,

        // Media
        mediaPlaybackRequiresUserGesture: false,
        allowsInlineMediaPlayback: true,
        allowsPictureInPictureMediaPlayback: true,

        // File upload / camera
        allowsBackForwardNavigationGestures: true,

        // Viewport
        useWideViewPort: true,
        loadWithOverviewMode: true,

        // Cache policy — always fresh after deploy
        cacheEnabled: true,
        cacheMode: CacheMode.LOAD_DEFAULT,

        // User agent — identify as native app
        userAgent:
            'OrbitClientApp/1.0 Flutter/${Platform.isAndroid ? "Android" : "iOS"}',

        // Geolocation
        geolocationEnabled: true,

        // SSL / HTTPS
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
        if (progress == 100) {
          _pullToRefreshController.endRefreshing();
        }
      },
      onReceivedError: (controller, request, error) {
        _pullToRefreshController.endRefreshing();
        // Only surface fatal errors; ignore subframe / resource errors
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
        // Let standard https/http through; open tel:, mailto:, etc. externally
        if (scheme == 'https' || scheme == 'http') {
          return NavigationActionPolicy.ALLOW;
        }
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
        return NavigationActionPolicy.CANCEL;
      },
      onPermissionRequest: (controller, request) async {
        // Grant camera, mic, location to the web page
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
        // Open downloads in browser / system downloader
        final uri = Uri.parse(downloadRequest.url.toString());
        if (await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
      },
      onCreateWindow: (controller, createWindowAction) async {
        // Open new window links in external browser
        final uri = createWindowAction.request.url;
        if (uri != null && await canLaunchUrl(uri)) {
          await launchUrl(uri, mode: LaunchMode.externalApplication);
        }
        return false;
      },
    );
  }

  // ── Offline view ─────────────────────────────────────────────────────────────
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
              color: Colors.grey[900],
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.wifi_off_rounded,
                color: Color(0xFF00BFFF), size: 48),
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

  // ── Error view ───────────────────────────────────────────────────────────────
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
              color: Colors.red[950],
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.error_outline_rounded,
                color: Colors.red, size: 48),
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
              backgroundColor: const Color(0xFF00BFFF),
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  // ── Dev Settings overlay ─────────────────────────────────────────────────────
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
                Border.all(color: const Color(0xFF00BFFF).withOpacity(0.3)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Row(
                children: [
                  Icon(Icons.developer_mode, color: Color(0xFF00BFFF)),
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
                'This overlay is for development only. Remove in production.',
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
                        url += (url.contains('?') ? '&' : '?') + 'role=USER';
                      }
                      _saveAndNavigate(url);
                      setState(() => _showDevSettings = false);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00BFFF),
                      foregroundColor: Colors.black,
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
