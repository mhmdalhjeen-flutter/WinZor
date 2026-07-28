import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/star_rating.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../../auth/presentation/providers/auth_gate_provider.dart';
import '../../../auth/utils/auth_gate_messages.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chat/data/chat_context_store.dart';
import '../../../home/data/models/offer_model.dart';
import '../../../favorites/presentation/providers/favorites_providers.dart';
import '../../../orders/presentation/widgets/direct_order_sheet.dart';
import '../providers/offer_detail_providers.dart';

class OfferDetailPage extends ConsumerWidget {
  final String id;

  const OfferDetailPage({
    super.key,
    required this.id,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final offerAsync = ref.watch(offerDetailProvider(id));
    final isFavorited = ref.watch(isOfferFavoritedProvider(id));
    final favBusy = ref.watch(favoritingBusyProvider(id));
    final auth = ref.watch(authProvider);
    // Prefetch favorite ids when authenticated (matches React OfferDetail query).
    if (auth.isAuth) {
      ref.watch(favoritesProvider);
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: offerAsync.when(
        data: (offer) {
          final store = offer.storeObject;
          final image = offer.image;
          final String badge = _getBadgeText(offer);

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header with Image
                Stack(
                  children: [
                    Container(
                      height: 300,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: const BorderRadius.vertical(
                          bottom: Radius.circular(40),
                        ),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: image != null
                          ? CachedNetworkImage(
                              imageUrl: image,
                              fit: BoxFit.cover,
                            )
                          : const Center(
                              child: Icon(LucideIcons.imageOff, size: 48, color: Colors.grey),
                            ),
                    ),
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            CircleAvatar(
                              backgroundColor: Colors.white.withOpacity(0.3),
                              child: IconButton(
                                icon: const Icon(LucideIcons.chevronRight, color: Colors.white),
                                onPressed: () => context.pop(),
                              ),
                            ),
                            Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: isFavorited ? Colors.red : Colors.white.withOpacity(0.3),
                                  child: IconButton(
                                    icon: Icon(
                                      LucideIcons.heart,
                                      color: Colors.white,
                                      fill: isFavorited ? 1.0 : 0.0,
                                    ),
                                    onPressed: favBusy
                                        ? null
                                        : () async {
                                            if (!auth.isAuth) {
                                              ref.read(authGateProvider.notifier).runWithAuth(
                                                    () async {
                                                      await ref
                                                          .read(favoritesActionsProvider)
                                                          .toggle(id);
                                                    },
                                                    message: AuthGateMessages.generic,
                                                  );
                                              return;
                                            }
                                            await ref
                                                .read(favoritesActionsProvider)
                                                .toggle(id);
                                          },
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.primary,
                                    borderRadius: BorderRadius.circular(100),
                                  ),
                                  child: Text(
                                    badge,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Cairo',
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

                Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        offer.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF111827),
                          fontFamily: 'Cairo',
                          height: 1.2,
                        ),
                      ),
                      const SizedBox(height: 16),
                      
                      _buildPriceRow(offer),
                      
                      const SizedBox(height: 16),
                      StarRating(
                        ratingAvg: offer.ratingAvg,
                        ratingCount: offer.ratingCount,
                        starSize: 18,
                      ),
                      const SizedBox(height: 16),

                      _buildMetaInfo(offer),

                      if (offer.description != null && offer.description!.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF3F4F6)),
                          ),
                          child: Text(
                            offer.description!,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF4B5563),
                              height: 1.6,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 32),
                      const Text(
                        'المتجر المقدّم للعرض',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildStoreCard(context, store),
                      
                      const SizedBox(height: 32),
                      _buildActionsRow(context, ref, offer),
                      const SizedBox(height: 40),
                    ],
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

  String _getBadgeText(offer) {
    switch (offer.offerType) {
      case 'discount':
        return offer.value != null ? 'خصم ${offer.value.toInt()}%' : 'خصم';
      case 'fixed_price':
        return offer.value != null ? CurrencyUtils.formatPrice(offer.value, offer.currency) : 'سعر خاص';
      case 'free_item':
        return 'مجاني';
      case 'bogo':
        return '1+1';
      default:
        return 'عرض';
    }
  }

  Widget _buildPriceRow(offer) {
    final pricing = offer.pricing;
    final oldPrice = pricing?['originalPrice'] ?? offer.originalPrice;
    final newPrice = pricing?['finalPrice'] ?? offer.finalPrice;
    final bool showCompare = pricing?['showCompare'] ?? (oldPrice != null);
    final String currency = pricing?['currency'] ?? offer.currency ?? 'ILS';

    return Row(
      children: [
        if (newPrice != null)
          Text(
            CurrencyUtils.formatPrice(newPrice, currency),
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
            ),
          ),
        if (showCompare && oldPrice != null) ...[
          const SizedBox(width: 12),
          Text(
            CurrencyUtils.formatPrice(oldPrice, currency),
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey,
              decoration: TextDecoration.lineThrough,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildMetaInfo(offer) {
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: [
        if (offer.expiresAt != null)
          _buildInfoItem(LucideIcons.clock, 'ينتهي في ${DateFormat('yyyy/MM/dd').format(offer.expiresAt!)}'),
        if (offer.storeObject?.region != null)
          _buildInfoItem(LucideIcons.mapPin, '${offer.storeObject!.region}${offer.storeObject!.subRegion != null ? " - ${offer.storeObject!.subRegion}" : ""}'),
        _buildInfoItem(LucideIcons.tag, _getBadgeText(offer)),
      ],
    );
  }

  Widget _buildInfoItem(IconData icon, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppColors.primary),
        const SizedBox(width: 6),
        Text(
          text,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Color(0xFF9CA3AF),
          ),
        ),
      ],
    );
  }

  Widget _buildStoreCard(BuildContext context, store) {
    if (store == null) return const SizedBox.shrink();

    return InkWell(
      onTap: () => context.push('/store/${store.id}'),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Colors.grey.shade50,
              ),
              clipBehavior: Clip.antiAlias,
              child: store.logo != null
                  ? CachedNetworkImage(imageUrl: store.logo!, fit: BoxFit.cover)
                  : const Icon(LucideIcons.store, color: Colors.grey),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    store.name,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: Color(0xFF111827), fontFamily: 'Cairo'),
                  ),
                  if (store.category != null)
                    Text(
                      store.category!,
                      style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                    ),
                  if (store.isVerifiedStore)
                    const Padding(
                      padding: EdgeInsets.only(top: 4.0),
                      child: Text('✔ متجر موثق', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Color(0xFF059669))),
                    ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(LucideIcons.store, color: AppColors.primary, size: 20),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionsRow(BuildContext context, WidgetRef ref, OfferModel offer) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: SizedBox(
            height: 56,
            child: ElevatedButton(
              onPressed: () {
                final price = offer.finalPrice ??
                    double.tryParse(
                        offer.pricing?['finalPrice']?.toString() ?? '') ??
                    offer.originalPrice ??
                    0;
                showDirectOrderSheet(
                  context: context,
                  ref: ref,
                  itemId: offer.id,
                  itemType: 'offer',
                  title: offer.title,
                  unitPrice: price,
                  currency: offer.currency ??
                      offer.pricing?['currency']?.toString() ??
                      'ILS',
                  imageUrl: offer.image,
                  storeName: offer.storeObject?.name,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                elevation: 8,
                shadowColor: AppColors.primary.withOpacity(0.2),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.send, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'اطلب الآن',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: SizedBox(
            height: 56,
            child: OutlinedButton(
              onPressed: () => _contactStore(context, ref, offer),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFF3F4F6), width: 2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.messageCircle, size: 22, color: Color(0xFF4B5563)),
                  SizedBox(width: 4),
                  Text('تواصل', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFF4B5563), fontFamily: 'Cairo')),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _contactStore(
    BuildContext context,
    WidgetRef ref,
    OfferModel offer,
  ) async {
    final auth = ref.read(authProvider);
    if (!auth.isAuth) {
      ref.read(authGateProvider.notifier).runWithAuth(
            () => _contactStore(context, ref, offer),
            message: AuthGateMessages.generic,
          );
      return;
    }
    try {
      final ownerId =
          await ref.read(offerRepositoryProvider).getStoreOwnerId(offer.id);
      if (ownerId == null || ownerId.isEmpty) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'معلومات المتجر غير متوفّرة للتواصل',
                style: TextStyle(fontFamily: 'Cairo'),
              ),
            ),
          );
        }
        return;
      }
      await ChatContextStore.save({
        'recipientId': ownerId,
        'context': {
          'itemId': offer.id,
          'itemType': 'Offer',
          'itemName': offer.title,
          if (offer.image != null) 'itemImage': offer.image,
          'itemUrl': '/offer/${offer.id}',
        },
      });
      if (context.mounted) context.push('/chat');
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'تعذّر فتح المحادثة',
              style: TextStyle(fontFamily: 'Cairo'),
            ),
          ),
        );
      }
    }
  }
}
