import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/smooth_overlay.dart';
import '../../data/models/notification_model.dart';
import '../providers/notifications_providers.dart';

Future<void> showNotificationPanel(BuildContext context, WidgetRef ref) async {
  await showSmoothOverlay(
    context: context,
    alignment: Alignment.topCenter,
    child: _NotificationPanel(ref: ref),
  );
}

class _NotificationPanel extends ConsumerStatefulWidget {
  final WidgetRef ref;

  const _NotificationPanel({required this.ref});

  @override
  ConsumerState<_NotificationPanel> createState() => _NotificationPanelState();
}

class _NotificationPanelState extends ConsumerState<_NotificationPanel> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(notificationsListProvider.notifier).load());
  }

  IconData _typeIcon(String type) {
    if (type == 'order_point_gift') return LucideIcons.gift;
    if (type == 'referral_batch') return LucideIcons.userPlus;
    if (type == 'competition_draw') return LucideIcons.trophy;
    return LucideIcons.bell;
  }

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    return DateFormat('yyyy/MM/dd HH:mm').format(dt.toLocal());
  }

  Future<void> _onTap(NotificationModel n) async {
    final link = n.drawOrUrlLink;
    if (n.type == 'competition_draw' && link != null) {
      final uri = Uri.tryParse(link);
      if (uri != null) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    }
    if (!n.read) {
      await ref.read(notificationsListProvider.notifier).markRead(n.id);
    }
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationsListProvider);
    final preview = state.items.take(6).toList();
    final unreadPreview = preview.where((n) => !n.read).length;
    final media = MediaQuery.of(context);
    final topPadding = media.padding.top;
    final horizontalInset = 12.0;
    final panelWidth = media.size.width - (horizontalInset * 2);

    return Material(
      color: Colors.transparent,
      child: Padding(
        padding: EdgeInsets.only(
          top: topPadding + 52,
          left: horizontalInset,
          right: horizontalInset,
        ),
        child: SizedBox(
          width: panelWidth,
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.12),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'الإشعارات',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w800,
                                  fontFamily: 'Cairo',
                                ),
                              ),
                              if (unreadPreview > 0)
                                Text(
                                  '$unreadPreview جديد',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    color: Color(0xFF64748B),
                                    fontFamily: 'Cairo',
                                  ),
                                ),
                            ],
                          ),
                        ),
                        if (state.hasUnread)
                          TextButton(
                            onPressed: () => ref
                                .read(notificationsListProvider.notifier)
                                .markAllRead(),
                            style: TextButton.styleFrom(
                              backgroundColor: const Color(0xFFF1F5F9),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 5,
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(999),
                              ),
                            ),
                            child: const Text(
                              'تعليم الكل',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                fontFamily: 'Cairo',
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                  if (state.isLoading && preview.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 28),
                      child: SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      ),
                    )
                  else if (preview.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Column(
                        children: [
                          Icon(
                            LucideIcons.bell,
                            size: 26,
                            color: Color(0xFF94A3B8),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'لا توجد إشعارات',
                            style: TextStyle(
                              color: Color(0xFF94A3B8),
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 320),
                      child: ListView.separated(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: preview.length,
                        separatorBuilder: (_, __) => const Divider(
                          height: 1,
                          color: Color(0xFFF1F5F9),
                        ),
                        itemBuilder: (context, index) {
                          final n = preview[index];
                          return InkWell(
                            onTap: () => _onTap(n),
                            child: Container(
                              color: n.read
                                  ? Colors.white
                                  : const Color(0xFFF0F7FF),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 12,
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 36,
                                    height: 36,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFEEF2FF),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Icon(
                                      _typeIcon(n.type),
                                      size: 16,
                                      color: const Color(0xFF4F46E5),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          n.title,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                            fontFamily: 'Cairo',
                                          ),
                                        ),
                                        if (n.body.isNotEmpty) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            n.body,
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 12,
                                              color: Color(0xFF64748B),
                                              fontFamily: 'Cairo',
                                            ),
                                          ),
                                        ],
                                        if (n.createdAt != null) ...[
                                          const SizedBox(height: 2),
                                          Text(
                                            _formatDate(n.createdAt),
                                            style: const TextStyle(
                                              fontSize: 10,
                                              color: Color(0xFF94A3B8),
                                              fontFamily: 'Cairo',
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                  ),
                                  if (!n.read)
                                    Container(
                                      width: 7,
                                      height: 7,
                                      margin: const EdgeInsets.only(top: 5),
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  if (state.items.isNotEmpty)
                    InkWell(
                      onTap: () {
                        Navigator.of(context).pop();
                        context.push('/notifications');
                      },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: const BoxDecoration(
                          border: Border(
                            top: BorderSide(color: Color(0xFFF1F5F9)),
                          ),
                          color: Color(0xFFFAFAFA),
                        ),
                        child: const Text(
                          'عرض الكل',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Color(0xFF2563EB),
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
