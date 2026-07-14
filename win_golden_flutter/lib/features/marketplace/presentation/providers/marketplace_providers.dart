import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/bazaar_listing_model.dart';
import '../../data/repositories/marketplace_repository.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../../core/models/hierarchy_node.dart';

final marketplaceRepositoryProvider = Provider((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return MarketplaceRepository(apiClient);
});

// Filters
final marketplaceRegionPathProvider = StateProvider<List<String>>((ref) => []);
final marketplaceConditionProvider = StateProvider<String?>((ref) => null);
final marketplaceCategoryProvider = StateProvider<String?>((ref) => null);
final marketplaceActiveTabProvider = StateProvider<String>((ref) => 'sellExchange');

// Browse Listings
final bazaarBrowseProvider = FutureProvider<List<BazaarListingModel>>((ref) async {
  final repo = ref.watch(marketplaceRepositoryProvider);
  final regionPath = ref.watch(marketplaceRegionPathProvider);
  final condition = ref.watch(marketplaceConditionProvider);
  final category = ref.watch(marketplaceCategoryProvider);

  final regionId = regionPath.isNotEmpty ? regionPath.last : null;

  return repo.getListings(
    regionId: regionId,
    condition: condition,
    category: category,
  );
});

// My Listings
final myBazaarListingsProvider = FutureProvider<List<BazaarListingModel>>((ref) async {
  return ref.watch(marketplaceRepositoryProvider).getMyListings();
});

// Favorite Listings
final favoriteBazaarListingsProvider = FutureProvider<List<BazaarListingModel>>((ref) async {
  return ref.watch(marketplaceRepositoryProvider).getFavoriteListings();
});

// Meta info (points cost, etc.)
final bazaarMetaProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  return ref.watch(marketplaceRepositoryProvider).getBazaarMeta();
});

final favoritingPulseProvider = StateProvider<String?>((ref) => null);
