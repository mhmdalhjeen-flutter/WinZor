import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/media_url.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/honor_item_model.dart';
import '../providers/honor_providers.dart';

/// React `HonorBoard.jsx` — `/honor`
class HonorBoardPage extends ConsumerWidget {
  const HonorBoardPage({super.key});

  String _photoUrl(HonorItemModel item) {
    final winner = resolveImageUrl(item.winnerImage);
    if (winner != null) return winner;
    final avatar = resolveImageUrl(item.userAvatar);
    if (avatar != null) return avatar;
    final seed = Uri.encodeComponent(item.userName);
    return 'https://ui-avatars.com/api/?name=$seed&background=random';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: ElevatedButton(
              onPressed: () => context.push('/login'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text(
                'تسجيل الدخول',
                style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ),
      );
    }

    final honorAsync = ref.watch(honorBoardProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(honorBoardProvider);
            await ref.read(honorBoardProvider.future);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 16, 0),
                  child: Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/');
                          }
                        },
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFFF3F4F6)),
                        ),
                        icon: const Icon(LucideIcons.chevronRight, size: 20),
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(16, 8, 16, 16),
                  child: Column(
                    children: [
                      Icon(LucideIcons.trophy,
                          size: 48, color: Color(0xFFFACC15)),
                      SizedBox(height: 10),
                      Text(
                        'لوحة الشرف',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFF111827),
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        '🌟 كل فائز هنا قصة نجاح — وأنت قد تكون التالي!',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          fontFamily: 'Cairo',
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              ...honorAsync.when(
                loading: () => [
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          SizedBox(height: 10),
                          Text(
                            'جاري تحميل لوحة الشرف...',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              fontFamily: 'Cairo',
                              color: Color(0xFF9CA3AF),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                error: (_, __) => [
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            'تعذّر تحميل لوحة الشرف',
                            style: TextStyle(
                              color: Colors.red,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                          TextButton(
                            onPressed: () =>
                                ref.invalidate(honorBoardProvider),
                            child: const Text(
                              'إعادة المحاولة',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w900,
                                fontFamily: 'Cairo',
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                data: (items) {
                  if (items.isEmpty) {
                    return [
                      SliverToBoxAdapter(
                        child: Container(
                          margin: const EdgeInsets.all(16),
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [Color(0xFFFFFBEB), Colors.white],
                            ),
                            borderRadius: BorderRadius.circular(24),
                            border:
                                Border.all(color: const Color(0xFFFEF3C7)),
                          ),
                          child: const Column(
                            children: [
                              Icon(LucideIcons.star,
                                  size: 32, color: Color(0xFFFDE047)),
                              SizedBox(height: 8),
                              Text(
                                'لا فائزين حالياً',
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'شارك في المسابقات وكن أول من يظهر هنا!',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  fontFamily: 'Cairo',
                                  color: Color(0xFF9CA3AF),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ];
                  }

                  HonorItemModel? primary;
                  final secondary = <HonorItemModel>[];
                  for (final item in items) {
                    if (item.isPrimary && primary == null) {
                      primary = item;
                    } else {
                      secondary.add(item);
                    }
                  }

                  return [
                    if (primary != null)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(LucideIcons.sparkles,
                                      size: 16, color: Color(0xFFD97706)),
                                  SizedBox(width: 6),
                                  Text(
                                    'بطل الأسبوع',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w900,
                                      fontFamily: 'Cairo',
                                      color: Color(0xFFD97706),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              _WinnerCard(
                                item: primary,
                                photoUrl: _photoUrl(primary),
                                large: true,
                              ),
                            ],
                          ),
                        ),
                      ),
                    if (secondary.isNotEmpty) ...[
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.fromLTRB(16, 8, 16, 8),
                          child: Text(
                            'فائزون آخرون',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                              color: Color(0xFF374151),
                            ),
                          ),
                        ),
                      ),
                      SliverToBoxAdapter(
                        child: SizedBox(
                          height: 210,
                          child: ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: secondary.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 12),
                            itemBuilder: (context, index) {
                              final item = secondary[index];
                              return SizedBox(
                                width: MediaQuery.of(context).size.width * 0.78,
                                child: _WinnerCard(
                                  item: item,
                                  photoUrl: _photoUrl(item),
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                    ],
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(16, 24, 16, 40),
                        child: Text(
                          '« النجاح ليس صدفة — إنه قرار » 💪',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            fontStyle: FontStyle.italic,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                  ];
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _WinnerCard extends StatelessWidget {
  final HonorItemModel item;
  final String photoUrl;
  final bool large;

  const _WinnerCard({
    required this.item,
    required this.photoUrl,
    this.large = false,
  });

  Future<void> _openLink() async {
    final link = item.competitionLink;
    if (link == null || link.isEmpty) return;
    final uri = Uri.tryParse(link);
    if (uri == null) return;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final prizeImg = resolveImageUrl(item.awardImage);
    final photoSize = large ? 96.0 : 64.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A1033), Color(0xFF2D1B4E), Color(0xFF0B1220)],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: const Color(0x4DFDE68A)),
      ),
      child: Stack(
        children: [
          if (item.isPrimary)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFFACC15),
                  borderRadius: BorderRadius.circular(100),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(LucideIcons.crown, size: 12, color: Color(0xFF713F12)),
                    SizedBox(width: 4),
                    Text(
                      'فائز رئيسي',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                        color: Color(0xFF713F12),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          Column(
            children: [
              if (item.isPrimary) const SizedBox(height: 18),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: CachedNetworkImage(
                      imageUrl: photoUrl,
                      width: photoSize,
                      height: photoSize,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(
                        width: photoSize,
                        height: photoSize,
                        color: Colors.white24,
                        child: const Icon(LucideIcons.user, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.userName,
                          style: TextStyle(
                            fontSize: large ? 18 : 14,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.prizeLabel,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            fontFamily: 'Cairo',
                            color: Color(0xFFFDE68A),
                          ),
                        ),
                        if (item.message.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            item.message,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Cairo',
                              color: Colors.white.withOpacity(0.6),
                              height: 1.35,
                            ),
                          ),
                        ],
                        if (item.receivedAt != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            '🗓 ${DateFormat('yyyy/MM/dd').format(item.receivedAt!)}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Cairo',
                              color: Colors.white.withOpacity(0.4),
                            ),
                          ),
                        ],
                        if (item.competitionLink != null &&
                            item.competitionLink!.isNotEmpty)
                          TextButton(
                            onPressed: _openLink,
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'المسابقة',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    fontFamily: 'Cairo',
                                    color: Color(0xFF67E8F9),
                                  ),
                                ),
                                SizedBox(width: 4),
                                Icon(LucideIcons.externalLink,
                                    size: 10, color: Color(0xFF67E8F9)),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (prizeImg != null) ...[
                    const SizedBox(width: 8),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: CachedNetworkImage(
                        imageUrl: prizeImg,
                        width: 72,
                        height: 72,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
