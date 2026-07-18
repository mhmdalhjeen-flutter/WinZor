import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/api/api_client.dart';
import '../../../../core/cache/app_image_cache.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/media_url.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chat/data/chat_context_store.dart';
import '../../../home/data/models/offer_model.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../orders/presentation/widgets/direct_order_sheet.dart';
import '../../models/reel_viewer_item.dart';
import '../providers/offer_detail_providers.dart';

/// React `OfferReelViewer` ReelSlide — order / like / chat / share for offers & products.
class ReelSlide extends ConsumerStatefulWidget {
  final ReelViewerItem item;
  final bool isActive;

  const ReelSlide({
    super.key,
    required this.item,
    required this.isActive,
  });

  @override
  ConsumerState<ReelSlide> createState() => _ReelSlideState();
}

class _ReelSlideState extends ConsumerState<ReelSlide> {
  bool _liked = false;
  bool _chatBusy = false;
  bool _shareBusy = false;

  ReelViewerItem get item => widget.item;
  bool get isProduct => item.type == ReelItemType.product;
  Map<String, dynamic> get raw => item.raw;

  OfferModel? get _offerModel {
    if (isProduct) return null;
    try {
      return OfferModel.fromJson(raw);
    } catch (_) {
      return null;
    }
  }

  String? get _imageUrl {
    if (isProduct) return resolveProductImage(raw);
    return resolveOfferImage(raw) ?? raw['image']?.toString();
  }

  int get _views {
    return int.tryParse(raw['views']?.toString() ?? '') ?? 0;
  }

  String? get _description => raw['description']?.toString();

  Future<void> _orderNow() async {
    if (isProduct) {
      final price = double.tryParse(raw['price']?.toString() ?? '') ?? 0;
      final currency = raw['currency']?.toString() ?? 'ILS';
      await showDirectOrderSheet(
        context: context,
        ref: ref,
        itemId: item.id,
        itemType: 'Product',
        title: item.title,
        unitPrice: price,
        currency: currency,
        imageUrl: _imageUrl,
        storeName: item.store?['name']?.toString(),
      );
      return;
    }

    final offer = _offerModel;
    if (offer == null) return;
    final pricing = offer.pricing;
    final unit = pricing?['finalPrice'] ?? offer.finalPrice ?? 0;
    final currency =
        pricing?['currency']?.toString() ?? offer.currency ?? 'ILS';

    await showDirectOrderSheet(
      context: context,
      ref: ref,
      itemId: offer.id,
      itemType: 'Offer',
      title: offer.title,
      unitPrice: double.tryParse(unit.toString()) ?? 0,
      currency: currency,
      imageUrl: offer.image,
      storeName: offer.storeObject?.name,
    );
  }

  Future<void> _toggleLike() async {
    setState(() => _liked = !_liked);
    try {
      await ref.read(apiClientProvider).dio.post('/activity', data: {
        'type': isProduct ? 'like_product' : 'like_offer',
        'targetType': isProduct ? 'Product' : 'Offer',
        'targetId': item.id,
      });
    } catch (_) {}
  }

  Future<void> _openChat() async {
    if (_chatBusy) return;
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      context.push('/login');
      return;
    }

    setState(() => _chatBusy = true);
    try {
      String? ownerId;
      if (isProduct) {
        final store = item.store;
        final owner = store?['owner'];
        if (owner is Map) {
          ownerId = (owner['_id'] ?? owner['id'])?.toString();
        } else if (owner != null) {
          ownerId = owner.toString();
        }
      } else {
        ownerId = await ref.read(offerRepositoryProvider).getStoreOwnerId(item.id);
      }

      if (ownerId == null || ownerId.isEmpty) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'معلومات المتجر غير متوفّرة للتواصل',
              style: TextStyle(fontFamily: 'Cairo'),
            ),
          ),
        );
        return;
      }

      final itemPath = isProduct ? '/product/${item.id}' : '/offer/${item.id}';
      await ChatContextStore.save({
        'recipientId': ownerId,
        'context': {
          'itemId': item.id,
          'itemType': isProduct ? 'Product' : 'Offer',
          'itemName': item.title,
          if (_imageUrl != null) 'itemImage': _imageUrl,
          'itemUrl': itemPath,
        },
      });
      if (!mounted) return;
      context.push('/chat');
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'تعذّر فتح المحادثة',
            style: TextStyle(fontFamily: 'Cairo'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _chatBusy = false);
    }
  }

  Future<void> _share() async {
    if (_shareBusy) return;
    setState(() => _shareBusy = true);
    final storeName = item.store?['name']?.toString() ??
        (isProduct ? 'منتج' : 'عرض مميز');
    final path = isProduct ? '/product/${item.id}' : '/offer/${item.id}';
    final text = '${item.title} — $storeName\n$path';
    try {
      await Clipboard.setData(ClipboardData(text: text));
      if (!isProduct) {
        await ref.read(offerRepositoryProvider).recordShare(item.id);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            isProduct ? 'تم نسخ رابط المنتج' : 'تم نسخ رابط العرض',
            style: const TextStyle(fontFamily: 'Cairo'),
          ),
        ),
      );
    } finally {
      if (mounted) setState(() => _shareBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        _buildMedia(_imageUrl),
        _buildContent(),
        Positioned(
          left: 12,
          bottom: 100,
          child: _buildActionsSidebar(_views, _liked),
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
        CachedNetworkImage(
          imageUrl: image,
          cacheManager: AppImageCache.manager,
          fit: BoxFit.cover,
          errorWidget: (context, url, error) => const SizedBox.shrink(),
        ),
        Container(color: Colors.black.withOpacity(0.54)),
        Center(
          child: CachedNetworkImage(
            imageUrl: image,
            cacheManager: AppImageCache.manager,
            fit: BoxFit.contain,
            placeholder: (context, url) =>
                const Center(child: CircularProgressIndicator()),
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
        padding: const EdgeInsets.fromLTRB(16, 80, 70, 40),
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
            if (!isProduct) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(100),
                ),
                child: Text(
                  _getOfferBadgeText(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                  ),
                ),
              ),
              const SizedBox(height: 8),
            ],
            _buildPriceDisplay(),
            const SizedBox(height: 8),
            if (_description != null && _description!.isNotEmpty)
              _DescriptionBlock(text: _description!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _orderNow,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(100)),
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(LucideIcons.shoppingBag, size: 18),
                  SizedBox(width: 8),
                  Text('اطلب الآن',
                      style: TextStyle(
                          fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getOfferBadgeText() {
    final offer = _offerModel;
    if (offer == null) return 'عرض';
    switch (offer.offerType) {
      case 'discount':
        return offer.value != null ? 'خصم ${offer.value!.toInt()}%' : 'خصم';
      case 'bogo':
        return '1+1';
      case 'free_item':
        return 'هدية';
      default:
        return 'عرض';
    }
  }

  Widget _buildPriceDisplay() {
    if (isProduct) {
      final price = double.tryParse(raw['price']?.toString() ?? '');
      final currency = raw['currency']?.toString() ?? 'ILS';
      if (price == null) return const SizedBox.shrink();
      return Text(
        CurrencyUtils.formatPrice(price, currency),
        style: const TextStyle(
          fontSize: 20,
          color: Color(0xFFFECACA),
          fontWeight: FontWeight.w900,
        ),
      );
    }

    final offer = _offerModel;
    if (offer == null) return const SizedBox.shrink();
    final pricing = offer.pricing;
    final oldPrice = pricing?['originalPrice'] ?? offer.originalPrice;
    final newPrice = pricing?['finalPrice'] ?? offer.finalPrice;
    final String currency =
        pricing?['currency']?.toString() ?? offer.currency ?? 'ILS';

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

  Widget _buildActionsSidebar(int views, bool liked) {
    return Column(
      children: [
        _ActionIcon(
          icon: LucideIcons.heart,
          label: 'إعجاب',
          active: liked,
          onTap: _toggleLike,
        ),
        const SizedBox(height: 16),
        _ActionIcon(
          icon: LucideIcons.messageCircle,
          label: 'محادثة',
          onTap: _chatBusy ? null : _openChat,
        ),
        const SizedBox(height: 16),
        _ActionIcon(
          icon: LucideIcons.share2,
          label: 'مشاركة',
          onTap: _shareBusy ? null : _share,
        ),
        const SizedBox(height: 16),
        _ActionIcon(
          icon: LucideIcons.eye,
          label: _formatCount(views),
          isStat: true,
        ),
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
  final bool active;

  const _ActionIcon({
    required this.icon,
    required this.label,
    this.onTap,
    this.isStat = false,
    this.active = false,
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
              color: active
                  ? AppColors.primary.withOpacity(0.9)
                  : Colors.black.withOpacity(0.55),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white24, width: 1.5),
            ),
            child: Icon(
              icon,
              color: Colors.white,
              size: 24,
              fill: active ? 1.0 : 0.0,
            ),
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
