import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/star_rating.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../../core/utils/media_url.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../providers/marketplace_providers.dart';
import '../widgets/bazaar_constants.dart';
import '../models/bazaar_listing_model.dart';

final bazaarDetailProvider = FutureProvider.family<BazaarListingModel, String>((ref, id) async {
  final repo = ref.watch(marketplaceRepositoryProvider);
  final listings = await repo.getListings(); // Or a specific detail endpoint if exists
  // In React it calls api.get(`/bazaar/${id}`)
  final response = await ref.read(apiClientProvider).dio.get('/bazaar/$id');
  return BazaarListingModel.fromJson(response.data['listing']);
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
  bool _favLoading = false;

  @override
  Widget build(BuildContext context) {
    final detailAsync = ref.watch(bazaarDetailProvider(widget.id));

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronRight),
          onPressed: () => context.pop(),
        ),
        title: const Text('اعرض غراضك', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        centerTitle: false,
      ),
      body: detailAsync.when(
        data: (listing) {
          final images = listing.images
              .map((e) => resolveImageUrl(e))
              .whereType<String>()
              .toList();
          final isWanted = listing.transactionType == 'custom';

          return SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 40),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Gallery
                _buildGallery(listing, images, isWanted),

                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
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
                                      fontWeight: FontWeight.black,
                                      color: AppColors.primary,
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    listing.title,
                                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, height: 1.2),
                                  ),
                                ],
                              ),
                            ),
                            Text(
                              isWanted && listing.price == 0 
                                  ? 'طلب شراء' 
                                  : CurrencyUtils.formatPrice(listing.price, listing.currency),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppColors.primary),
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
                            children: listing.keywords.map((kw) => Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(100),
                              ),
                              child: Text(
                                kw,
                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary),
                              ),
                            )).toList(),
                          ),
                        ],

                        if (listing.description != null && listing.description!.isNotEmpty) ...[
                          const SizedBox(height: 24),
                          const Text('الوصف', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                          const SizedBox(height: 8),
                          Text(
                            listing.description!,
                            style: const TextStyle(fontSize: 14, color: Color(0xFF4B5563), height: 1.6, fontWeight: FontWeight.bold),
                          ),
                        ],

                        const SizedBox(height: 32),
                        _buildContactActions(listing),

                        if (listing.freeDelivery)
                          Padding(
                            padding: const EdgeInsets.only(top: 16.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(LucideIcons.truck, size: 16, color: Colors.green),
                                const SizedBox(width: 8),
                                Text('التوصيل مجاني', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green.shade700)),
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
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildGallery(BazaarListingModel listing, List<String> images, bool isWanted) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        children: [
          AspectRatio(
            aspectRatio: 1,
            child: images.isNotEmpty
                ? AppImage(
                    src: images[_activeImageIndex],
                    fit: BoxFit.contain,
                  )
                : isWanted
                    ? Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFFFF7ED), Color(0xFFFEF3C7), Color(0xFFFFEDD5)],
                          ),
                        ),
                        child: const Center(
                          child: Text('مطلوب', style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFFF97316))),
                        ),
                      )
                    : const Center(child: Text('بدون صورة', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold))),
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
                          color: _activeImageIndex == index ? AppColors.primary : Colors.transparent,
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
    final List<Map<String, dynamic>> attrs = [
      if (listing.transactionType != 'custom')
        {'label': 'الحالة', 'value': BazaarConstants.getConditionLabel(listing.condition)},
      {'label': 'النوع', 'value': BazaarConstants.getTransactionTypeLabel(listing.transactionType)},
      {'label': 'الفئة', 'value': BazaarConstants.getCategoryLabel(listing.category)},
      {'label': 'المنطقة', 'value': _getRegionLabel(listing)},
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
              Text(attr['label'], style: const TextStyle(fontSize: 10, fontWeight: FontWeight.black, color: Colors.grey)),
              const SizedBox(height: 2),
              Text(attr['value'], style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Color(0xFF1F2937))),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContactActions(BazaarListingModel listing) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 56,
                child: ElevatedButton(
                  onPressed: () {}, // Chat logic
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.messageCircle, size: 20),
                      SizedBox(width: 8),
                      Text('تواصل', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900)),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: () async {
                if (_favLoading) return;
                setState(() => _favLoading = true);
                try {
                  await ref.read(marketplaceRepositoryProvider).toggleFavorite(listing.id);
                  ref.invalidate(bazaarDetailProvider(listing.id));
                } finally {
                  setState(() => _favLoading = false);
                }
              },
              child: Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: listing.isFavorited ? const Color(0xFFFFF1F2) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: listing.isFavorited ? const Color(0xFFFECDD3) : const Color(0xFFE5E7EB)),
                ),
                child: Center(
                  child: _favLoading 
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : Icon(
                        LucideIcons.heart, 
                        color: listing.isFavorited ? const Color(0xFFF43F5E) : const Color(0xFF6B7280),
                        fill: listing.isFavorited ? 1.0 : 0.0,
                      ),
                ),
              ),
            ),
          ],
        ),
        if (listing.contactPhone != null && listing.contactPhone!.isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: () => launchUrl(Uri.parse('tel:${listing.contactPhone}')),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(LucideIcons.phone, size: 20),
                  const SizedBox(width: 12),
                  Text(
                    listing.contactPhone!,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'monospace'),
                    dir: TextDirection.ltr,
                  ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  String _getRegionLabel(BazaarListingModel listing) {
    String label = '';
    if (listing.regionId is Map) label += listing.regionId['name'] ?? '';
    if (listing.subRegionId is Map) {
      if (label.isNotEmpty) label += '، ';
      label += listing.subRegionId['name'] ?? '';
    }
    return label.isNotEmpty ? label : '—';
  }
}
