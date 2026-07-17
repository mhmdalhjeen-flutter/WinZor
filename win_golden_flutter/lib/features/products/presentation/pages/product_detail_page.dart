import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chat/data/chat_context_store.dart';
import '../../../orders/presentation/widgets/direct_order_sheet.dart';
import '../../data/models/product_model.dart';
import '../providers/product_providers.dart';
import '../widgets/product_star_rating.dart';

/// React `ProductDetail.jsx` with direct-order (no cart UI).
class ProductDetailPage extends ConsumerStatefulWidget {
  final String id;

  const ProductDetailPage({super.key, required this.id});

  @override
  ConsumerState<ProductDetailPage> createState() => _ProductDetailPageState();
}

class _ProductDetailPageState extends ConsumerState<ProductDetailPage> {
  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg, style: const TextStyle(fontFamily: 'Cairo'))),
    );
  }

  Future<void> _orderNow(ProductModel product) async {
    if (!product.isAvailable) {
      _toast('هذا المنتج غير متاح حالياً');
      return;
    }
    await showDirectOrderSheet(
      context: context,
      ref: ref,
      itemId: product.id,
      itemType: 'product',
      title: product.name,
      unitPrice: product.price,
      currency: product.currency,
      imageUrl: product.imageUrl,
      storeName: product.storeName,
      maxQuantity: product.maxOrderQuantity,
    );
  }

  Future<void> _contact(ProductModel product) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      context.push('/login');
      return;
    }
    final ownerId = product.storeOwnerId;
    if (ownerId == null || ownerId.isEmpty) {
      _toast('لا يمكن التواصل');
      return;
    }
    await ChatContextStore.save({
      'recipientId': ownerId,
      'context': {
        'itemId': product.id,
        'itemType': 'Product',
        'itemName': product.name,
        if (product.imageUrl != null) 'itemImage': product.imageUrl,
      },
    });
    if (!mounted) return;
    context.push('/chat');
  }

  @override
  Widget build(BuildContext context) {
    final productAsync = ref.watch(productDetailProvider(widget.id));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: productAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) {
          final msg = e is DioException && e.response?.data is Map
              ? e.response?.data['message']?.toString()
              : null;
          return SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      msg?.isNotEmpty == true ? msg! : 'المنتج غير موجود',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w800,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => context.pop(),
                      child: const Text('رجوع', style: TextStyle(fontFamily: 'Cairo')),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
        data: (product) => _buildBody(product),
      ),
    );
  }

  Widget _buildBody(ProductModel product) {
    final imageUrl = product.imageUrl;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              Container(
                height: 256,
                width: double.infinity,
                decoration: const BoxDecoration(
                  color: Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(32),
                  ),
                ),
                clipBehavior: Clip.antiAlias,
                child: imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: imageUrl,
                        fit: BoxFit.cover,
                      )
                    : const Center(
                        child: Text(
                          'بدون صورة',
                          style: TextStyle(
                            color: Color(0xFF9CA3AF),
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: CircleAvatar(
                    backgroundColor: Colors.white.withOpacity(0.3),
                    child: IconButton(
                      icon: const Icon(LucideIcons.chevronRight, color: Colors.white),
                      onPressed: () {
                        if (context.canPop()) {
                          context.pop();
                        } else {
                          context.go('/');
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: Color(0xFF111827),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  CurrencyUtils.formatPrice(product.price, product.currency),
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: product.isAvailable
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        product.availabilityLabel,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Cairo',
                          color: product.isAvailable
                              ? const Color(0xFF166534)
                              : const Color(0xFFB91C1C),
                        ),
                      ),
                    ),
                    if (product.freeDelivery) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEEF2FF),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Text(
                          'توصيل مجاني',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Cairo',
                            color: Color(0xFF4338CA),
                          ),
                        ),
                      ),
                    ],
                    if (product.category != null &&
                        product.category!.trim().isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Text(
                        product.category!,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF9CA3AF),
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 12),
                ProductStarRating(
                  productId: product.id,
                  ratingAvg: product.ratingAvg,
                  ratingCount: product.ratingCount,
                ),
                if (product.description != null &&
                    product.description!.trim().isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                    ),
                    child: Text(
                      product.description!,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF4B5563),
                        fontFamily: 'Cairo',
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
                if (product.storeId != null) ...[
                  const SizedBox(height: 12),
                  Material(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    child: InkWell(
                      onTap: () => context.push('/store/${product.storeId}'),
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFF3F4F6)),
                        ),
                        child: Text(
                          'المتجر: ${product.storeName ?? 'عرض المتجر'}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            color: Color(0xFF1F2937),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: SizedBox(
                        height: 56,
                        child: ElevatedButton(
                          onPressed:
                              product.isAvailable ? () => _orderNow(product) : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            disabledBackgroundColor: const Color(0xFFD1D5DB),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.send, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'اطلب الآن',
                                style: TextStyle(
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 56,
                      height: 56,
                      child: OutlinedButton(
                        onPressed: () => _contact(product),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFF3F4F6), width: 2),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          padding: EdgeInsets.zero,
                        ),
                        child: const Icon(
                          LucideIcons.messageCircle,
                          size: 22,
                          color: Color(0xFF4B5563),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
