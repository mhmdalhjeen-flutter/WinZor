import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/cache/cache_keys.dart';
import '../../../../core/cache/cached_fetch.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/point_sources.dart';
import '../../data/models/user_center_models.dart';
import '../../data/repositories/user_center_repository.dart';

final userCenterRepositoryProvider = Provider((ref) {
  return UserCenterRepository(ref.watch(apiClientProvider));
});

final userCenterProvider = AsyncNotifierProvider<UserCenterNotifier, UserCenterData>(
  UserCenterNotifier.new,
);

class UserCenterNotifier extends AsyncNotifier<UserCenterData> {
  @override
  Future<UserCenterData> build() async {
    return CachedFetch.load<UserCenterData>(
      key: CacheKeys.userCenterData,
      staleAfter: const Duration(minutes: 15),
      network: () async {
        final data = await ref.read(userCenterRepositoryProvider).getCenter();
        ref.read(authProvider.notifier).updateUser({
          'name': data.user.name,
          'avatar': data.user.avatar,
          'points': data.user.points,
          'codesUsed': data.user.codesUsed,
          'referralCode': data.user.referralCode,
          'phone': data.user.phone,
          'email': data.user.email,
        });
        return data;
      },
      fromCache: (raw) => UserCenterData.fromJson(
        Map<String, dynamic>.from(raw as Map),
      ),
      toCache: (data) => _serializeCenter(data),
      onBackgroundRefresh: (fresh) {
        ref.read(authProvider.notifier).updateUser({
          'name': fresh.user.name,
          'avatar': fresh.user.avatar,
          'points': fresh.user.points,
        });
        state = AsyncData(fresh);
      },
    );
  }

  Map<String, dynamic> _serializeCenter(UserCenterData data) {
    return {
      'user': {
        '_id': data.user.id,
        'name': data.user.name,
        'email': data.user.email,
        'phone': data.user.phone,
        'avatar': data.user.avatar,
        'points': data.user.points,
        'referralCode': data.user.referralCode,
        'codesUsed': data.user.codesUsed,
        'preferences': data.user.preferences.toPayload(),
      },
      'level': {
        'stage': {'label': data.level.stage.label},
        'progress': data.level.progress,
        'pointsToNext': data.level.pointsToNext,
      },
      'stats': {
        'points': data.stats.points,
        'competitionsJoined': data.stats.competitionsJoined,
        'prizesWon': data.stats.prizesWon,
        'referralsCount': data.stats.referralsCount,
        'membershipsCount': data.stats.membershipsCount,
        'codesUsed': data.stats.codesUsed,
        'promoCodesRedeemed': data.stats.promoCodesRedeemed,
      },
      'legal': {
        'terms': data.legal.terms,
        'privacy': data.legal.privacy,
        'disclaimer': data.legal.disclaimer,
      },
    };
  }
}

final platformSettingsProvider = FutureProvider<PlatformSettings>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getPlatformSettings();
});

final recentPointSourcesProvider =
    AsyncNotifierProvider<RecentPointSourcesNotifier, List<PointSourceItem>>(
  RecentPointSourcesNotifier.new,
);

class RecentPointSourcesNotifier extends AsyncNotifier<List<PointSourceItem>> {
  @override
  Future<List<PointSourceItem>> build() async {
    return CachedFetch.load<List<PointSourceItem>>(
      key: CacheKeys.recentPointSources,
      staleAfter: const Duration(minutes: 10),
      network: () => ref.read(userCenterRepositoryProvider).getRecentPointSources(limit: 5),
      fromCache: (raw) => (raw as List)
          .map((e) => PointSourceItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList(),
      toCache: (list) => list.map((e) => e.toJson()).toList(),
      onBackgroundRefresh: (fresh) => state = AsyncData(fresh),
    );
  }
}

final centerCompetitionsProvider = FutureProvider<List<CenterCompetition>>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getCompetitions();
});

final achievementsProvider = FutureProvider<List<AchievementMilestone>>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getAchievements();
});

final flatRegionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getFlatRegions();
});

final storeFlatCategoriesProvider = FutureProvider<List<FlatCategory>>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getFlatCategories('store');
});

final productFlatCategoriesProvider = FutureProvider<List<FlatCategory>>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getFlatCategories('product');
});
