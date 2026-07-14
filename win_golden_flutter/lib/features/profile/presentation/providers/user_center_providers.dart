import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/point_sources.dart';
import '../../data/models/user_center_models.dart';
import '../../data/repositories/user_center_repository.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

final userCenterRepositoryProvider = Provider((ref) {
  return UserCenterRepository(ref.watch(apiClientProvider));
});

final userCenterProvider = FutureProvider<UserCenterData>((ref) async {
  final data = await ref.watch(userCenterRepositoryProvider).getCenter();
  // Keep auth user cache in sync (React updateUser on center fetch).
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
});

final platformSettingsProvider = FutureProvider<PlatformSettings>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getPlatformSettings();
});

final recentPointSourcesProvider = FutureProvider<List<PointSourceItem>>((ref) async {
  return ref.watch(userCenterRepositoryProvider).getRecentPointSources(limit: 3);
});

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
