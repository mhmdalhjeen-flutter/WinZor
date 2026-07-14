import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/offer_providers.dart';
import '../../home/data/models/offer_model.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

final offerDetailProvider = FutureProvider.family<OfferModel, String>((ref, id) async {
  final repo = ref.watch(offerRepositoryProvider);
  
  // Analytics and Activity logging in background
  repo.getOfferDetail(id).then((offer) {
    repo.recordView(id);
    // logActivity('open_offer', ...) would go here if we had the general activity helper
  });

  return repo.getOfferDetail(id);
});

final offerRepositoryProvider = Provider((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OfferRepository(apiClient);
});

// For reusing the same repository
final isFavoritedProvider = StateProvider.family<bool, String>((ref, id) => false);
final favoritingBusyProvider = StateProvider.family<bool, String>((ref, id) => false);
