import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../home/presentation/providers/home_providers.dart';
import '../../../../core/cache/local_cache_service.dart';
import '../../../../core/cache/notification_preferences_store.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/smooth_bottom_sheet.dart';
import '../../data/models/user_center_models.dart';
import '../providers/user_center_providers.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  final _addressCtrl = TextEditingController();
  bool _savingAddress = false;

  @override
  void initState() {
    super.initState();
    _addressCtrl.text =
        LocalCacheService.getData('profile_address')?.toString() ?? '';
  }

  @override
  void dispose() {
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      maxHeight: 800,
      imageQuality: 85,
    );
    if (picked == null) return;
    try {
      final url = await ref.read(imageUploadServiceProvider).uploadImageFile(picked.path);
      await ref.read(userCenterRepositoryProvider).updateProfile(avatar: url);
      ref.invalidate(userCenterProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم تحديث الصورة'), behavior: SnackBarBehavior.floating),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل تحديث الصورة'), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _saveName(String current) async {
    final controller = TextEditingController(text: current);
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تعديل الاسم', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900)),
        content: TextField(controller: controller, autofocus: true),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('حفظ')),
        ],
      ),
    );
    if (saved != true) return;
    await ref.read(userCenterRepositoryProvider).updateProfile(name: controller.text.trim());
    ref.invalidate(userCenterProvider);
  }

  Future<void> _saveAddress() async {
    setState(() => _savingAddress = true);
    await LocalCacheService.save('profile_address', _addressCtrl.text.trim());
    setState(() => _savingAddress = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تم حفظ العنوان'), behavior: SnackBarBehavior.floating),
      );
    }
  }

  Future<void> _pickRegion(UserPreferences prefs) async {
    final regions = await ref.read(flatRegionsProvider.future);
    if (!mounted) return;
    String? selected = prefs.regionId;
    await showSmoothBottomSheet(
      context: context,
      builder: (ctx) => Container(
        padding: EdgeInsets.fromLTRB(16, 16, 16, 16 + MediaQuery.of(ctx).padding.bottom),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('اختر المنطقة', style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo')),
            const SizedBox(height: 12),
            SizedBox(
              height: 280,
              child: ListView.builder(
                itemCount: regions.length,
                itemBuilder: (_, i) {
                  final r = regions[i];
                  final id = r['_id']?.toString() ?? '';
                  final name = r['name']?.toString() ?? '';
                  return ListTile(
                    title: Text(name, style: const TextStyle(fontFamily: 'Cairo')),
                    trailing: selected == id ? const Icon(Icons.check, color: AppColors.primary) : null,
                    onTap: () async {
                      selected = id;
                      final updated = prefs.copyWith(regionId: id, regionName: name);
                      await ref.read(userCenterRepositoryProvider).updatePreferences(updated);
                      ref.invalidate(userCenterProvider);
                      if (ctx.mounted) Navigator.pop(ctx);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final centerAsync = ref.watch(userCenterProvider);
    final notifPrefs = NotificationPreferencesStore.all();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F5F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'الإعدادات',
          style: TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
        ),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(LucideIcons.chevronRight),
        ),
      ),
      body: centerAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => const Center(child: Text('تعذّر تحميل الإعدادات')),
        data: (center) {
          final user = center.user;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              _SectionCard(
                title: 'الملف الشخصي',
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: GestureDetector(
                        onTap: _pickAvatar,
                        child: CircleAvatar(
                          radius: 28,
                          backgroundImage: user.avatar != null && user.avatar!.isNotEmpty
                              ? CachedNetworkImageProvider(user.avatar!)
                              : null,
                          child: user.avatar == null || user.avatar!.isEmpty
                              ? const Icon(LucideIcons.camera)
                              : null,
                        ),
                      ),
                      title: const Text('الصورة الشخصية', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800)),
                      subtitle: const Text('اضغط لتغيير الصورة', style: TextStyle(fontSize: 11)),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('الاسم', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800)),
                      subtitle: Text(user.name, style: const TextStyle(fontFamily: 'Cairo')),
                      trailing: const Icon(LucideIcons.pencil, size: 16),
                      onTap: () => _saveName(user.name),
                    ),
                    const Divider(height: 1),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('المنطقة', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800)),
                      subtitle: Text(
                        user.preferences.regionName ?? 'غير محدد',
                        style: const TextStyle(fontFamily: 'Cairo'),
                      ),
                      trailing: const Icon(LucideIcons.chevronLeft, size: 16),
                      onTap: () => _pickRegion(user.preferences),
                    ),
                    const Divider(height: 1),
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: TextField(
                        controller: _addressCtrl,
                        decoration: InputDecoration(
                          labelText: 'العنوان',
                          labelStyle: const TextStyle(fontFamily: 'Cairo'),
                          suffixIcon: _savingAddress
                              ? const Padding(
                                  padding: EdgeInsets.all(12),
                                  child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                                )
                              : IconButton(
                                  icon: const Icon(LucideIcons.save, size: 18),
                                  onPressed: _saveAddress,
                                ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'إعدادات الإشعارات',
                child: Column(
                  children: NotificationPreferencesStore.types.entries.map((entry) {
                    final enabled = notifPrefs[entry.key] ?? true;
                    return SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(entry.value, style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w700)),
                      value: enabled,
                      activeTrackColor: AppColors.primary.withOpacity(0.35),
                      thumbColor: WidgetStateProperty.all(AppColors.primary),
                      onChanged: (v) async {
                        await NotificationPreferencesStore.setEnabled(entry.key, v);
                        if (mounted) setState(() {});
                      },
                    );
                  }).toList(),
                ),
              ),
              const SizedBox(height: 14),
              _SectionCard(
                title: 'الحساب',
                child: ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(LucideIcons.lock, color: AppColors.primary),
                  title: const Text('تغيير كلمة المرور', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w800)),
                  onTap: () => context.push('/change-password'),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final Widget child;

  const _SectionCard({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
