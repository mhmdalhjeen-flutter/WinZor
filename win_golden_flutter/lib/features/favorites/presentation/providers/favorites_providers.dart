import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/repositories/favorites_repository.dart';

final favoritesRepositoryProvider = Provider((ref) {
  return FavoritesRepository(ref.watch(apiClientProvider));
});

/// Server favorites cache — requires auth (matches React protected route).
final favoritesProvider =
    FutureProvider<FavoritesPayload>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuth) return FavoritesPayload.empty;
  return ref.watch(favoritesRepositoryProvider).getFavorites();
});

/// Optimistic favorite-id override (null = use server cache).
final favoriteIdsOverrideProvider =
    StateProvider<Set<String>?>((ref) => null);

final favoritingBusyProvider =
    StateProvider.family<bool, String>((ref, id) => false);

/// Effective favorited offer ids.
final favoriteIdsProvider = Provider<Set<String>>((ref) {
  final override = ref.watch(favoriteIdsOverrideProvider);
  if (override != null) return override;
  final data = ref.watch(favoritesProvider).asData?.value;
  return data?.favoriteIds ?? const {};
});

final isOfferFavoritedProvider = Provider.family<bool, String>((ref, id) {
  return ref.watch(favoriteIdsProvider).contains(id);
});

final favoritesActionsProvider = Provider((ref) {
  return FavoritesActions(ref);
});

class FavoritesActions {
  final Ref _ref;

  FavoritesActions(this._ref);

  Set<String> _baseIds() {
    final override = _ref.read(favoriteIdsOverrideProvider);
    if (override != null) return Set<String>.from(override);
    return Set<String>.from(
      _ref.read(favoritesProvider).asData?.value.favoriteIds ?? const {},
    );
  }

  /// Toggle heart (Home / Offer Detail). Optimistic; reverts on error.
  Future<bool> toggle(String offerId) async {
    final auth = _ref.read(authProvider);
    if (!auth.isAuth) return false;

    final id = offerId.toString();
    if (_ref.read(favoritingBusyProvider(id))) return false;

    _ref.read(favoritingBusyProvider(id).notifier).state = true;
    final next = _baseIds();
    final wasFav = next.contains(id);
    if (wasFav) {
      next.remove(id);
    } else {
      next.add(id);
    }
    _ref.read(favoriteIdsOverrideProvider.notifier).state = next;

    try {
      await _ref.read(favoritesRepositoryProvider).toggleFavorite(id);
      _ref.invalidate(favoritesProvider);
      await _ref.read(favoritesProvider.future);
      _ref.read(favoriteIdsOverrideProvider.notifier).state = null;
      return !wasFav;
    } catch (_) {
      _ref.read(favoriteIdsOverrideProvider.notifier).state = null;
      return wasFav;
    } finally {
      _ref.read(favoritingBusyProvider(id).notifier).state = false;
    }
  }

  /// Favorites page: unfavorite + remove card from list optimistically.
  Future<void> removeFromFavoritesPage(Map<String, dynamic> offer) async {
    final auth = _ref.read(authProvider);
    if (!auth.isAuth) return;

    final id = (offer['_id'] ?? offer['id'])?.toString() ?? '';
    if (id.isEmpty) return;

    final next = _baseIds()..remove(id);
    _ref.read(favoriteIdsOverrideProvider.notifier).state = next;

    try {
      await _ref.read(favoritesRepositoryProvider).toggleFavorite(id);
      _ref.invalidate(favoritesProvider);
      await _ref.read(favoritesProvider.future);
      _ref.read(favoriteIdsOverrideProvider.notifier).state = null;
    } catch (_) {
      _ref.read(favoriteIdsOverrideProvider.notifier).state = null;
      _ref.invalidate(favoritesProvider);
    }
  }
}
