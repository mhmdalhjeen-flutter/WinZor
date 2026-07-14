import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/offer_card.dart';
import '../../../../core/widgets/product_card.dart';
import '../providers/store_detail_providers.dart';
import '../providers/explore_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';

class StoreDetailPage extends ConsumerWidget {
  final String id;

  const StoreDetailPage({
    super.key,
    required this.id,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(storeDetailProvider(id));
    final prizesAsync = ref.watch(memberPrizesProvider(id));
    final activeTab = ref.watch(storeDetailTabProvider);
    final isAuth = ref.watch(authProvider).isAuth;
    final joining = ref.watch(joiningStoreProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: detailAsync.when(
        data: (data) {
          final store = data.store;
          final bool isMember = data.membershipStatus == 'member';
          final bool isPending = data.membershipStatus == 'pending';

          return CustomScrollView(
            slivers: [
              // Header with Cover and Logo
              SliverToBoxAdapter(
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    // Cover Image
                    Container(
                      height: 160,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, Color(0xFF7E22CE)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(32)),
                        image: store.logo != null // Using logo as fallback for cover if coverImage field not present in StoreModel yet
                            ? DecorationImage(
                                image: CachedNetworkImageProvider(store.logo!),
                                fit: BoxFit.cover,
                                colorFilter: ColorFilter.mode(Colors.black.withOpacity(0.2), BlendMode.darken),
                              )
                            : null,
                      ),
                    ),
                    
                    // Back Button
                    SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: CircleAvatar(
                          backgroundColor: Colors.white.withOpacity(0.2),
                          child: IconButton(
                            icon: const Icon(LucideIcons.chevronRight, color: Colors.white),
                            onPressed: () => context.pop(),
                          ),
                        ),
                      ),
                    ),

                    // Store Logo
                    Positioned(
                      bottom: -40,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                            color: Colors.white,
                          ),
                          child: ClipOval(
                            child: store.logo != null
                                ? CachedNetworkImage(imageUrl: store.logo!, fit: BoxFit.cover)
                                : const Icon(LucideIcons.store, color: Colors.grey, size: 40),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 50)),

              // Store Title Card
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(28),
                      border: Border.all(color: const Color(0xFFF3F4F6)),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5)),
                      ],
                    ),
                    child: Column(
                      children: [
                        Text(
                          store.name,
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                          textAlign: TextAlign.center,
                        ),
                        if (store.isVerifiedStore)
                          const Padding(
                            padding: EdgeInsets.only(top: 4.0),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(LucideIcons.badgeCheck, size: 14, color: Color(0xFF2563EB)),
                                SizedBox(width: 4),
                                Text('متجر موثق', style: TextStyle(color: Color(0xFF2563EB), fontSize: 10, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                        const SizedBox(height: 4),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(LucideIcons.mapPin, size: 12, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(
                              '${store.region}${store.subRegion != null ? " · ${store.subRegion}" : ""}',
                              style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(5, (index) {
                            return Icon(
                              LucideIcons.star,
                              size: 14,
                              color: index < store.ratingAvg ? Colors.amber : Colors.grey.shade300,
                              fill: index < store.ratingAvg ? 1.0 : 0.0,
                            );
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Action Buttons
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverToBoxAdapter(
                  child: Row(
                    children: [
                      Expanded(
                        child: isMember
                            ? Container(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFDCFCE7),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: const Color(0xFFBBF7D0)),
                                ),
                                child: const Text(
                                  'عضو فعلي ✓',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Color(0xFF15803D), fontWeight: FontWeight.w900, fontSize: 14, fontFamily: 'Cairo'),
                                ),
                              )
                            : ElevatedButton(
                                onPressed: joining ? null : () async {
                                  if (!isAuth) {
                                    context.push('/login');
                                    return;
                                  }
                                  ref.read(joiningStoreProvider.notifier).state = true;
                                  try {
                                    final res = await ref.read(exploreRepositoryProvider).joinStore(id);
                                    // In a real app we'd show a toast and invalidate provider
                                    ref.invalidate(storeDetailProvider(id));
                                  } finally {
                                    ref.read(joiningStoreProvider.notifier).state = false;
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: joining
                                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                    : Text(
                                        isPending ? 'قيد الانتظار — أدخل كوداً' : 'انضم للمتجر',
                                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                                      ),
                              ),
                      ),
                      const SizedBox(width: 8),
                      _buildSquareAction(LucideIcons.messageCircle, () {}),
                      const SizedBox(width: 8),
                      _buildSquareAction(LucideIcons.phone, () {}),
                    ],
                  ),
                ),
              ),

              // Description
              if (store.description != null && store.description!.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  sliver: SliverToBoxAdapter(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFF3F4F6)),
                      ),
                      child: Text(
                        store.description!,
                        style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563), height: 1.5),
                      ),
                    ),
                  ),
                ),

              // Member Prizes
              if (isMember)
                prizesAsync.when(
                  data: (prizes) {
                    if (prizes.isEmpty) return const SliverToBoxAdapter(child: SizedBox.shrink());
                    return SliverPadding(
                      padding: const EdgeInsets.all(16),
                      sliver: SliverToBoxAdapter(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFFEF3C7)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(LucideIcons.gift, size: 18, color: Color(0xFFB45309)),
                                  SizedBox(width: 8),
                                  Text('جوائز الأعضاء', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFB45309), fontFamily: 'Cairo')),
                                ],
                              ),
                              const SizedBox(height: 12),
                              ...prizes.map((p) => Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        Text(p.icon ?? '🎁', style: const TextStyle(fontSize: 20)),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(p.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                              if (p.description != null)
                                                Text(p.description!, style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  )),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                  loading: () => const SliverToBoxAdapter(child: SizedBox.shrink()),
                  error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
                ),

              // Tabs
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverToBoxAdapter(
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F4F6),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      children: [
                        _buildTabButton(ref, 'offers', 'العروض', activeTab == 'offers'),
                        _buildTabButton(ref, 'products', 'المنتجات', activeTab == 'products'),
                      ],
                    ),
                  ),
                ),
              ),

              // Grid Content
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: activeTab == 'offers'
                    ? (data.offers == null || data.offers!.isEmpty)
                        ? const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: Text('لا عروض حالياً', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)))))
                        : SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 1,
                              mainAxisSpacing: 12,
                              childAspectRatio: 1.4,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => OfferCard(offer: {...data.offers![index], 'store': store.toJson()}),
                              childCount: data.offers!.length,
                            ),
                          )
                    : (data.products == null || data.products!.isEmpty)
                        ? const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(40), child: Text('لا منتجات', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)))))
                        : SliverGrid(
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              mainAxisSpacing: 12,
                              crossAxisSpacing: 12,
                              childAspectRatio: 0.75,
                            ),
                            delegate: SliverChildBuilderDelegate(
                              (context, index) => ProductCard(product: data.products![index]),
                              childCount: data.products!.length,
                            ),
                          ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildSquareAction(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: Icon(icon, size: 22, color: const Color(0xFF374151)),
      ),
    );
  }

  Widget _buildTabButton(WidgetRef ref, String key, String label, bool active) {
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(storeDetailTabProvider.notifier).state = key,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            boxShadow: active ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))] : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: active ? AppColors.primary : Colors.grey,
              fontFamily: 'Cairo',
            ),
          ),
        ),
      ),
    );
  }
}
