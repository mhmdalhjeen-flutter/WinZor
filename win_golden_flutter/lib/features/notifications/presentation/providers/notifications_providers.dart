import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/notification_model.dart';
import '../../data/repositories/notifications_repository.dart';

final notificationsRepositoryProvider = Provider((ref) {
  return NotificationsRepository(ref.watch(apiClientProvider));
});

/// Header badge — React `queryKeys.unreadNotifications` + GET /notifications/unread-count
final unreadNotificationsCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return 0;
  return ref.watch(notificationsRepositoryProvider).getUnreadCount();
});

class NotificationsListState {
  final List<NotificationModel> items;
  final bool isLoading;
  final String? error;

  const NotificationsListState({
    this.items = const [],
    this.isLoading = false,
    this.error,
  });

  NotificationsListState copyWith({
    List<NotificationModel>? items,
    bool? isLoading,
    String? error,
    bool clearError = false,
  }) {
    return NotificationsListState(
      items: items ?? this.items,
      isLoading: isLoading ?? this.isLoading,
      error: clearError ? null : (error ?? this.error),
    );
  }

  bool get hasUnread => items.any((n) => !n.read);
}

class NotificationsListNotifier extends StateNotifier<NotificationsListState> {
  final Ref _ref;

  NotificationsListNotifier(this._ref) : super(const NotificationsListState());

  NotificationsRepository get _repo => _ref.read(notificationsRepositoryProvider);

  Future<void> load() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final items = await _repo.getNotifications();
      state = NotificationsListState(items: items, isLoading: false);
    } on DioException catch (e) {
      final message = e.response?.data is Map
          ? e.response?.data['message']?.toString()
          : null;
      state = NotificationsListState(
        items: state.items,
        isLoading: false,
        error: message?.isNotEmpty == true ? message : 'تعذّر تحميل الإشعارات',
      );
    } catch (_) {
      state = NotificationsListState(
        items: state.items,
        isLoading: false,
        error: 'تعذّر تحميل الإشعارات',
      );
    }
  }

  Future<void> markAllRead() async {
    try {
      await _repo.markAllRead();
      state = state.copyWith(
        items: state.items.map((n) => n.copyWith(read: true)).toList(),
      );
      _ref.invalidate(unreadNotificationsCountProvider);
    } catch (_) {
      /* تجاهل — matches React */
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _repo.markRead(id);
      state = state.copyWith(
        items: state.items
            .map((n) => n.id == id ? n.copyWith(read: true) : n)
            .toList(),
      );
      _ref.invalidate(unreadNotificationsCountProvider);
    } catch (_) {
      /* تجاهل — matches React */
    }
  }
}

final notificationsListProvider =
    StateNotifierProvider.autoDispose<NotificationsListNotifier, NotificationsListState>((ref) {
  final notifier = NotificationsListNotifier(ref);
  final auth = ref.watch(authProvider);
  if (auth.isAuth) {
    Future.microtask(() => notifier.load());
  }
  return notifier;
});
