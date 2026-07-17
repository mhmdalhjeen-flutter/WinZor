import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/phone_validation.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../auth/presentation/widgets/palestinian_phone_input.dart';
import '../../../chat/data/chat_context_store.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../competitions/data/models/competition_model.dart';
import '../../../competitions/presentation/providers/competitions_providers.dart';
import '../../../competitions/presentation/widgets/competition_join_sheet.dart';
import '../../../verification/presentation/providers/verification_gate_provider.dart';
import '../../data/models/user_center_models.dart';
import '../providers/user_center_providers.dart';
import '../widgets/achievement_road_section.dart';

class UserCenterPage extends ConsumerStatefulWidget {
  const UserCenterPage({super.key});

  @override
  ConsumerState<UserCenterPage> createState() => _UserCenterPageState();
}

class _UserCenterPageState extends ConsumerState<UserCenterPage> {
  String? _toast;
  bool _copied = false;

  void _showToast(String msg) {
    setState(() => _toast = msg);
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _toast == msg) setState(() => _toast = null);
    });
  }

  Future<void> _refreshAll() async {
    ref.invalidate(userCenterProvider);
    ref.invalidate(recentPointSourcesProvider);
    ref.invalidate(centerCompetitionsProvider);
    ref.invalidate(achievementsProvider);
    ref.invalidate(platformSettingsProvider);
  }

  String _timeLeft(DateTime? end) {
    if (end == null) return '—';
    final diff = end.difference(DateTime.now());
    if (diff.isNegative) return 'انتهى';
    if (diff.inDays > 0) return '${diff.inDays} يوم';
    if (diff.inHours > 0) return '${diff.inHours} ساعة';
    return '${diff.inMinutes} دقيقة';
  }

  Future<void> _logout() async {
    await ref.read(authProvider.notifier).logout();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F5F2),
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'سجّل الدخول لعرض نقاطك',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.push('/login'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text('تسجيل الدخول', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final centerAsync = ref.watch(userCenterProvider);
    final settingsAsync = ref.watch(platformSettingsProvider);
    final sourcesAsync = ref.watch(recentPointSourcesProvider);
    final compsAsync = ref.watch(centerCompetitionsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      body: Stack(
        children: [
          centerAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'تعذّر تحميل مركز المستخدم',
                    style: TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                  ),
                  TextButton(
                    onPressed: _refreshAll,
                    child: const Text('إعادة المحاولة', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                  ),
                ],
              ),
            ),
            data: (center) {
              final settings = settingsAsync.valueOrNull ?? const PlatformSettings();
              final points = center.stats.points;
              final progress = center.level;
              final activeComps =
                  (compsAsync.valueOrNull ?? []).where((c) => !c.hasEnded).toList();

              return RefreshIndicator(
                onRefresh: _refreshAll,
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 120),
                  children: [
                    _PointsHero(
                      center: center,
                      progress: progress,
                      displayPoints: points,
                      onEditName: () => _editName(center),
                      onAvatar: () => _pickAvatar(),
                      onPhone: () => _openPhoneSheet(center),
                    ),
                    const SizedBox(height: 16),
                    if (settings.showWheelBtn || settings.referralProgram)
                      _EarnSection(
                        showWheel: settings.showWheelBtn,
                        showReferral: settings.referralProgram,
                        onWheel: () => context.push('/wheel'),
                        onReferral: () => _openReferral(center.user.referralCode),
                      ),
                    const SizedBox(height: 16),
                    _PointSourcesSection(sourcesAsync: sourcesAsync),
                    if (settings.storeCompetitions) ...[
                      const SizedBox(height: 16),
                      _CompetitionsSection(
                        loading: compsAsync.isLoading,
                        error: compsAsync.hasError,
                        competitions: activeComps,
                        points: points,
                        timeLeft: _timeLeft,
                        onRetry: () => ref.invalidate(centerCompetitionsProvider),
                        onViewAll: () => context.push('/competitions'),
                        onJoin: (c) => _openJoinSheet(c, points),
                      ),
                    ],
                    const SizedBox(height: 16),
                    AchievementRoadSection(
                      points: points,
                      onUnlock: () {
                        ref.invalidate(userCenterProvider);
                        ref.invalidate(achievementsProvider);
                      },
                    ),
                    const SizedBox(height: 16),
                    _StatsGrid(stats: center.stats),
                    const SizedBox(height: 12),
                    _ReferralCodeRow(
                      code: center.user.referralCode ?? auth.user?['referralCode']?.toString(),
                      copied: _copied,
                      onCopy: () async {
                        final code = center.user.referralCode ?? '';
                        await Clipboard.setData(ClipboardData(text: code));
                        setState(() => _copied = true);
                        Future.delayed(const Duration(seconds: 2), () {
                          if (mounted) setState(() => _copied = false);
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    _OptionsSection(
                      onSuggest: () => _openSuggest(),
                      onSupport: () => _contactAdmin(),
                      onLegal: () => _openLegal(center.legal),
                      onPrefs: () => _openPrefs(center),
                    ),
                    const SizedBox(height: 12),
                    _ActionButton(
                      label: 'صناديق الجوائز',
                      icon: LucideIcons.gift,
                      color: const Color(0xFFD97706),
                      bg: const Color(0xFFFFFBEB),
                      border: const Color(0xFFFDE68A),
                      onTap: () => context.push('/chests'),
                    ),
                    const SizedBox(height: 10),
                    _ActionButton(
                      label: 'تغيير كلمة المرور',
                      icon: LucideIcons.lock,
                      color: AppColors.primary,
                      bg: AppColors.primary.withOpacity(0.05),
                      border: AppColors.primary.withOpacity(0.15),
                      onTap: () => context.push('/change-password'),
                    ),
                    const SizedBox(height: 10),
                    _ActionButton(
                      label: 'تسجيل الخروج',
                      icon: LucideIcons.logOut,
                      color: const Color(0xFFEF4444),
                      bg: const Color(0xFFFEF2F2),
                      border: const Color(0xFFFEE2E2),
                      onTap: _logout,
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

  Future<void> _editName(UserCenterData center) async {
    final controller = TextEditingController(text: center.user.name);
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تعديل الاسم', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
        content: TextField(
          controller: controller,
          autofocus: true,
          style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('حفظ', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );
    if (saved != true || !mounted) return;
    try {
      final data = await ref.read(userCenterRepositoryProvider).updateProfile(name: controller.text.trim());
      final user = data['user'];
      if (user is Map) {
        ref.read(authProvider.notifier).updateUser({'name': user['name']});
      }
      _showToast('تم تحديث الاسم');
      ref.invalidate(userCenterProvider);
    } catch (e) {
      _showToast('فشل التحديث');
    }
  }

  Future<void> _pickAvatar() async {
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('تغيير الصورة', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
              const SizedBox(height: 12),
              ListTile(
                leading: const Icon(LucideIcons.camera),
                title: const Text('الكاميرا', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
                onTap: () {
                  Navigator.pop(ctx);
                  _uploadAvatarFrom(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(LucideIcons.image),
                title: const Text('المعرض', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
                onTap: () {
                  Navigator.pop(ctx);
                  _uploadAvatarFrom(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _uploadAvatarFrom(ImageSource source) async {
    try {
      final picked = await ImagePicker().pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );
      if (picked == null) return;

      final url = await ref.read(imageUploadServiceProvider).uploadImageFile(picked.path);
      await ref.read(userCenterRepositoryProvider).updateProfile(avatar: url);
      await _refreshAll();
      _showToast('تم تحديث الصورة');
    } catch (e) {
      _showToast(e.toString().replaceFirst('Exception: ', '').replaceFirst('StateError: ', ''));
    }
  }

  Future<void> _openPhoneSheet(UserCenterData center) async {
    var step = 'request';
    var phoneValue = '';
    final codeCtrl = TextEditingController();

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return Padding(
              padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text('تغيير الهاتف', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                      ),
                      IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(LucideIcons.x)),
                    ],
                  ),
                  if (step == 'request') ...[
                    PalestinianPhoneInput(
                      value: phoneValue,
                      onChanged: (v) => setModal(() => phoneValue = v),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 14)),
                      onPressed: () async {
                        final err = PhoneValidation.getLocalPhoneError(phoneValue);
                        if (err != null) {
                          _showToast(err);
                          return;
                        }
                        try {
                          final data = await ref.read(userCenterRepositoryProvider).requestPhoneChange(
                                PhoneValidation.normalizeLocalPhone(phoneValue),
                              );
                          setModal(() => step = 'verify');
                          _showToast(data['message']?.toString() ?? 'تم إرسال رمز التحقق عبر SMS');
                        } catch (_) {
                          _showToast('فشل الطلب');
                        }
                      },
                      child: const Text('إرسال رمز التحقق', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                    ),
                  ] else ...[
                    const Text(
                      'تحقق من رسائل SMS على هاتفك',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: codeCtrl,
                      textAlign: TextAlign.center,
                      maxLength: 6,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(hintText: '6 أرقام', counterText: ''),
                      style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 4, fontFamily: 'Cairo'),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 14)),
                      onPressed: () async {
                        try {
                          final data = await ref
                              .read(userCenterRepositoryProvider)
                              .verifyPhoneChange(codeCtrl.text.trim());
                          ref.read(authProvider.notifier).updateUser({'phone': data['phone']});
                          if (ctx.mounted) Navigator.pop(ctx);
                          _showToast('تم تحديث الهاتف');
                          ref.invalidate(userCenterProvider);
                        } catch (_) {
                          _showToast('رمز غير صحيح');
                        }
                      },
                      child: const Text('تأكيد', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _openReferral(String? code) async {
    final safeCode = code ?? '';
    final link = 'https://winzor.onrender.com/intro?ref=${Uri.encodeComponent(safeCode)}';
    await showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text('كروت مجانية', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            const SizedBox(height: 8),
            const Text(
              '3 نقاط لكل تسجيل ناجح عبر رابطك',
              style: TextStyle(fontSize: 12, color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF3F4F6)),
              ),
              child: Text(link, style: const TextStyle(fontSize: 11, fontFamily: 'monospace')),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: link));
                      _showToast('تم نسخ رابط الإحالة');
                    },
                    icon: const Icon(LucideIcons.copy, size: 16),
                    label: const Text('نسخ', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: link));
                      _showToast('تم نسخ رابط الإحالة للمشاركة');
                    },
                    icon: const Icon(LucideIcons.share2, size: 16),
                    label: const Text('مشاركة', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openJoinSheet(CenterCompetition comp, int points) async {
    final competition = CompetitionModel(
      id: comp.id,
      title: comp.title,
      description: comp.description,
      image: comp.image,
      minPoints: comp.minPoints,
      pointsPerEntry: comp.pointsPerEntry,
      endDate: comp.endDate,
      hasEnded: comp.hasEnded,
      joined: comp.joined,
      myEntries: comp.myEntries,
    );

    await showCompetitionJoinSheet(
      context: context,
      ref: ref,
      competition: competition,
    );
    ref.invalidate(centerCompetitionsProvider);
    ref.invalidate(userCenterProvider);
    ref.invalidate(competitionsListProvider);
    ref.invalidate(featuredCompetitionsProvider);
  }

  Future<void> _openSuggest() async {
    final controller = TextEditingController();
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('اقتراح للإدارة', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
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
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return DraggableScrollableSheet(
              expand: false,
              initialChildSize: 0.75,
              minChildSize: 0.5,
              maxChildSize: 0.95,
              builder: (_, scrollCtrl) {
                return Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Expanded(
                            child: Text('الشروط والأحكام', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                          ),
                          IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(LucideIcons.x)),
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
                                label: Text(t.$2, style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 11)),
                                selected: tab == t.$1,
                                onSelected: (_) => setModal(() => tab = t.$1),
                                selectedColor: AppColors.primary,
                                labelStyle: TextStyle(color: tab == t.$1 ? Colors.white : Colors.grey),
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: SingleChildScrollView(
                          controller: scrollCtrl,
                          child: Text(
                            legal.byTab(tab).isEmpty ? '—' : legal.byTab(tab),
                            style: const TextStyle(height: 1.6, fontFamily: 'Cairo', color: Color(0xFF4B5563)),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
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
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            Widget chips(List<FlatCategory> cats, List<String> selected, void Function(String) toggle) {
              if (cats.isEmpty) {
                return const Text('لا توجد تصنيفات بعد', style: TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'Cairo'));
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
                    side: BorderSide(color: on ? AppColors.primary : const Color(0xFFF3F4F6), width: 2),
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

            return DraggableScrollableSheet(
              expand: false,
              initialChildSize: 0.88,
              builder: (_, scrollCtrl) {
                return ListView(
                  controller: scrollCtrl,
                  padding: const EdgeInsets.all(20),
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text('تفضيلاتك', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                        ),
                        IconButton(onPressed: () => Navigator.pop(ctx), icon: const Icon(LucideIcons.x)),
                      ],
                    ),
                    const Text(
                      'لتحسين ترتيب العروض فقط — وليس للتتبع.',
                      style: TextStyle(fontSize: 12, color: Colors.grey, fontFamily: 'Cairo'),
                    ),
                    const SizedBox(height: 16),
                    const Text('منطقتك', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
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
                          return DropdownMenuItem(value: id, child: Text(r['name']?.toString() ?? '—'));
                        }),
                      ],
                      onChanged: (v) => setModal(() => prefs = prefs.copyWith(regionId: v ?? '')),
                    ),
                    const SizedBox(height: 16),
                    const Text('اهتماماتك (تصنيفات العروض)', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                    const SizedBox(height: 8),
                    chips(storeCats, prefs.interests, (n) => toggle('interests', n)),
                    const SizedBox(height: 16),
                    const Text('أنواع المتاجر', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                    const SizedBox(height: 8),
                    chips(storeCats, prefs.storeTypes, (n) => toggle('storeTypes', n)),
                    const SizedBox(height: 16),
                    const Text('منتجات تهمك', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
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
                      child: const Text('حفظ التفضيلات', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
                    ),
                  ],
                );
              },
            );
          },
        );
      },
    );
  }
}

// ─── Section widgets ───────────────────────────────────────────────

class _PointsHero extends StatelessWidget {
  final UserCenterData center;
  final dynamic progress;
  final int displayPoints;
  final VoidCallback onEditName;
  final VoidCallback onAvatar;
  final VoidCallback onPhone;

  const _PointsHero({
    required this.center,
    required this.progress,
    required this.displayPoints,
    required this.onEditName,
    required this.onAvatar,
    required this.onPhone,
  });

  @override
  Widget build(BuildContext context) {
    final avatar = center.user.avatar;
    final stageColor = Color(progress.stage.color.value);
    final stars = '★' * (progress.stage.stars as int);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(32),
        gradient: const LinearGradient(
          colors: [Color(0xFF1E0A3C), Color(0xFF6D28D9), Color(0xFFC41F1F)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF581C87).withOpacity(0.35),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white24),
                ),
                child: const Row(
                  children: [
                    Icon(LucideIcons.trophy, size: 13, color: Color(0xFFFCD34D)),
                    SizedBox(width: 6),
                    Text('نقاطي', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                  ],
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.white24),
                ),
                child: Row(
                  children: [
                    const Icon(LucideIcons.mail, size: 10, color: Colors.white70),
                    const SizedBox(width: 4),
                    Text(
                      center.user.email ?? '—',
                      style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              GestureDetector(
                onTap: onAvatar,
                child: Stack(
                  children: [
                    Container(
                      width: 80,
                      height: 80,
                      padding: const EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(22),
                        gradient: const LinearGradient(colors: [Color(0xFFFCD34D), Colors.white, Color(0xFFC4B5FD)]),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(19),
                        child: AppImage(
                          src: avatar,
                          fit: BoxFit.cover,
                          errorWidget: const ColoredBox(
                            color: Colors.white,
                            child: Icon(LucideIcons.user, size: 36),
                          ),
                          placeholder: const ColoredBox(
                            color: Colors.white,
                            child: Icon(LucideIcons.user, size: 36),
                          ),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: -2,
                      right: -2,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(LucideIcons.camera, size: 14, color: AppColors.primary),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            center.user.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                          ),
                        ),
                        IconButton(
                          onPressed: onEditName,
                          icon: const Icon(LucideIcons.pencil, size: 14, color: Colors.white70),
                        ),
                      ],
                    ),
                    Wrap(
                      spacing: 8,
                      runSpacing: 6,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black26,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: Colors.white24),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.medal, size: 12, color: Color(0xFFFCD34D)),
                              const SizedBox(width: 4),
                              Text(
                                progress.stage.label,
                                style: TextStyle(color: stageColor, fontSize: 11, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                              ),
                              Text(' $stars', style: const TextStyle(color: Colors.white70, fontSize: 10)),
                            ],
                          ),
                        ),
                        if (center.user.phone != null && center.user.phone!.isNotEmpty)
                          GestureDetector(
                            onTap: onPhone,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: Colors.white24),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(LucideIcons.phone, size: 10, color: Colors.white70),
                                  const SizedBox(width: 4),
                                  Text(
                                    center.user.phone!,
                                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.2),
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Colors.white24),
            ),
            child: Column(
              children: [
                const Text('عدد النقاط', style: TextStyle(color: Color(0xFFFEF3C7), fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                const SizedBox(height: 4),
                Text(
                  NumberFormat('#,###', 'en_US').format(displayPoints),
                  style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
                ),
                const Text('نقطة مكافأة جاهزة للاستخدام', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
              ],
            ),
          ),
          if (center.user.phone == null || center.user.phone!.isEmpty) ...[
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFDE68A),
                  foregroundColor: const Color(0xFF78350F),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                onPressed: onPhone,
                icon: const Icon(LucideIcons.phone, size: 18),
                label: const Text('إضافة رقم الهاتف', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Text('تقدّم المستوى', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                  const Spacer(),
                  if (progress.next != null)
                    Text(
                      '${progress.pointsToNext} نقطة → ${progress.next.label}',
                      style: const TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                    ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(999),
                child: LinearProgressIndicator(
                  value: ((progress.progress as num).toDouble() / 100).clamp(0.0, 1.0),
                  minHeight: 12,
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation(Color(0xFFFBBF24)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _EarnSection extends StatelessWidget {
  final bool showWheel;
  final bool showReferral;
  final VoidCallback onWheel;
  final VoidCallback onReferral;

  const _EarnSection({
    required this.showWheel,
    required this.showReferral,
    required this.onWheel,
    required this.onReferral,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (showWheel)
          _EarnCard(
            title: 'احصل على نقاط من عجلة الحظ',
            subtitle: 'لف واربح نقاطاً فورية',
            colors: const [Color(0xFF7C3AED), Color(0xFFC026D3), Color(0xFFB91C1C)],
            emoji: '🎡',
            onTap: onWheel,
          ),
        if (showWheel && showReferral) const SizedBox(height: 10),
        if (showReferral)
          _EarnCard(
            title: 'اكسب نقاط مجانية من دعوة أصدقائك',
            subtitle: 'شارك كودك واكسب مكافآت',
            colors: const [Color(0xFF2563EB), Color(0xFF0EA5E9), Color(0xFF06B6D4)],
            emoji: '👥',
            onTap: onReferral,
          ),
      ],
    );
  }
}

class _EarnCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final List<Color> colors;
  final String emoji;
  final VoidCallback onTap;

  const _EarnCard({
    required this.title,
    required this.subtitle,
    required this.colors,
    required this.emoji,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Ink(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: LinearGradient(colors: colors),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(emoji, style: const TextStyle(fontSize: 22)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 13)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronLeft, color: Colors.white70, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}

class _PointSourcesSection extends StatelessWidget {
  final AsyncValue sourcesAsync;

  const _PointSourcesSection({required this.sourcesAsync});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'آخر مصادر حصولك على النقاط',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
        ),
        const SizedBox(height: 10),
        sourcesAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (_, __) => _emptyBox('تعذّر تحميل مصادر النقاط'),
          data: (sources) {
            if (sources.isEmpty) {
              return _emptyBox('لم تحصل على نقاط بعد — جرّب عجلة الحظ أو تسوّق من المتاجر المعتمدة');
            }
            return Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFF3F4F6)),
              ),
              child: Column(
                children: [
                  for (var i = 0; i < sources.length; i++) ...[
                    if (i > 0) const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              sources[i].label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                            ),
                          ),
                          Text(
                            '+${NumberFormat('#,###', 'en_US').format(sources[i].points)}',
                            style: const TextStyle(
                              color: Color(0xFF059669),
                              fontWeight: FontWeight.w900,
                              fontFamily: 'Cairo',
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _emptyBox(String text) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          border: Border.all(color: const Color(0xFFF3F4F6)),
        ),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo', fontSize: 13),
        ),
      );
}

class _CompetitionsSection extends StatelessWidget {
  final bool loading;
  final bool error;
  final List<CenterCompetition> competitions;
  final int points;
  final String Function(DateTime?) timeLeft;
  final VoidCallback onRetry;
  final VoidCallback onViewAll;
  final void Function(CenterCompetition) onJoin;

  const _CompetitionsSection({
    required this.loading,
    required this.error,
    required this.competitions,
    required this.points,
    required this.timeLeft,
    required this.onRetry,
    required this.onViewAll,
    required this.onJoin,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text('المسابقات المتاحة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            ),
            TextButton(
              onPressed: onViewAll,
              child: const Text('عرض الكل', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 11)),
            ),
          ],
        ),
        if (loading)
          const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (error)
          Column(
            children: [
              const Text('تعذّر تحميل المسابقات', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
              TextButton(onPressed: onRetry, child: const Text('إعادة المحاولة')),
            ],
          )
        else if (competitions.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: const Color(0xFFF3F4F6)),
            ),
            child: const Text(
              'لا مسابقات متاحة حالياً',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
            ),
          )
        else
          ...competitions.map((comp) {
            final eligible = points >= comp.minPoints;
            final missing = (comp.minPoints - points).clamp(0, 1 << 30);
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFF3F4F6)),
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: SizedBox(
                            width: 72,
                            height: 72,
                            child: comp.image != null && comp.image!.startsWith('http')
                                ? CachedNetworkImage(imageUrl: comp.image!, fit: BoxFit.cover)
                                : Container(
                                    color: const Color(0xFFEDE9FE),
                                    alignment: Alignment.center,
                                    child: const Text('🏆', style: TextStyle(fontSize: 28)),
                                  ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                comp.title,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 14),
                              ),
                              if (comp.description != null && comp.description!.isNotEmpty)
                                Text(
                                  comp.description!,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(fontSize: 11, color: Colors.grey, fontFamily: 'Cairo'),
                                ),
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 6,
                                children: [
                                  _pill('${comp.minPoints}+ نقطة', const Color(0xFFF5F3FF), const Color(0xFF6D28D9)),
                                  _pill(timeLeft(comp.endDate), const Color(0xFFF3F4F6), const Color(0xFF4B5563)),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: const BoxDecoration(
                      color: Color(0xFFF9FAFB),
                      borderRadius: BorderRadius.vertical(bottom: Radius.circular(22)),
                    ),
                    child: eligible
                        ? Column(
                            children: [
                              Row(
                                children: [
                                  const Expanded(
                                    child: Text(
                                      'يمكنك المشاركة الآن',
                                      style: TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 12),
                                    ),
                                  ),
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF7C3AED),
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                    ),
                                    onPressed: () => onJoin(comp),
                                    child: Text(
                                      comp.joined ? 'زيادة المشاركات' : 'أريد المشاركة',
                                      style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900, fontSize: 11),
                                    ),
                                  ),
                                ],
                              ),
                              if (comp.joined)
                                Padding(
                                  padding: const EdgeInsets.only(top: 6),
                                  child: Text(
                                    'لديك ${comp.myEntries} مشاركة',
                                    style: const TextStyle(color: Color(0xFF15803D), fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'Cairo'),
                                  ),
                                ),
                            ],
                          )
                        : Text(
                            'تحتاج إلى $missing نقطة للمشاركة',
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Color(0xFFB45309), fontWeight: FontWeight.w900, fontFamily: 'Cairo', fontSize: 12),
                          ),
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }

  Widget _pill(String text, Color bg, Color fg) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
        child: Text(text, style: TextStyle(color: fg, fontSize: 10, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
      );
}

class _StatsGrid extends StatelessWidget {
  final UserCenterStats stats;

  const _StatsGrid({required this.stats});

  @override
  Widget build(BuildContext context) {
    final items = [
      (LucideIcons.medal, 'مسابقات', '${stats.competitionsJoined}', const Color(0xFFA855F7), false),
      (LucideIcons.gift, 'جوائز', '${stats.prizesWon}', const Color(0xFFF59E0B), false),
      (LucideIcons.users, 'دعوات', '${stats.referralsCount}', const Color(0xFF3B82F6), false),
      (LucideIcons.store, 'متاجر', '${stats.membershipsCount}', const Color(0xFF10B981), false),
      (LucideIcons.ticket, 'أكواد', '${stats.codesUsed}', const Color(0xFFF43F5E), false),
      (
        LucideIcons.star,
        'آخر جائزة',
        (stats.lastPrize?.name ?? '—').length > 12
            ? '${(stats.lastPrize?.name ?? '—').substring(0, 12)}…'
            : (stats.lastPrize?.name ?? '—'),
        const Color(0xFFEAB308),
        true,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        childAspectRatio: 1.55,
      ),
      itemBuilder: (_, i) {
        final item = items[i];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFF3F4F6)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(item.$1, size: 18, color: item.$4),
              const Spacer(),
              Text(item.$2, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.bold, fontFamily: 'Cairo')),
              Text(
                item.$3,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: item.$5 ? 12 : 18,
                  fontWeight: FontWeight.w900,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ReferralCodeRow extends StatelessWidget {
  final String? code;
  final bool copied;
  final VoidCallback onCopy;

  const _ReferralCodeRow({required this.code, required this.copied, required this.onCopy});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('كود الدعوة', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                Text(
                  code?.isNotEmpty == true ? code! : '—',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                ),
              ],
            ),
          ),
          Material(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: onCopy,
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Icon(copied ? LucideIcons.check : LucideIcons.copy, color: AppColors.primary, size: 18),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OptionsSection extends StatelessWidget {
  final VoidCallback onSuggest;
  final VoidCallback onSupport;
  final VoidCallback onLegal;
  final VoidCallback onPrefs;

  const _OptionsSection({
    required this.onSuggest,
    required this.onSupport,
    required this.onLegal,
    required this.onPrefs,
  });

  @override
  Widget build(BuildContext context) {
    final options = [
      (LucideIcons.lightbulb, 'قدم اقتراحات', 'شاركنا أفكارك لتحسين المنصة', onSuggest, const Color(0xFFF59E0B)),
      (LucideIcons.headphones, 'الدعم الفني', 'تواصل مع فريق المساعدة', onSupport, const Color(0xFF0EA5E9)),
      (LucideIcons.scrollText, 'الشروط والأحكام', 'الخصوصية وإخلاء المسؤولية', onLegal, const Color(0xFF64748B)),
      (LucideIcons.tags, 'تخصيص أفضل العروض', 'اضبط اهتماماتك وتفضيلاتك', onPrefs, const Color(0xFF8B5CF6)),
    ];

    return Column(
      children: options.map((o) {
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          child: Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            child: InkWell(
              onTap: o.$4,
              borderRadius: BorderRadius.circular(22),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: o.$5.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Icon(o.$1, color: o.$5, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(o.$2, style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
                          Text(o.$3, style: const TextStyle(fontSize: 11, color: Colors.grey, fontFamily: 'Cairo')),
                        ],
                      ),
                    ),
                    const Icon(LucideIcons.chevronLeft, color: Color(0xFFD1D5DB), size: 18),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  final Color bg;
  final Color border;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.bg,
    required this.border,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: border),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 18),
              const SizedBox(width: 8),
              Text(label, style: TextStyle(color: color, fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            ],
          ),
        ),
      ),
    );
  }
}
