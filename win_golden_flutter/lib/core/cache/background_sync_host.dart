import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'background_sync_service.dart';
import 'connectivity_service.dart';

/// Triggers silent refresh when app resumes or connectivity returns.
class BackgroundSyncHost extends ConsumerStatefulWidget {
  final Widget child;

  const BackgroundSyncHost({super.key, required this.child});

  @override
  ConsumerState<BackgroundSyncHost> createState() => _BackgroundSyncHostState();
}

class _BackgroundSyncHostState extends ConsumerState<BackgroundSyncHost>
    with WidgetsBindingObserver {
  StreamSubscription<bool>? _connectivitySub;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(backgroundSyncServiceProvider).refreshLightweight();
      _connectivitySub = ref
          .read(connectivityServiceProvider)
          .onBackOnline
          .listen((_) {
        ref.read(backgroundSyncServiceProvider).refreshLightweight(force: true);
      });
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ref.read(backgroundSyncServiceProvider).refreshLightweight();
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
