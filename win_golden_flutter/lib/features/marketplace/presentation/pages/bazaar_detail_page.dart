import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/utils/phone_validation.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chat/data/chat_context_store.dart';
import '../providers/marketplace_providers.dart';
import '../widgets/bazaar_constants.dart';
import '../../data/models/bazaar_listing_model.dart';

final bazaarDetailProvider =
    FutureProvider.family<BazaarListingModel, String>((ref, id) async {
  return ref.watch(marketplaceRepositoryProvider).getListing(id);
});

class BazaarDetailPage extends ConsumerStatefulWidget {
  final String id;

  const BazaarDetailPage({
    super.key,
    required this.id,
  });

  @override
  ConsumerState<BazaarDetailPage> createState() => _BazaarDetailPageState();
}

class _BazaarDetailPageState extends ConsumerState<BazaarDetailPage> {
  int _activeImageIndex = 0;
  String? _syncedListingId;
  bool _favLoading = false;

  void _syncImageIndex(BazaarListingModel listing, List<String> images) {
    if (_syncedListingId == listing.id) return;
    _syncedListingId = listing.id;
    final idx = images.isEmpty
        ? 0
        : listing.mainImageIndex.clamp(0, images.length - 1);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) setState(() => _activeImageIndex = idx);
    });
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _toggleFavorite(BazaarListingModel listing) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      context.push('/login');
      return;
    }
    if (_favLoading) return;
    setState(() => _favLoading = true);
    try {
      final data =
          await ref.read(marketplaceRepositoryProvider).toggleFavorite(listing.id);
      ref.invalidate(bazaarDetailProvider(listing.id));
      ref.invalidate(favoriteBazaarListingsProvider);
      ref.invalidate(bazaarBrowseProvider);
      _toast(data['message']?.toString() ?? 'تم التحديث');
    } catch (e) {
      _toast(_errMsg(e, 'تعذّر التحديث'));
    } finally {
      if (mounted) setState(() => _favLoading = false);
    }
  }

  void _contact(BazaarListingModel listing) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      context.push('/login');
      return;
    }
    final sellerId = listing.sellerId;
    if (sellerId == null || sellerId.isEmpty) {
      _toast('لا يمكن التواصل');
      return;
    }
    final myId =
        (auth.user?['_id'] ?? auth.user?['id'])?.toString();
    if (myId != null && myId == sellerId) {
      _toast('هذا إعلانك');
      return;
    }
    final img = listing.images.isEmpty
        ? null
        : listing.images[
            listing.mainImageIndex.clamp(0, listing.images.length - 1)];
    await ChatContextStore.save({
      'recipientId': sellerId,
      'context': {
        'itemId': listing.id,
        'itemType': 'BazaarListing',
        'itemName': listing.title,
        if (img != null) 'itemImage': img,
        'itemUrl': '/marketplace/${listing.id}',
      },
    });
    if (!mounted) return;
    context.push('/chat');
  }

  String _errMsg(Object e, String fallback) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    }
    return fallback;
  }

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(bazaarDetailProvider(widget.id));
    final isAuth = ref.watch(authProvider).isAuth;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronRight),
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/marketplace');
            }
          },
        ),
        title: const Text(
          'اعرض غراضك',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        centerTitle: false,
      ),
      body: detailAsync.when(
        data: (listing) {
          final images = listing.images
              .map((e) => resolveImageUrl(e))
              .whereType<String>()
              .toList();
          _syncImageIndex(listing, images);
          final isWanted = listing.transactionType == 'custom';
          final safeIndex =
              images.isEmpty ? 0 : _activeImageIndex.clamp(0, images.length - 1);

          return SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildGallery(images, isWanted, safeIndex),
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.03),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'اعرض غراضك',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.primary,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    listing.title,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      height: 1.2,
                                      fontFamily: 'Cairo',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              isWanted && listing.price == 0
                                  ? 'طلب شراء'
                                  : CurrencyUtils.formatPrice(
                                      listing.price, listing.currency),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        _buildAttributesGrid(listing),
                        if (listing.keywords.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: listing.keywords
                                .map(
                                  (kw) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                    child: Text(
                                      kw,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                        if (listing.description != null &&
                            listing.description!.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          const Text(
                            'الوصف',
                            style: TextStyle(
                              fontWeight: FontWeight.w900,
                              fontSize: 16,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            listing.description!,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF4B5563),
                              height: 1.6,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                        const SizedBox(height: 32),
                        _buildContactActions(listing, isAuth),
                        if (listing.freeDelivery)
                          Padding(
                            padding: const EdgeInsets.only(top: 16.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(LucideIcons.truck,
                                    size: 16, color: Colors.green),
                                const SizedBox(width: 8),
                                Text(
                                  'التوصيل مجاني',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green.shade700,
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _errMsg(err, 'الإعلان غير موجود'),
                style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
              ),
              TextButton(
                onPressed: () => context.go('/marketplace'),
                child: const Text(
                  'العودة للسوق',
                  style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGallery(List<String> images, bool isWanted, int safeIndex) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: images.isNotEmpty
                ? AppImage(src: images[safeIndex], fit: BoxFit.contain)
                : isWanted
                    ? Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Color(0xFFFFF7ED),
                              Color(0xFFFEF3C7),
                              Color(0xFFFFEDD5),
                            ],
                          ),
                        ),
                        child: const Center(
                          child: Text(
                            'مطلوب',
                            style: TextStyle(
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFFF97316),
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                      )
                    : const Center(
                        child: Text(
                          'بدون صورة',
                          style: TextStyle(
                            color: Colors.grey,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
          ),
          if (images.length > 1)
            SizedBox(
              height: 80,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.all(12),
                itemCount: images.length,
                itemBuilder: (context, index) {
                  return GestureDetector(
                    onTap: () => setState(() => _activeImageIndex = index),
                    child: Container(
                      width: 56,
                      height: 56,
                      margin: const EdgeInsets.only(left: 8),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: safeIndex == index
                              ? AppColors.primary
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: AppImage(src: images[index], fit: BoxFit.cover),
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildAttributesGrid(BazaarListingModel listing) {
    final attrs = <Map<String, String>>[
      if (listing.transactionType != 'custom')
        {
          'label': 'الحالة',
          'value': BazaarConstants.getConditionLabel(listing.condition),
        },
      {
        'label': 'النوع',
        'value': BazaarConstants.getTransactionTypeLabel(listing.transactionType),
      },
      if (listing.category.isNotEmpty)
        {
          'label': 'الفئة',
          'value': BazaarConstants.getCategoryLabel(listing.category),
        },
      {
        'label': 'المنطقة',
        'value': BazaarConstants.regionLabel(listing.regionId, listing.subRegionId),
      },
      if (listing.transactionType != 'custom')
        {
          'label': 'التوصيل',
          'value': listing.freeDelivery ? 'مجاني' : 'غير متاح',
        },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 2.5,
      ),
      itemCount: attrs.length,
      itemBuilder: (context, index) {
        final attr = attrs[index];
        return Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                attr['label']!,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.grey,
                  fontFamily: 'Cairo',
                ),
              ),
              const SizedBox(height: 2),
              Text(
                attr['value']!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1F2937),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContactActions(BazaarListingModel listing, bool isAuth) {
    final phone = listing.contactPhone;
    final carrier =
        phone != null ? PhoneValidation.getPhoneCarrier(phone) : null;
    final phoneColor =
        carrier == 'wataniya' ? const Color(0xFFEF4444) : const Color(0xFF10B981);

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () => _contact(listing),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.messageCircle, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'تواصل',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            if (isAuth) ...[
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () => _toggleFavorite(listing),
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: listing.isFavorited
                        ? const Color(0xFFFFF1F2)
                        : Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: listing.isFavorited
                          ? const Color(0xFFFECDD3)
                          : const Color(0xFFE5E7EB),
                    ),
                  ),
                  child: Center(
                    child: _favLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(
                            LucideIcons.heart,
                            color: listing.isFavorited
                                ? const Color(0xFFF43F5E)
                                : const Color(0xFF6B7280),
                            fill: listing.isFavorited ? 1.0 : 0.0,
                          ),
                  ),
                ),
              ),
            ],
          ],
        ),
        if (phone != null && phone.isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () => launchUrl(Uri.parse('tel:$phone')),
              style: ElevatedButton.styleFrom(
                backgroundColor: phoneColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.phone, size: 20),
                  const SizedBox(width: 12),
                  Text(
                    phone,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'monospace',
                    ),
                    textDirection: TextDirection.ltr,
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
