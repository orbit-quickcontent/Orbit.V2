class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:5000',
  );

  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'http://10.0.2.2:3003',
  );

  static const String osrmUrl = String.fromEnvironment(
    'OSRM_URL',
    defaultValue: 'https://router.project-osrm.org',
  );

  static const String osmTileUrl = String.fromEnvironment(
    'OSM_TILE_URL',
    defaultValue: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  );

  static const String appPackageName = 'com.orbit.app';
}
