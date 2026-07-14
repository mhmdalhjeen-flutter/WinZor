import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/repositories/wheel_repository.dart';
import '../../data/models/wheel_models.dart';

final wheelRepositoryProvider = Provider((ref) {
  return WheelRepository(ref.watch(apiClientProvider));
});

final wheelConfigProvider = FutureProvider<WheelConfig>((ref) async {
  return ref.watch(wheelRepositoryProvider).getConfig();
});

final wheelWinsProvider = FutureProvider<List<WheelWin>>((ref) async {
  return ref.watch(wheelRepositoryProvider).getMyWins();
});
