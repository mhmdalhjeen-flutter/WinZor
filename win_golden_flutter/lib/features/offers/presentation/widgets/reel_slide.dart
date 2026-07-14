import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../home/data/models/offer_model.dart';
import '../../../../core/utils/currency_utils.dart';

class ReelSlide extends StatelessWidget {
  final OfferModel offer;
  final bool isActive;

  const ReelSlide({
    super.key,
    required this.offer,
    required this.isActive,
  });

  @override
  Widget build(BuildContext context) {
    final image = offer.image;
    final views = offer.views;

    return Stack(
      fit: StackFit.expand,
      children: [
        // Media (Image with Blur Background)
        _buildMedia(image),

        // Content (Bottom Info)
        _buildContent(),

        // Actions (Floating Sidebar)
        Positioned(
          left: 12,
          bottom: 100,
          child: _buildActionsSidebar(views),
        ),
      ],
    );
  }

  Widget _buildMedia(String? image) {
    if (image == null || image.isEmpty) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: Icon(LucideIcons.imageOff, size: 48, color: Colors.white24),
        ),
      );
    }

    return Stack(
      fit: StackFit.expand,
      children: [
        // Blurred Background
        CachedNetworkImage(
          imageUrl: image,
          fit: BoxFit.cover,
          errorWidget: (context, url, error) => const SizedBox.shrink(),
        ),
        Container(
          color: Colors.black.withOpacity(0.54),
        ),
        // Centered Image
        Center(
          child: CachedNetworkImage(
            imageUrl: image,
            fit: BoxFit.contain,
            placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
          ),
        ),
      ],
    );
  }

  Widget _buildContent() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 80, 70, 40), // Left padding for sidebar
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.85),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(100),
              ),
              child: Text(
                _getBadgeText(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ),
            const SizedBox(height: 8),
            // Price
            _buildPriceDisplay(),
            const SizedBox(height: 8),
            // Description
            if (offer.description != null)
              _DescriptionBlock(text: offer.description!),
            const SizedBox(height: 16),
            // Order Button
            ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(100)),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.shoppingBag, size: 18),
                  SizedBox(width: 8),
                  Text('اطلب الآن', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getBadgeText() {
    switch (offer.offerType) {
      case 'discount': return offer.value != null ? 'خصم ${offer.value!.toInt()}%' : 'خصم';
      case 'bogo': return '1+1';
      case 'free_item': return 'هدية';
      default: return 'عرض';
    }
  }

  Widget _buildPriceDisplay() {
    final pricing = offer.pricing;
    final oldPrice = pricing?['originalPrice'] ?? offer.originalPrice;
    final newPrice = pricing?['finalPrice'] ?? offer.finalPrice;
    final String currency = pricing?['currency'] ?? offer.currency ?? 'ILS';

    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 8,
      children: [
        if (newPrice != null)
          Text(
            CurrencyUtils.formatPrice(newPrice, currency),
            style: const TextStyle(
              fontSize: 20,
              color: Color(0xFFFECACA),
              fontWeight: FontWeight.w900,
            ),
          ),
        if (oldPrice != null)
          Text(
            CurrencyUtils.formatPrice(oldPrice, currency),
            style: const TextStyle(
              fontSize: 12,
              color: Colors.white54,
              decoration: TextDecoration.lineThrough,
              fontWeight: FontWeight.bold,
            ),
          ),
      ],
    );
  }

  Widget _buildActionsSidebar(int views) {
    return Column(
      children: [
        _ActionIcon(icon: LucideIcons.heart, label: 'إعجاب', onTap: () {}),
        const SizedBox(height: 16),
        _ActionIcon(icon: LucideIcons.messageCircle, label: 'محادثة', onTap: () {}),
        const SizedBox(height: 16),
        _ActionIcon(icon: LucideIcons.share2, label: 'مشاركة', onTap: () {}),
        const SizedBox(height: 16),
        _ActionIcon(icon: LucideIcons.eye, label: _formatCount(views), isStat: true),
      ],
    );
  }

  String _formatCount(int n) {
    if (n >= 1000000) return '${(n / 1000000).toStringAsFixed(1)}M';
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toString();
  }
}

class _ActionIcon extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  final bool isStat;

  const _ActionIcon({
    required this.icon,
    required this.label,
    this.onTap,
    this.isStat = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.55),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white24, width: 1.5),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}

class _DescriptionBlock extends StatefulWidget {
  final String text;
  const _DescriptionBlock({required this.text});

  @override
  State<_DescriptionBlock> createState() => _DescriptionBlockState();
}

class _DescriptionBlockState extends State<_DescriptionBlock> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final bool canExpand = widget.text.length > 80;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.text,
          maxLines: _expanded ? null : 2,
          overflow: _expanded ? TextOverflow.visible : TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 13,
            fontWeight: FontWeight.w600,
            height: 1.5,
          ),
        ),
        if (canExpand)
          GestureDetector(
            onTap: () => setState(() => _expanded = !_expanded),
            child: Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                _expanded ? 'إخفاء التفاصيل' : 'اقرأ المزيد',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
