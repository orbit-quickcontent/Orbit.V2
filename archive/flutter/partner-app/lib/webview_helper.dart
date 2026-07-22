import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

Widget buildWebView(BuildContext context, WebViewController controller, String url) {
  return WebViewWidget(controller: controller);
}
