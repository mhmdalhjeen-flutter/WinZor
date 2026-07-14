import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../home/data/models/offer_model.dart';
import '../../data/repositories/offer_repository.dart';

final offerDetailProvider = FutureProvider.family<OfferModel, String>((ref, id) async {
  final repo = ref.watch(offerRepositoryProvider);

  // Analytics and Activity logging in background
  repo.getOfferDetail(id).then((offer) {
    repo.recordView(id);
  });

  return repo.getOfferDetail(id);
});

final offerRepositoryProvider = Provider((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OfferRepository(apiClient);
});
