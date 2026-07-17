import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/notification_model.dart';
import '../providers/notifications_providers.dart';

/// React `Notifications.jsx` — list, mark read/all, competition_draw link open.
class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  IconData _typeIcon(String type) {
    if (type == 'order_point_gift') return LucideIcons.gift;
    if (type == 'referral_batch') return LucideIcons.userPlus;
    if (type == 'competition_draw') return LucideIcons.trophy;
    return LucideIcons.bell;
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    final local = dt.toLocal();
    return DateFormat('yyyy/MM/dd HH:mm').format(local);
  }

  Future<void> _onTap(WidgetRef ref, NotificationModel n) async {
    final link = n.drawOrUrlLink;
    if (n.type == 'competition_draw' && link != null) {
      final uri = Uri.tryParse(link);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
    if (n.read) return;
    await ref.read(notificationsListProvider.notifier).markRead(n.id);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9FAFB),
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'سجّل الدخول لعرض الإشعارات',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.push('/login'),
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text(
                      'تسجيل الدخول',
                      style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.w900),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final state = ref.watch(notificationsListProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(notificationsListProvider.notifier).load(),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
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
                      const SizedBox(width: 4),
                      const Icon(LucideIcons.bell, size: 22, color: AppColors.primary),
                      const SizedBox(width: 8),
                      const Text(
                        'الإشعارات',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFF111827),
                        ),
                      ),
                    ],
                  ),
                  if (state.hasUnread)
                    TextButton(
                      onPressed: () =>
                          ref.read(notificationsListProvider.notifier).markAllRead(),
                      style: TextButton.styleFrom(
                        backgroundColor: AppColors.primary.withOpacity(0.1),
                        foregroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'تعليم الكل كمقروء',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              if (state.isLoading && state.items.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Column(
                      children: [
                        SizedBox(
                          width: 28,
                          height: 28,
                          child: CircularProgressIndicator(strokeWidth: 2.5),
                        ),
                        SizedBox(height: 12),
                        Text(
                          'جاري تحميل الإشعارات...',
                          style: TextStyle(
                            fontFamily: 'Cairo',
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              else if (!state.isLoading && state.error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Text(
                    state.error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                    ),
                  ),
                )
              else if (!state.isLoading && state.items.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 64),
                  child: Text(
                    'لا توجد إشعارات بعد',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w800,
                      fontFamily: 'Cairo',
                    ),
                  ),
                )
              else
                ...state.items.map((n) => Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _NotificationTile(
                        notification: n,
                        icon: _typeIcon(n.type),
                        dateLabel: _formatDate(n.createdAt),
                        onTap: () => _onTap(ref, n),
                      ),
                    )),
            ],
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notification;
  final IconData icon;
  final String dateLabel;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.notification,
    required this.icon,
    required this.dateLabel,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final read = notification.read;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: read ? Colors.white : const Color(0xFFFFFBEB).withOpacity(0.8),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: read ? const Color(0xFFF3F4F6) : const Color(0xFFFDE68A),
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: read ? const Color(0xFFF3F4F6) : const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  size: 18,
                  color: read ? const Color(0xFF6B7280) : const Color(0xFFD97706),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              fontFamily: 'Cairo',
                              color: Color(0xFF111827),
                            ),
                          ),
                        ),
                        if (!read)
                          Container(
                            width: 8,
                            height: 8,
                            margin: const EdgeInsets.only(top: 6),
                            decoration: const BoxDecoration(
                              color: AppColors.primary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    if (notification.body.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        notification.body,
                        style: const TextStyle(
                          fontSize: 14,
                          fontFamily: 'Cairo',
                          color: Color(0xFF4B5563),
                        ),
                      ),
                    ],
                    if (dateLabel.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        dateLabel,
                        style: const TextStyle(
                          fontSize: 11,
                          fontFamily: 'Cairo',
                          color: Color(0xFF9CA3AF),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
