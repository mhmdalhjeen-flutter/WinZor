import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../utils/currency_utils.dart';
import '../utils/media_url.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/orders/presentation/widgets/direct_order_sheet.dart';
import 'app_image.dart';

/// React `OfferCard` — details navigation + direct order (cart UI removed).
class OfferCard extends ConsumerWidget {
  final Map<String, dynamic> offer;
  final bool favorited;
  final VoidCallback? onToggleFavorite;

  const OfferCard({
    super.key,
    required this.offer,
    this.favorited = false,
    this.onToggleFavorite,
  });

  String get _id => (offer['_id'] ?? offer['id'] ?? '').toString();

  void _goDetails(BuildContext context) {
    if (_id.isEmpty) return;
    context.push('/offer/$_id');
  }

  Future<void> _orderNow(BuildContext context, WidgetRef ref) async {
    if (_id.isEmpty) return;
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      context.push('/login');
      return;
    }

    final pricing = offer['pricing'];
    final unit = (pricing is Map
            ? (pricing['finalPrice'] ?? pricing['unitPrice'])
            : null) ??
        offer['finalPrice'] ??
        offer['price'] ??
        0;
    final currency = (pricing is Map ? pricing['currency'] : null) ??
        offer['currency'] ??
        'ILS';
    final store = offer['store'];
    final storeName = store is Map ? store['name']?.toString() : null;
    final image = resolveOfferImage(offer);

    await showDirectOrderSheet(
      context: context,
      ref: ref,
      itemId: _id,
      itemType: 'offer',
      title: (offer['title'] ?? '').toString(),
      unitPrice: double.tryParse(unit.toString()) ?? 0,
      currency: currency.toString(),
      imageUrl: image,
      storeName: storeName,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String? image = resolveOfferImage(offer);
    final String title = offer['title']?.toString() ?? '';
    final String storeName = offer['store'] is Map
        ? (offer['store']['name']?.toString() ?? 'متجر')
        : 'متجر';
    final String? region =
        offer['store'] is Map ? offer['store']['region']?.toString() : null;
    final String badge = _getOfferBadge();

    return GestureDetector(
      onTap: () => _goDetails(context),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (image != null && image.isNotEmpty)
                    AppImage(src: image, fit: BoxFit.cover)
                  else
                    Container(
                      color: const Color(0xFFF3F4F6),
                      child: const Icon(LucideIcons.image,
                          color: Colors.grey, size: 32),
                    ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        badge,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                  ),
                  if (onToggleFavorite != null)
                    Positioned(
                      top: 10,
                      left: 10,
                      child: GestureDetector(
                        onTap: onToggleFavorite,
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: favorited
                                ? Colors.red
                                : Colors.black.withOpacity(0.4),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            LucideIcons.heart,
                            size: 16,
                            color: Colors.white,
                            fill: favorited ? 1.0 : 0.0,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.tag,
                              size: 11, color: Colors.grey),
                          const SizedBox(width: 4),
                          Text(
                            storeName,
                            style: const TextStyle(
                                fontSize: 10,
                                color: Colors.grey,
                                fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                      if (region != null && region.isNotEmpty)
                        Row(
                          children: [
                            const Icon(LucideIcons.mapPin,
                                size: 11, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              region,
                              style: const TextStyle(
                                  fontSize: 10,
                                  color: Colors.grey,
                                  fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  _buildPriceDisplay(),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => _orderNow(context, ref),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.shoppingBag, size: 14),
                              SizedBox(width: 4),
                              Text('اطلب',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => _goDetails(context),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            side: const BorderSide(color: Color(0xFFE5E7EB)),
                          ),
                          child: const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(LucideIcons.eye,
                                  size: 14, color: Colors.grey),
                              SizedBox(width: 4),
                              Text(
                                'التفاصيل',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: Colors.grey,
                                ),
                              ),
                            ],
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
      ),
    );
  }

  String _getOfferBadge() {
    final pricing = offer['pricing'];
    if (pricing != null && pricing['badge'] != null) {
      return pricing['badge'].toString();
    }
    final type = offer['offerType'];
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

  Widget _buildPriceDisplay() {
    final pricing = offer['pricing'];
    final oldPrice = pricing?['originalPrice'] ?? offer['originalPrice'];
    final newPrice = pricing?['finalPrice'] ?? offer['finalPrice'];
    final bool showCompare = pricing?['showCompare'] ?? (oldPrice != null);
    final String currency =
        pricing?['currency']?.toString() ?? offer['currency']?.toString() ?? 'ILS';

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      children: [
        if (showCompare && oldPrice != null)
          Text(
            CurrencyUtils.formatPrice(oldPrice, currency),
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
              decoration: TextDecoration.lineThrough,
              fontWeight: FontWeight.bold,
            ),
          ),
        if (newPrice != null)
          Text(
            CurrencyUtils.formatPrice(newPrice, currency),
            style: const TextStyle(
              fontSize: 18,
              color: AppColors.primary,
              fontWeight: FontWeight.w900,
            ),
          ),
      ],
    );
  }
}
