import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../data/models/product_model.dart';
import '../../data/repositories/product_repository.dart';

final productRepositoryProvider = Provider((ref) {
  return ProductRepository(ref.watch(apiClientProvider));
});

final productDetailProvider =
    FutureProvider.family<ProductModel, String>((ref, id) async {
  final repo = ref.watch(productRepositoryProvider);
  final product = await repo.getProduct(id);
  // Background activity log (matches React).
  repo.logView(product);
  return product;
});
