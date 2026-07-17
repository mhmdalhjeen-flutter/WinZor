import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:intl/intl.dart' as intl;
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/app_image.dart';
import '../../data/models/bazaar_listing_model.dart';
import 'bazaar_constants.dart';

class BazaarListingCard extends StatelessWidget {
  final BazaarListingModel listing;
  final VoidCallback? onClick;
  final bool favorited;
  final Function(BazaarListingModel)? onToggleFavorite;
  final bool isPulsing;

  const BazaarListingCard({
    super.key,
    required this.listing,
    this.onClick,
    this.favorited = false,
    this.onToggleFavorite,
    this.isPulsing = false,
  });

  @override
  Widget build(BuildContext context) {
    final String? img = listing.images.isNotEmpty
        ? resolveImageUrl(
            listing.images[listing.mainImageIndex >= listing.images.length ? 0 : listing.mainImageIndex],
          )
        : null;
    final bool isWanted = listing.transactionType == 'custom';
    final bool showPrice = !(isWanted && listing.price == 0);

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 1.0, end: isPulsing ? 1.03 : 1.0),
      duration: const Duration(milliseconds: 280),
      builder: (context, scale, child) {
        return Transform.scale(
          scale: scale,
          child: child,
        );
      },
      child: GestureDetector(
        onTap: onClick,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF3F4F6)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image Section
                _buildImageSection(img, isWanted),
                const SizedBox(width: 12),
                // Info Section
                Expanded(
                  child: _buildInfoSection(showPrice, isWanted),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildImageSection(String? img, bool isWanted) {
    return Container(
      width: 120,
      height: 120,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: const Color(0xFFF3F4F6),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (img != null)
            AppImage(
              src: img,
              fit: BoxFit.cover,
            )
          else if (isWanted)
            Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFFFF7ED), Color(0xFFFEF3C7), Color(0xFFFFEDD5)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: const Center(
                child: Text(
                  'مطلوب',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFF97316),
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
            )
          else
            const Center(
              child: Text(
                'بدون صورة',
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          
          // Transaction Type Badge
          Positioned(
            top: 6,
            right: 6,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: BazaarConstants.getTransactionTypeColor(listing.transactionType).withOpacity(0.9),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                BazaarConstants.getTransactionTypeLabel(listing.transactionType),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
          ),

          // Favorite Button
          if (onToggleFavorite != null)
            Positioned(
              bottom: 6,
              right: 6,
              child: GestureDetector(
                onTap: () => onToggleFavorite!(listing),
                child: Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.95),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 4,
                      )
                    ],
                    border: Border.all(
                      color: favorited ? const Color(0xFFFECDD3) : const Color(0xFFE5E7EB),
                      width: favorited ? 1 : 0.8,
                    ),
                  ),
                  child: Icon(
                    LucideIcons.heart,
                    size: 16,
                    color: favorited ? const Color(0xFFF43F5E) : Colors.grey.shade300,
                    fill: favorited ? 1.0 : 0.0,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildInfoSection(bool showPrice, bool isWanted) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          listing.title,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: Color(0xFF111827),
            height: 1.2,
            fontFamily: 'Cairo',
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 6),
        if (showPrice)
          Text(
            _formatListingPrice(),
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
              color: AppColors.primary,
              fontFamily: 'Cairo',
            ),
          )
        else if (isWanted)
          const Text(
            'طلب شراء',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: Color(0xFFEA580C),
              fontFamily: 'Cairo',
            ),
          ),
        
        const Spacer(),

        if (listing.condition.isNotEmpty && listing.transactionType != 'custom')
          Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: BazaarConstants.getConditionColor(listing.condition).withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              BazaarConstants.getConditionLabel(listing.condition),
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: BazaarConstants.getConditionColor(listing.condition),
                fontFamily: 'Cairo',
              ),
            ),
          ),

        Row(
          children: [
            if (listing.category.isNotEmpty) ...[
              const Icon(LucideIcons.folderOpen, size: 11, color: Color(0xFF7C3AED)),
              const SizedBox(width: 4),
              Text(
                BazaarConstants.getCategoryLabel(listing.category),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF7C3AED),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 4),
        Row(
          children: [
            const Icon(LucideIcons.mapPin, size: 11, color: Color(0xFF10B981)),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                _getRegionLabel(),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF6B7280),
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        if (listing.keywords.isNotEmpty) ...[
          const SizedBox(height: 6),
          Wrap(
            spacing: 4,
            runSpacing: 4,
            children: listing.keywords.take(2).map((kw) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.tag, size: 9, color: Color(0xFF6B7280)),
                    const SizedBox(width: 2),
                    Text(
                      kw,
                      style: const TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  String _formatListingPrice() {
    final formatter = intl.NumberFormat.decimalPattern();
    String symbol = '₪';
    if (listing.currency == 'JOD') symbol = 'JD';
    if (listing.currency == 'USD') symbol = '\$';
    
    return '${formatter.format(listing.price)} $symbol';
  }

  String _getRegionLabel() {
    // In React: parts = [listing.regionId?.name, listing.subRegionId?.name].filter(Boolean);
    // My model has regionId and subRegionId as dynamic
    String label = '';
    if (listing.regionId is Map) {
      label += listing.regionId['name'] ?? '';
    }
    if (listing.subRegionId is Map) {
      if (label.isNotEmpty) label += '، ';
      label += listing.subRegionId['name'] ?? '';
    }
    return label.isNotEmpty ? label : '—';
  }
}
