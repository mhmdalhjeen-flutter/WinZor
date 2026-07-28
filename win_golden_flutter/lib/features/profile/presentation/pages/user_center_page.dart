import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/referral_cards_sheet.dart';
import '../../../../core/widgets/smooth_bottom_sheet.dart';
import '../../../auth/presentation/providers/auth_gate_provider.dart';
import '../../../auth/utils/auth_gate_messages.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../chat/data/chat_context_store.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/user_center_models.dart';
import '../providers/user_center_providers.dart';
import '../widgets/points_activity_timeline.dart';
import '../widgets/points_options_menu.dart';
import '../widgets/points_premium_header.dart';
import '../widgets/points_referral_card.dart';

class UserCenterPage extends ConsumerStatefulWidget {
  const UserCenterPage({super.key});

  @override
  ConsumerState<UserCenterPage> createState() => _UserCenterPageState();
}

class _UserCenterPageState extends ConsumerState<UserCenterPage> {
  String? _toast;

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _toast == msg) setState(() => _toast = null);
    });
  }

  Future<void> _refreshAll() async {
    ref.invalidate(userCenterProvider);
    ref.invalidate(recentPointSourcesProvider);
    ref.invalidate(platformSettingsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F5F2),
        body: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFF3F4F6)),
                ),
                child: Column(
                  children: [
                    const Icon(LucideIcons.coins, size: 40, color: AppColors.primary),
                    const SizedBox(height: 12),
                    const Text(
                      'سجّل الدخول لحفظ نقاطك',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      AuthGateMessages.pointsRewards,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        fontFamily: 'Cairo',
                        color: Colors.grey.shade600,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => ref.read(authGateProvider.notifier).runWithAuth(
                              () {},
                              message: AuthGateMessages.pointsRewards,
                            ),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                        child: const Text(
                          'تسجيل الدخول',
                          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              PointsOptionsMenu(
                onSupport: _contactAdminGuest,
                onSuggest: () => ref.read(authGateProvider.notifier).runWithAuth(
                      () {},
                      message: AuthGateMessages.pointsRewards,
                    ),
                onPrefs: () => ref.read(authGateProvider.notifier).runWithAuth(
                      () {},
                      message: AuthGateMessages.pointsRewards,
                    ),
                onAbout: () => context.push('/intro'),
              ),
            ],
          ),
        ),
      );
    }

    final centerAsync = ref.watch(userCenterProvider);
    final settingsAsync = ref.watch(platformSettingsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      body: Stack(
        children: [
          centerAsync.when(
            loading: () => _buildOfflineFallback(auth),
            error: (_, __) => _buildOfflineFallback(auth),
            data: (center) {
              final settings = settingsAsync.valueOrNull ?? const PlatformSettings();
              final points = center.stats.points;

              return RefreshIndicator(
                onRefresh: _refreshAll,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
                  children: [
                    PointsPremiumHeader(user: center.user, points: points),
                    if (settings.referralProgram) ...[
                      const SizedBox(height: 14),
                      PointsReferralCard(
                        onTap: () => _openReferral(center.user.referralCode),
                      ),
                    ],
                    const SizedBox(height: 18),
                    const PointsActivityTimeline(),
                    const SizedBox(height: 18),
                    PointsOptionsMenu(
                      onSupport: _contactAdmin,
                      onSuggest: _openSuggest,
                      onPrefs: () => _openPrefs(center),
                      onAbout: () => context.push('/intro'),
                    ),
                  ],
                ),
              );
            },
          ),
          if (_toast != null)
            Positioned(
              left: 16,
              right: 16,
              bottom: 100,
              child: Material(
                color: const Color(0xFF111827),
                borderRadius: BorderRadius.circular(16),
                elevation: 8,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Text(
                    _toast!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'Cairo',
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOfflineFallback(AuthState auth) {
    final authUser = auth.user;
    if (authUser == null) {
      return const Center(child: CircularProgressIndicator());
    }

    final points = (authUser['points'] as num?)?.toInt() ?? 0;
    final user = CenterUser(
      id: authUser['_id']?.toString() ?? '',
      name: authUser['name']?.toString() ?? '',
      avatar: authUser['avatar']?.toString(),
      points: points,
    );

    return RefreshIndicator(
      onRefresh: _refreshAll,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
        children: [
          PointsPremiumHeader(user: user, points: points),
          const SizedBox(height: 18),
          const PointsActivityTimeline(),
        ],
      ),
    );
  }

  Future<void> _openReferral(String? code) async {
    await showReferralCardsSheet(context, referralCode: code);
  }

  Future<void> _openSuggest() async {
    final controller = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text(
          'اقتراح للإدارة',
          style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
        ),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(hintText: 'اكتب اقتراحك...'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          TextButton(
            onPressed: () {
              if (controller.text.trim().isEmpty) return;
              ref.read(verificationGateProvider.notifier).runWithVerification(() async {
                try {
                  await ref
                      .read(userCenterRepositoryProvider)
                      .submitSuggestion(controller.text.trim());
                  if (ctx.mounted) Navigator.pop(ctx);
                  _showToast('شكراً — وصل اقتراحك للإدارة');
                } catch (e) {
                  final gate = ref.read(verificationGateProvider.notifier);
                  if (gate.handleApiVerificationError(e, () async {
                    await ref
                        .read(userCenterRepositoryProvider)
                        .submitSuggestion(controller.text.trim());
                    if (ctx.mounted) Navigator.pop(ctx);
                    _showToast('شكراً — وصل اقتراحك للإدارة');
                  })) {
                    return;
                  }
                  _showToast('فشل الإرسال');
                }
              });
            },
            child: const Text('إرسال', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
  }

  void _contactAdminGuest() {
    ref.read(authGateProvider.notifier).runWithAuth(
          _contactAdmin,
          message: AuthGateMessages.generic,
        );
  }

  Future<void> _contactAdmin() async {
    try {
      final data = await ref.read(userCenterRepositoryProvider).getAdminContact();
      final adminId = data['adminId']?.toString();
      if (adminId == null || adminId.isEmpty) {
        _showToast('تعذّر فتح المحادثة');
        return;
      }
      await ChatContextStore.save({
        'recipientId': adminId,
        'context': {
          'itemType': 'Support',
          'itemName': 'تواصل مع الإدارة',
        },
        'prefillText': 'مرحباً، أحتاج مساعدة من الإدارة.',
      });
      if (!mounted) return;
      context.push('/chat');
    } catch (_) {
      _showToast('تعذّر فتح المحادثة');
    }
  }

  Future<void> _openLegal(UserCenterLegal legal) async {
    var tab = 'terms';
    await showSmoothBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final sheetHeight = MediaQuery.of(ctx).size.height * 0.75;
        return Container(
          height: sheetHeight,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: StatefulBuilder(
            builder: (ctx, setModal) {
              return Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'الشروط والأحكام',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: const Icon(LucideIcons.x),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        for (final t in const [
                          ('terms', 'الشروط'),
                          ('privacy', 'الخصوصية'),
                          ('disclaimer', 'إخلاء'),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: ChoiceChip(
                              label: Text(
                                t.$2,
                                style: const TextStyle(
                                  fontFamily: 'Cairo',
                                  fontWeight: FontWeight.w900,
                                  fontSize: 11,
                                ),
                              ),
                              selected: tab == t.$1,
                              onSelected: (_) => setModal(() => tab = t.$1),
                              selectedColor: AppColors.primary,
                              labelStyle: TextStyle(
                                color: tab == t.$1 ? Colors.white : Colors.grey,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: SingleChildScrollView(
                        child: Text(
                          legal.byTab(tab).isEmpty ? '—' : legal.byTab(tab),
                          style: const TextStyle(
                            height: 1.6,
                            fontFamily: 'Cairo',
                            color: Color(0xFF4B5563),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _openPrefs(UserCenterData center) async {
    var prefs = center.user.preferences;
    final regions = await ref.read(flatRegionsProvider.future);
    final storeCats = await ref.read(storeFlatCategoriesProvider.future);
    final productCats = await ref.read(productFlatCategoriesProvider.future);

    if (!mounted) return;
    await showSmoothBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final sheetHeight = MediaQuery.of(ctx).size.height * 0.88;
        return Container(
          height: sheetHeight,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          ),
          child: StatefulBuilder(
            builder: (ctx, setModal) {
              Widget chips(
                List<FlatCategory> cats,
                List<String> selected,
                void Function(String) toggle,
              ) {
                if (cats.isEmpty) {
                  return const Text(
                    'لا توجد تصنيفات بعد',
                    style: TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'Cairo'),
                  );
                }
                return Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: cats.map((c) {
                    final on = selected.contains(c.name);
                    return FilterChip(
                      label: Text(
                        '${c.icon != null && c.icon!.isNotEmpty ? '${c.icon} ' : ''}${c.name}',
                        style: TextStyle(
                          fontFamily: 'Cairo',
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                          color: on ? Colors.white : Colors.grey,
                        ),
                      ),
                      selected: on,
                      onSelected: (_) => setModal(() => toggle(c.name)),
                      selectedColor: AppColors.primary,
                      backgroundColor: Colors.white,
                      side: BorderSide(
                        color: on ? AppColors.primary : const Color(0xFFF3F4F6),
                        width: 2,
                      ),
                    );
                  }).toList(),
                );
              }

              void toggle(String key, String val) {
                List<String> current;
                switch (key) {
                  case 'interests':
                    current = [...prefs.interests];
                    break;
                  case 'storeTypes':
                    current = [...prefs.storeTypes];
                    break;
                  default:
                    current = [...prefs.productInterests];
                }
                if (current.contains(val)) {
                  current.remove(val);
                } else {
                  current.add(val);
                }
                prefs = prefs.copyWith(
                  interests: key == 'interests' ? current : null,
                  storeTypes: key == 'storeTypes' ? current : null,
                  productInterests: key == 'productInterests' ? current : null,
                );
              }

              return ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'تفضيلاتك',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(LucideIcons.x),
                      ),
                    ],
                  ),
                  const Text(
                    'لتحسين ترتيب العروض فقط — وليس للتتبع.',
                    style: TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'منطقتك',
                    style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: prefs.regionId?.isNotEmpty == true ? prefs.regionId : null,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFFF9FAFB),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    hint: const Text('اختر المنطقة', style: TextStyle(fontFamily: 'Cairo')),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('اختر المنطقة')),
                      ...regions.map((r) {
                        final id = r['_id']?.toString() ?? '';
                        return DropdownMenuItem(
                          value: id,
                          child: Text(r['name']?.toString() ?? '—'),
                        );
                      }),
                    ],
                    onChanged: (v) => setModal(() => prefs = prefs.copyWith(regionId: v ?? '')),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'اهتماماتك (تصنيفات العروض)',
                    style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 8),
                  chips(storeCats, prefs.interests, (n) => toggle('interests', n)),
                  const SizedBox(height: 16),
                  const Text(
                    'أنواع المتاجر',
                    style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 8),
                  chips(storeCats, prefs.storeTypes, (n) => toggle('storeTypes', n)),
                  const SizedBox(height: 16),
                  const Text(
                    'منتجات تهمك',
                    style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 8),
                  chips(productCats, prefs.productInterests, (n) => toggle('productInterests', n)),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size(double.infinity, 52),
                    ),
                    onPressed: () {
                      ref.read(verificationGateProvider.notifier).runWithVerification(() async {
                        try {
                          final data = await ref
                              .read(userCenterRepositoryProvider)
                              .updatePreferences(prefs);
                          if (data['points'] != null) {
                            ref.read(authProvider.notifier).updateUser({
                              'points': data['points'],
                              'isVerified': true,
                            });
                          }
                          if (ctx.mounted) Navigator.pop(ctx);
                          _showToast(data['message']?.toString() ?? 'تم الحفظ');
                          ref.invalidate(userCenterProvider);
                        } catch (e) {
                          final gate = ref.read(verificationGateProvider.notifier);
                          if (gate.handleApiVerificationError(e, () async {
                            final data = await ref
                                .read(userCenterRepositoryProvider)
                                .updatePreferences(prefs);
                            if (data['points'] != null) {
                              ref.read(authProvider.notifier).updateUser({
                                'points': data['points'],
                                'isVerified': true,
                              });
                            }
                            if (ctx.mounted) Navigator.pop(ctx);
                            _showToast(data['message']?.toString() ?? 'تم الحفظ');
                            ref.invalidate(userCenterProvider);
                          })) {
                            return;
                          }
                          _showToast('فشل الحفظ');
                        }
                      });
                    },
                    child: const Text(
                      'حفظ التفضيلات',
                      style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}
