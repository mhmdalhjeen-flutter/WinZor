import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../orders/presentation/widgets/direct_order_sheet.dart';
import '../providers/favorites_providers.dart';

/// React `Favorites.jsx` — offer favorites list (auth required).
class FavoritesPage extends ConsumerWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: ElevatedButton(
              onPressed: () => context.push('/login'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text(
                'تسجيل الدخول',
                style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ),
      );
    }

    final favoritesAsync = ref.watch(favoritesProvider);
    final ids = ref.watch(favoriteIdsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(favoritesProvider);
            await ref.read(favoritesProvider.future);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 16, 12),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/');
                          }
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFFF3F4F6)),
                        ),
                        icon: const Icon(LucideIcons.chevronRight, size: 20),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        LucideIcons.heart,
                        color: Colors.red,
                        size: 24,
                        fill: 1,
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'المفضّلة',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFF111827),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              ...favoritesAsync.when(
                loading: () => [
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(height: 10),
                          Text(
                            'جاري تحميل المفضّلة...',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                error: (e, _) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Text(
                              'تعذّر تحميل المفضّلة',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'Cairo',
                              ),
                            ),
                            const SizedBox(height: 12),
                            TextButton(
                              onPressed: () => ref.invalidate(favoritesProvider),
                              child: const Text(
                                'إعادة المحاولة',
                                style: TextStyle(fontFamily: 'Cairo'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
                data: (payload) {
                  final offers = payload.favorites
                      .where((o) {
                        final id = (o['_id'] ?? o['id'])?.toString() ?? '';
                        return id.isNotEmpty && ids.contains(id);
                      })
                      .toList();

                  if (offers.isEmpty) {
                    return [
                      const SliverFillRemaining(
                        hasScrollBody: false,
                        child: Center(
                          child: Text(
                            'لا توجد عروض في المفضّلة بعد',
                            style: TextStyle(
                              color: Color(0xFF9CA3AF),
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                      ),
                    ];
                  }

                  return [
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                          childAspectRatio: 0.62,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final offer = offers[index];
                            final id =
                                (offer['_id'] ?? offer['id'])?.toString() ?? '';
                            return _FavoriteOfferCard(
                              offer: offer,
                              favorited: ids.contains(id),
                              onToggleFavorite: () {
                                ref
                                    .read(favoritesActionsProvider)
                                    .removeFromFavoritesPage(offer);
                              },
                            );
                          },
                          childCount: offers.length,
                        ),
                      ),
                    ),
                  ];
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _FavoriteOfferCard extends ConsumerWidget {
  final Map<String, dynamic> offer;
  final bool favorited;
  final VoidCallback onToggleFavorite;

  const _FavoriteOfferCard({
    required this.offer,
    required this.favorited,
    required this.onToggleFavorite,
  });

  String get _id => (offer['_id'] ?? offer['id'])?.toString() ?? '';

  void _goDetails(BuildContext context) {
    if (_id.isEmpty) return;
    context.push('/offer/$_id');
  }

  Future<void> _orderNow(BuildContext context, WidgetRef ref) async {
    final pricing = offer['pricing'];
    final price = double.tryParse(
          (pricing is Map
                  ? pricing['finalPrice']
                  : offer['finalPrice'])
              ?.toString() ??
              '',
        ) ??
        0;
    final currency = (pricing is Map
                ? pricing['currency']
                : offer['currency'])
            ?.toString() ??
        'ILS';
    final store = offer['store'];
    final storeName =
        store is Map ? store['name']?.toString() : null;
    final storeId = store is Map
        ? (store['_id'] ?? store['id'] ?? '').toString()
        : store?.toString() ?? '';

    await showDirectOrderSheet(
      context: context,
      ref: ref,
      itemId: _id,
      itemType: 'offer',
      title: (offer['title'] ?? '').toString(),
      unitPrice: price,
      currency: currency,
      imageUrl: resolveOfferImage(offer),
      storeName: storeName,
      storeId: storeId,
    );
  }

  String _badge() {
    final pricing = offer['pricing'];
    if (pricing is Map && pricing['badge'] != null) {
      return pricing['badge'].toString();
    }
    final type = offer['offerType']?.toString();
    final value = offer['value'];
    switch (type) {
      case 'discount':
        return value != null ? 'خصم $value%' : 'خصم';
      case 'bogo':
        return '1+1';
      case 'free_item':
        return 'هدية';
      default:
        return 'عرض';
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final image = resolveOfferImage(offer);
    final title = (offer['title'] ?? '').toString();
    final store = offer['store'];
    final storeName =
        store is Map ? (store['name']?.toString() ?? 'متجر') : 'متجر';
    final region = store is Map ? store['region']?.toString() : null;
    final pricing = offer['pricing'];
    final oldPrice = pricing is Map
        ? pricing['originalPrice']
        : offer['originalPrice'];
    final newPrice =
        pricing is Map ? pricing['finalPrice'] : offer['finalPrice'];
    final showCompare = pricing is Map
        ? (pricing['showCompare'] == true || oldPrice != null)
        : oldPrice != null;
    final currency = (pricing is Map
                ? pricing['currency']
                : offer['currency'])
            ?.toString() ??
        'ILS';

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () => _goDetails(context),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF3F4F6)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AspectRatio(
                aspectRatio: 16 / 10,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (image != null && image.isNotEmpty)
                      AppImage(src: image, fit: BoxFit.cover)
                    else
                      Container(
                        color: const Color(0xFFF3F4F6),
                        child: const Icon(LucideIcons.image,
                            color: Colors.grey, size: 28),
                      ),
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          _badge(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      top: 8,
                      left: 8,
                      child: GestureDetector(
                        onTap: onToggleFavorite,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: favorited
                                ? Colors.red.withOpacity(0.9)
                                : Colors.black.withOpacity(0.4),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            LucideIcons.heart,
                            size: 15,
                            color: Colors.white,
                            fill: favorited ? 1.0 : 0.0,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(LucideIcons.tag,
                              size: 11, color: Colors.grey),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              storeName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 10,
                                color: Colors.grey,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ),
                          if (region != null) ...[
                            const Icon(LucideIcons.mapPin,
                                size: 11, color: Colors.grey),
                            const SizedBox(width: 2),
                            Text(
                              region,
                              style: const TextStyle(
                                fontSize: 10,
                                color: Colors.grey,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 6,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          if (showCompare && oldPrice != null)
                            Text(
                              CurrencyUtils.formatPrice(oldPrice, currency),
                              style: const TextStyle(
                                fontSize: 11,
                                color: Colors.grey,
                                decoration: TextDecoration.lineThrough,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          if (newPrice != null)
                            Text(
                              CurrencyUtils.formatPrice(newPrice, currency),
                              style: const TextStyle(
                                fontSize: 15,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                              ),
                            ),
                        ],
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 34,
                              child: ElevatedButton(
                                onPressed: () => _orderNow(context, ref),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  padding: EdgeInsets.zero,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: const Text(
                                  'اطلب الآن',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: SizedBox(
                              height: 34,
                              child: OutlinedButton(
                                onPressed: () => _goDetails(context),
                                style: OutlinedButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  side: const BorderSide(
                                      color: Color(0xFFE5E7EB)),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                ),
                                child: const Text(
                                  'التفاصيل',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    fontFamily: 'Cairo',
                                    color: Color(0xFF6B7280),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
