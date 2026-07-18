import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService();
  ref.onDispose(service.dispose);
  return service;
});

/// Online/offline signal for background sync.
class ConnectivityService {
  ConnectivityService() {
    _subscription = Connectivity().onConnectivityChanged.listen((result) {
      final online = _isOnline(result);
      if (online && !_wasOnline) {
        _onlineController.add(true);
      }
      _wasOnline = online;
    });
    Connectivity().checkConnectivity().then((result) {
      _wasOnline = _isOnline(result);
    });
  }

  final _onlineController = StreamController<bool>.broadcast();
  Stream<bool> get onBackOnline => _onlineController.stream;

  StreamSubscription<ConnectivityResult>? _subscription;
  bool _wasOnline = true;

  Future<bool> get isOnline async {
    final result = await Connectivity().checkConnectivity();
    return _isOnline(result);
  }

  bool _isOnline(ConnectivityResult result) =>
      result == ConnectivityResult.mobile ||
      result == ConnectivityResult.wifi ||
      result == ConnectivityResult.ethernet ||
      result == ConnectivityResult.vpn;

  void dispose() {
    _subscription?.cancel();
    _onlineController.close();
  }
}
