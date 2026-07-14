import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/competition_model.dart';
import '../../data/repositories/competitions_repository.dart';

final competitionsRepositoryProvider = Provider((ref) {
  return CompetitionsRepository(ref.watch(apiClientProvider));
});

final competitionsListProvider =
    FutureProvider<List<CompetitionModel>>((ref) async {
  return ref.watch(competitionsRepositoryProvider).getCompetitions();
});

final competitionDetailProvider =
    FutureProvider.family<CompetitionModel, String>((ref, id) async {
  return ref.watch(competitionsRepositoryProvider).getById(id);
});

final featuredCompetitionsProvider =
    FutureProvider<List<CompetitionModel>>((ref) async {
  return ref.watch(competitionsRepositoryProvider).getFeaturedMerged();
});

void invalidateCompetitions(Ref ref) {
  ref.invalidate(competitionsListProvider);
  ref.invalidate(featuredCompetitionsProvider);
}
