import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../providers/explore_providers.dart';
import '../../data/models/store_detail_response.dart';

final storeDetailProvider = FutureProvider.family<StoreDetailResponse, String>((ref, id) async {
  final repo = ref.watch(exploreRepositoryProvider);
  final detail = await repo.getStoreDetail(id);

  repo.logStoreVisit(id, detail.store.category, detail.store.region);

  return detail;
});

final memberPrizesProvider = FutureProvider.family<List<MemberPrize>, String>((ref, id) async {
  return ref.watch(exploreRepositoryProvider).getMemberPrizes(id);
});

final storeDetailTabProvider = StateProvider<String>((ref) => 'offers');
final joiningStoreProvider = StateProvider<bool>((ref) => false);

/// Per-store notification toggle (local prefs).
final storeNotificationEnabledProvider =
    StateNotifierProvider.family<StoreNotificationNotifier, bool, String>((ref, storeId) {
  return StoreNotificationNotifier(storeId);
});

class StoreNotificationNotifier extends StateNotifier<bool> {
  StoreNotificationNotifier(this.storeId)
      : super(LocalCacheService.isStoreNotificationEnabled(storeId));

  final String storeId;

  Future<void> setEnabled(bool enabled) async {
    state = enabled;
    await LocalCacheService.setStoreNotificationEnabled(storeId, enabled);
  }
}
