import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:dio/dio.dart';
import '../theme/app_colors.dart';
import '../utils/currency_utils.dart';
import '../utils/media_url.dart';
import '../../features/orders/presentation/widgets/direct_order_sheet.dart';
import '../widgets/app_image.dart';

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
    final storeId = store is Map
        ? (store['_id'] ?? store['id'] ?? '').toString()
        : store?.toString() ?? '';
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
      storeId: storeId,
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
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // 1. الصورة تأخذ المساحة المتبقية فقط (تمنع الـ Overflow عمودياً)
            Expanded(
              child: _buildImageSection(image, badge),
            ),
            
            // 2. قسم المعلومات (نصوص وأزرار) بمساحة ثابتة
            Container(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 10),
              color: Colors.white,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF111827),
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  _buildStoreAndRegion(storeName, region),
                  const SizedBox(height: 4),
                  _buildPriceDisplay(),
                  const SizedBox(height: 8),
                  _buildActions(context, ref),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageSection(String? image, String badge) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (image != null && image.isNotEmpty)
          AppImage(src: image, fit: BoxFit.cover)
        else
          Container(
            color: const Color(0xFFF3F4F6),
            child: const Icon(LucideIcons.image, color: Colors.grey, size: 28),
          ),
        Positioned(
          top: 8,
          right: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              badge,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                fontFamily: 'Cairo',
              ),
            ),
          ),
        ),
        if (onToggleFavorite != null)
          Positioned(
            top: 8,
            left: 8,
            child: GestureDetector(
              onTap: onToggleFavorite,
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: favorited ? Colors.red : Colors.black.withOpacity(0.4),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LucideIcons.heart,
                  size: 14,
                  color: Colors.white,
                  fill: favorited ? 1.0 : 0.0,
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildStoreAndRegion(String storeName, String? region) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Flexible(
          child: Row(
            children: [
              const Icon(LucideIcons.tag, size: 10, color: Colors.grey),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  storeName,
                  style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        if (region != null && region.isNotEmpty)
          Row(
            children: [
              const Icon(LucideIcons.mapPin, size: 10, color: Colors.grey),
              const SizedBox(width: 4),
              Text(region, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold)),
            ],
          ),
      ],
    );
  }

  Widget _buildActions(BuildContext context, WidgetRef ref) {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 28,
            child: ElevatedButton(
              onPressed: () => _orderNow(context, ref),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: EdgeInsets.zero,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.shoppingBag, size: 12),
                  SizedBox(width: 4),
                  Text('اطلب', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: SizedBox(
            height: 28,
            child: OutlinedButton(
              onPressed: () => _goDetails(context),
              style: OutlinedButton.styleFrom(
                padding: EdgeInsets.zero,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                side: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.eye, size: 12, color: Colors.grey),
                  SizedBox(width: 4),
                  Text('التفاصيل', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _getOfferBadge() {
    final pricing = offer['pricing'];
    if (pricing != null && pricing['badge'] != null) return pricing['badge'].toString();
    final type = offer['offerType'];
    final value = offer['value'];
    switch (type) {
      case 'discount': return value != null ? 'خصم $value%' : 'خصم';
      case 'bogo': return '1+1';
      case 'free_item': return 'هدية';
      default: return 'عرض';
    }
  }

  Widget _buildPriceDisplay() {
    final pricing = offer['pricing'];
    final oldPrice = pricing?['originalPrice'] ?? offer['originalPrice'];
    final newPrice = pricing?['finalPrice'] ?? offer['finalPrice'];
    final String currency = pricing?['currency']?.toString() ?? offer['currency']?.toString() ?? 'ILS';

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 6,
      children: [
        if (oldPrice != null && oldPrice != newPrice)
          Text(
            CurrencyUtils.formatPrice(oldPrice, currency),
            style: const TextStyle(fontSize: 10, color: Colors.grey, decoration: TextDecoration.lineThrough, fontWeight: FontWeight.bold),
          ),
        if (newPrice != null)
          Text(
            CurrencyUtils.formatPrice(newPrice, currency),
            style: const TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w900),
          ),
      ],
    );
  }
}
