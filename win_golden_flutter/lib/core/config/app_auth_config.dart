/// Auth-related compile-time config — mirrors React `VITE_GOOGLE_CLIENT_ID` /
/// `VITE_ENABLE_GOOGLE`. Override with `--dart-define=GOOGLE_CLIENT_ID=...`.
abstract final class AppAuthConfig {
  /// Must match backend `GOOGLE_CLIENT_ID` (Web client ID) so `idToken` verifies.
  static const googleServerClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue:
        '633670526099-v251ssasbvldevqef0pmkngtc41tpb4j.apps.googleusercontent.com',
  );

  /// Mirrors `VITE_ENABLE_GOOGLE !== 'false'`.
  static const enableGoogle = bool.fromEnvironment(
    'ENABLE_GOOGLE',
    defaultValue: true,
  );

  static bool get isGoogleAuthAvailable =>
      enableGoogle && googleServerClientId.trim().isNotEmpty;
}
