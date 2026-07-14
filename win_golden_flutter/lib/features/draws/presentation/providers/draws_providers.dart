import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/draw_model.dart';
import '../../data/repositories/draws_repository.dart';

final drawsRepositoryProvider = Provider((ref) {
  return DrawsRepository(ref.watch(apiClientProvider));
});

final openDrawsProvider = FutureProvider<List<DrawModel>>((ref) async {
  return ref.watch(drawsRepositoryProvider).getOpenDraws();
});

final joiningDrawIdProvider = StateProvider<String?>((ref) => null);

class DrawsActions {
  final Ref ref;

  DrawsActions(this.ref);

  Future<DrawJoinResult> join(String drawId) async {
    ref.read(joiningDrawIdProvider.notifier).state = drawId;
    try {
      final result = await ref.read(drawsRepositoryProvider).joinDraw(drawId);
      if (result.remainingWallet != null) {
        ref.read(authProvider.notifier).updateUser({
          'entriesWallet': result.remainingWallet,
        });
      }
      ref.invalidate(openDrawsProvider);
      return result;
    } on DioException catch (e) {
      rethrow;
    } catch (_) {
      throw Exception('تعذّر الانضمام للسحب');
    } finally {
      ref.read(joiningDrawIdProvider.notifier).state = null;
    }
  }
}

final drawsActionsProvider = Provider((ref) => DrawsActions(ref));
