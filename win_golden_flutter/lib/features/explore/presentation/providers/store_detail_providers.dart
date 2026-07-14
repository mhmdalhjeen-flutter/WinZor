import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/explore_providers.dart';
import '../../data/models/store_detail_response.dart';

final storeDetailProvider = FutureProvider.family<StoreDetailResponse, String>((ref, id) async {
  final repo = ref.watch(exploreRepositoryProvider);
  
  // Log visit in background
  repo.getStoreDetail(id).then((data) {
    repo.logStoreVisit(id, data.store.category, data.store.region);
  });

  return repo.getStoreDetail(id);
});

final memberPrizesProvider = FutureProvider.family<List<MemberPrize>, String>((ref, id) async {
  return ref.watch(exploreRepositoryProvider).getMemberPrizes(id);
});

final storeDetailTabProvider = StateProvider<String>((ref) => 'offers');
final joiningStoreProvider = StateProvider<bool>((ref) => false);
