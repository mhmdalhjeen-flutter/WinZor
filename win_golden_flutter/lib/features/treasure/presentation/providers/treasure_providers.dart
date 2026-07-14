import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/treasure_box_model.dart';
import '../../data/repositories/treasure_repository.dart';

final treasureRepositoryProvider = Provider((ref) {
  return TreasureRepository(ref.watch(apiClientProvider));
});

final availableTreasureBoxesProvider =
    FutureProvider<List<TreasureBoxModel>>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return [];
  return ref.watch(treasureRepositoryProvider).getAvailableBoxes();
});

final treasureOpeningIdProvider = StateProvider<String?>((ref) => null);

final treasureActionsProvider = Provider((ref) => TreasureActions(ref));

class TreasureActions {
  final Ref _ref;

  TreasureActions(this._ref);

  Future<({TreasureOpenResult? result, String? error, String? code})> openBox(
    String boxId,
  ) async {
    final auth = _ref.read(authProvider);
    if (!auth.isAuth) {
      return (result: null, error: 'يلزم تسجيل الدخول', code: null);
    }
    if (_ref.read(treasureOpeningIdProvider) != null) {
      return (result: null, error: null, code: null);
    }

    _ref.read(treasureOpeningIdProvider.notifier).state = boxId;
    try {
      final result =
          await _ref.read(treasureRepositoryProvider).openBox(boxId);
      _ref.invalidate(availableTreasureBoxesProvider);
      return (result: result, error: null, code: null);
    } on DioException catch (e) {
      final data = e.response?.data;
      String? msg;
      String? code;
      if (data is Map) {
        msg = data['message']?.toString();
        code = data['code']?.toString();
      }
      return (
        result: null,
        error: msg ?? 'تعذّر فتح الصندوق',
        code: code,
      );
    } catch (_) {
      return (result: null, error: 'تعذّر فتح الصندوق', code: null);
    } finally {
      _ref.read(treasureOpeningIdProvider.notifier).state = null;
    }
  }
}
