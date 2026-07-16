import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/app_image.dart';

class MarketplaceOfferCard extends StatelessWidget {
  final dynamic item;
  final String? topBadge;
  final VoidCallback? onTap;

  const MarketplaceOfferCard({
    super.key,
    required this.item,
    this.topBadge,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Map<String, dynamic> map = item is Map<String, dynamic> 
        ? item as Map<String, dynamic> 
        : Map<String, dynamic>.from(item as Map);

    final String? image = resolveOfferImage(map) ?? 
                          resolveProductImage(map) ?? 
                          resolveImageUrl(map['image']?.toString());
    
    final store = map['store'] is Map ? Map<String, dynamic>.from(map['store'] as Map) : null;
    final String? storeLogo = resolveStoreLogo(store);
    final String storeName = store?['name']?.toString() ?? 'متجر';
    final bool isVerified = store?['isVerifiedStore'] == true;
    final String title = map['title']?.toString() ?? map['name']?.toString() ?? '';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 160,
        margin: const EdgeInsets.only(left: 12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (image != null && image.isNotEmpty)
                    AppImage(
                      src: image,
                      fit: BoxFit.cover,
                    )
                  else
                    _buildPlaceholder(),
                  
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.6),
                          ],
                          stops: const [0.6, 1.0],
                        ),
                      ),
                    ),
                  ),

                  if (storeLogo != null)
                    Positioned(
                      bottom: 8,
                      left: 8,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                        clipBehavior: Clip.antiAlias,
                        child: AppImage(src: storeLogo, fit: BoxFit.cover),
                      ),
                    ),
                  
                  Positioned(
                    top: 8,
                    right: 8,
                    child: _buildBadge(map),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          storeName,
                          style: const TextStyle(
                            fontSize: 10,
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (isVerified) ...[
                        const SizedBox(width: 4),
                        const Icon(Icons.verified, color: Colors.blue, size: 12),
                      ],
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                      fontFamily: 'Cairo',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  _buildPriceDisplay(map),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFFF3F4F6),
      child: const Icon(Icons.image_not_supported_outlined, color: Colors.grey, size: 32),
    );
  }

  Widget _buildBadge(Map<String, dynamic> map) {
    String badgeText = topBadge ?? _getOfferBadge(map);
    if (badgeText.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: topBadge != null ? const Color(0xFF7C3AED) : AppColors.primary,
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        badgeText,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 9,
          fontWeight: FontWeight.w900,
          fontFamily: 'Cairo',
        ),
      ),
    );
  }

  String _getOfferBadge(Map<String, dynamic> map) {
    final pricing = map['pricing'];
    if (pricing?['badge'] != null) return pricing['badge'].toString();
    
    final type = map['offerType']?.toString();
    final value = map['value'];
    final currency = map['currency']?.toString();

    switch (type) {
      case 'discount':
        return value != null ? 'خصم $value%' : 'خصم';
      case 'fixed_price':
        return 'سعر خاص';
      case 'fixed_discount':
        return value != null ? 'خصم $value ${CurrencyUtils.getCurrencySymbol(currency)}' : 'خصم ثابت';
      case 'bogo':
        return '1+1';
      case 'free_item':
        return 'هدية';
      default:
        return '';
    }
  }

  Widget _buildPriceDisplay(Map<String, dynamic> map) {
    final pricing = map['pricing'];
    final oldPrice = (pricing?['originalPrice'] ?? map['originalPrice'])?.toDouble();
    final newPrice = (pricing?['finalPrice'] ?? map['finalPrice'])?.toDouble();
    final String currency = (pricing?['currency'] ?? map['currency'] ?? 'ILS').toString();

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 6,
      children: [
        if (oldPrice != null && oldPrice > (newPrice ?? 0))
          Text(
            CurrencyUtils.formatPrice(oldPrice, currency),
            style: const TextStyle(
              fontSize: 10,
              color: Colors.grey,
              decoration: TextDecoration.lineThrough,
              fontWeight: FontWeight.bold,
            ),
          ),
        if (newPrice != null)
          Text(
            CurrencyUtils.formatPrice(newPrice, currency),
            style: const TextStyle(
              fontSize: 14,
              color: AppColors.primary,
              fontWeight: FontWeight.w900,
            ),
          ),
      ],
    );
  }
}
