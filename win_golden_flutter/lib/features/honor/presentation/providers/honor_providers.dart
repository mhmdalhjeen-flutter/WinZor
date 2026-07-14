import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/honor_item_model.dart';
import '../../data/models/points_leaderboard_model.dart';
import '../../data/repositories/honor_repository.dart';

final honorRepositoryProvider = Provider((ref) {
  return HonorRepository(ref.watch(apiClientProvider));
});

final honorBoardProvider = FutureProvider<List<HonorItemModel>>((ref) async {
  return ref.watch(honorRepositoryProvider).getActiveItems();
});

final pointsLeaderboardProvider = FutureProvider<PointsLeaderboard>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) {
    return const PointsLeaderboard(top: []);
  }
  return ref.watch(honorRepositoryProvider).getPointsLeaderboard();
});
