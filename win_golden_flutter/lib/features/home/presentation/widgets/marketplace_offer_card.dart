import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/app_image.dart';

/// Home rail offer/product card — portrait media with overlay info.
///
/// Sized from the horizontal ListView's cross-axis height (not a fixed width
/// + AspectRatio), so it never overflows the rail viewport.
class MarketplaceOfferCard extends StatelessWidget {
  final dynamic item;
  final String? topBadge;
  final VoidCallback? onTap;

  /// Target width as a fraction of screen; height comes from the parent rail.
  final double? preferredWidth;

  const MarketplaceOfferCard({
    super.key,
    required this.item,
    this.topBadge,
    this.onTap,
    this.preferredWidth,
  });

  static const aspectRatio = 9 / 14.4;

  @override
  Widget build(BuildContext context) {
    final Map<String, dynamic> map = item is Map<String, dynamic>
        ? item as Map<String, dynamic>
        : Map<String, dynamic>.from(item as Map);

    final String? image = resolveOfferImage(map) ??
        resolveProductImage(map) ??
        resolveImageUrl(map['image']?.toString());

    final store = map['store'] is Map
        ? Map<String, dynamic>.from(map['store'] as Map)
        : null;
    final String? storeLogo = resolveStoreLogo(store);
    final String storeName = store?['name']?.toString() ?? 'متجر';
    final bool isVerified = store?['isVerifiedStore'] == true;
    final String title =
        map['title']?.toString() ?? map['name']?.toString() ?? '';

    return LayoutBuilder(
      builder: (context, constraints) {
        // Horizontal ListView gives a finite maxHeight (= rail cross-axis).
        final maxH = constraints.maxHeight;
        final screenW = MediaQuery.sizeOf(context).width;
        final targetW = preferredWidth ??
            ((screenW - 5 - 12) / 1.5).clamp(180.0, 280.0);

        // Fit inside the rail: prefer target width, shrink if height is tight.
        final heightFromWidth = targetW / aspectRatio;
        final double cardH;
        final double cardW;
        if (maxH.isFinite && heightFromWidth > maxH) {
          cardH = maxH;
          cardW = cardH * aspectRatio;
        } else {
          cardW = targetW;
          cardH = heightFromWidth;
        }

        return Padding(
          padding: const EdgeInsetsDirectional.only(start: 12),
          child: GestureDetector(
            onTap: onTap,
            child: SizedBox(
              width: cardW,
              height: cardH,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(18),
                  color: const Color(0xFFF5F3F0),
                  border: Border.all(color: Colors.black.withOpacity(0.06)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      if (image != null && image.isNotEmpty)
                        AppImage(src: image, fit: BoxFit.cover)
                      else
                        _buildPlaceholder(),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.bottomCenter,
                            end: Alignment.topCenter,
                            colors: [
                              Color(0xEB000000),
                              Color(0x73000000),
                              Colors.transparent,
                            ],
                            stops: [0.0, 0.4, 0.7],
                          ),
                        ),
                      ),
                      if (storeLogo != null)
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border:
                                  Border.all(color: Colors.white, width: 2),
                              color: Colors.white,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.15),
                                  blurRadius: 8,
                                ),
                              ],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child:
                                AppImage(src: storeLogo, fit: BoxFit.cover),
                          ),
                        ),
                      Positioned(
                        top: 10,
                        right: 10,
                        child: _buildBadge(map),
                      ),
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: _buildOverlayInfo(
                            storeName: storeName,
                            isVerified: isVerified,
                            title: title,
                            map: map,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  /// Overlay column is height-bounded by the card; title uses Flexible so
  /// long copy never blows past the portrait frame.
  Widget _buildOverlayInfo({
    required String storeName,
    required bool isVerified,
    required String title,
    required Map<String, dynamic> map,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Flexible(
              child: Text(
                storeName,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withOpacity(0.92),
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                  shadows: const [
                    Shadow(color: Colors.black54, blurRadius: 4),
                  ],
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (isVerified) ...[
              const SizedBox(width: 4),
              const Icon(Icons.verified, color: Color(0xFF60A5FA), size: 14),
            ],
          ],
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: Colors.white,
            fontFamily: 'Cairo',
            height: 1.2,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 6),
        _buildPriceDisplay(map),
      ],
    );
  }

  Widget _buildPlaceholder() {
    return const ColoredBox(
      color: Color(0xFFF3F4F6),
      child: Center(
        child: Icon(
          Icons.image_not_supported_outlined,
          color: Colors.grey,
          size: 32,
        ),
      ),
    );
  }

  Widget _buildBadge(Map<String, dynamic> map) {
    final String badgeText = topBadge ?? _getOfferBadge(map);
    if (badgeText.isEmpty) return const SizedBox.shrink();

    final bool isShopping = topBadge != null;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isShopping ? 6 : 8,
        vertical: isShopping ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: isShopping ? Colors.black.withOpacity(0.78) : AppColors.primary,
        borderRadius: BorderRadius.circular(100),
        border: isShopping
            ? Border.all(color: Colors.white.withOpacity(0.16))
            : null,
        boxShadow: [
          BoxShadow(
            color: (isShopping ? Colors.black : AppColors.primary)
                .withOpacity(0.35),
            blurRadius: 8,
          ),
        ],
      ),
      child: Text(
        badgeText,
        style: TextStyle(
          color: Colors.white,
          fontSize: isShopping ? 9 : 10,
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
        return value != null
            ? 'خصم $value ${CurrencyUtils.getCurrencySymbol(currency)}'
            : 'خصم ثابت';
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
    final oldPrice =
        (pricing?['originalPrice'] ?? map['originalPrice'])?.toDouble();
    final newPrice =
        (pricing?['finalPrice'] ?? map['finalPrice'])?.toDouble();
    final String currency =
        (pricing?['currency'] ?? map['currency'] ?? 'ILS').toString();

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      children: [
        if (oldPrice != null && oldPrice > (newPrice ?? 0))
          Text(
            CurrencyUtils.formatPrice(oldPrice, currency),
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withOpacity(0.7),
              decoration: TextDecoration.lineThrough,
              decorationColor: Colors.white70,
              fontWeight: FontWeight.bold,
            ),
          ),
        if (newPrice != null)
          Text(
            CurrencyUtils.formatPrice(newPrice, currency),
            style: const TextStyle(
              fontSize: 18,
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
      ],
    );
  }
}
