import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../../core/cache/store_notification_filter.dart';
import '../../data/models/notification_model.dart';
import '../providers/notifications_providers.dart';

const _pointNotifTypes = {'order_point_gift', 'referral_batch'};

/// React `NotificationListener.jsx` — one-shot poll for unread point toasts.
class NotificationListenerHost extends ConsumerStatefulWidget {
  final Widget child;

  const NotificationListenerHost({super.key, required this.child});

  @override
  ConsumerState<NotificationListenerHost> createState() =>
      _NotificationListenerHostState();
}

class _NotificationListenerHostState extends ConsumerState<NotificationListenerHost> {
  final Set<String> _seenIds = {};
  String? _polledForToken;

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (prev, next) {
      if (!next.isAuth) {
        _polledForToken = null;
        return;
      }
      _schedulePollIfNeeded(next.token);
    });

    final auth = ref.watch(authProvider);
    if (auth.isAuth) {
      _schedulePollIfNeeded(auth.token);
    }

    return widget.child;
  }

  void _schedulePollIfNeeded(String? token) {
    if (token == null || token.isEmpty || token == _polledForToken) return;
    _polledForToken = token;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _poll();
    });
  }

  Future<void> _poll() async {
    try {
      final list = await ref.read(notificationsRepositoryProvider).getNotifications(
        params: {'unread': 'true', 'limit': 15},
      );
      var hasNewPoint = false;

      for (final NotificationModel n in list) {
        if (!StoreNotificationFilter.shouldDisplay(n)) continue;
        if (!_pointNotifTypes.contains(n.type) || _seenIds.contains(n.id)) {
          continue;
        }
        _seenIds.add(n.id);
        hasNewPoint = true;
        if (!mounted) continue;
        final msg = n.body.isNotEmpty ? n.body : n.title;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              msg,
              style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700),
            ),
            backgroundColor: const Color(0xFF059669),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }

      if (hasNewPoint) {
        while (_seenIds.length > 80) {
          _seenIds.remove(_seenIds.first);
        }
        ref.invalidate(unreadNotificationsCountProvider);
        ref.invalidate(notificationsListProvider);
        await _refreshMePoints();
      }
    } catch (_) {
      /* تجاهل أخطاء الشبكة */
    }
  }

  /// Matches React invalidating `queryKeys.me` after point notifications.
  Future<void> _refreshMePoints() async {
    try {
      final res = await ref.read(apiClientProvider).dio.get('/users/me');
      final data = res.data;
      if (data is! Map) return;
      final pts = data['points'] ?? (data['user'] is Map ? data['user']['points'] : null);
      final energy = data['energy'] ?? (data['user'] is Map ? data['user']['energy'] : null);
      final patch = <String, dynamic>{};
      if (pts != null) patch['points'] = pts;
      if (energy != null) patch['energy'] = energy;
      if (patch.isNotEmpty) {
        ref.read(authProvider.notifier).updateUser(patch);
      }
    } catch (_) {}
  }
}
