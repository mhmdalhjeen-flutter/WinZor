import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/app_image.dart';
import '../../../../core/utils/currency_utils.dart';
import '../../data/models/bazaar_listing_model.dart';
import 'bazaar_constants.dart';

/// "منشوراتي" row — mirrors React Marketplace mine-tab card (edit / delete / renew / view).
class MyBazaarListingTile extends StatelessWidget {
  final BazaarListingModel listing;
  final int pointsCost;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  final VoidCallback onRenew;
  final VoidCallback? onView;

  const MyBazaarListingTile({
    super.key,
    required this.listing,
    required this.pointsCost,
    required this.onEdit,
    required this.onDelete,
    required this.onRenew,
    this.onView,
  });

  @override
  Widget build(BuildContext context) {
    final isWanted = listing.transactionType == 'custom';
    final thumb = listing.images.isNotEmpty
        ? resolveImageUrl(
            listing.images[
                listing.mainImageIndex.clamp(0, listing.images.length - 1)],
          )
        : null;
    final st = BazaarConstants.statusLabels[listing.status] ??
        BazaarConstants.statusLabels['pending']!;
    final canRenew =
        listing.status == 'approved' || listing.status == 'expired';
    final expiringSoon = listing.expiresAt != null &&
        listing.expiresAt!.difference(DateTime.now()).inMilliseconds <
            2 * 86400000;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Thumb(thumb: thumb, isWanted: isWanted),
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
                        listing.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: st.bg,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        st.text,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          color: st.fg,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  isWanted && listing.price == 0
                      ? 'بدون سعر'
                      : CurrencyUtils.formatPrice(
                          listing.price, listing.currency),
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                    fontFamily: 'Cairo',
                  ),
                ),
                Text(
                  BazaarConstants.regionLabel(
                      listing.regionId, listing.subRegionId),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF6B7280),
                    fontFamily: 'Cairo',
                  ),
                ),
                if (listing.createdAt != null)
                  Text(
                    'نُشر ${BazaarConstants.formatPublishAge(listing.createdAt)}',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF9CA3AF),
                      fontFamily: 'Cairo',
                    ),
                  ),
                if (listing.expiresAt != null && listing.status == 'approved')
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Row(
                      children: [
                        Icon(
                          LucideIcons.clock,
                          size: 12,
                          color: expiringSoon
                              ? const Color(0xFFD97706)
                              : const Color(0xFF9CA3AF),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            expiringSoon
                                ? 'ينتهي قريباً — هل تريد التجديد؟'
                                : 'ينتهي ${_formatArDate(listing.expiresAt!)}',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: expiringSoon
                                  ? const Color(0xFFD97706)
                                  : const Color(0xFF9CA3AF),
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                if (listing.adminReviewNote != null &&
                    listing.status == 'rejected')
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      listing.adminReviewNote!,
                      style: const TextStyle(
                        fontSize: 10,
                        color: Color(0xFFEF4444),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 6,
                  children: [
                    _Action(
                      icon: LucideIcons.edit3,
                      label: 'تعديل',
                      color: AppColors.primary,
                      onTap: onEdit,
                    ),
                    _Action(
                      icon: LucideIcons.trash2,
                      label: 'حذف',
                      color: const Color(0xFFEF4444),
                      onTap: onDelete,
                    ),
                    if (canRenew)
                      _Action(
                        icon: LucideIcons.refreshCw,
                        label: 'تجديد ($pointsCost نقاط)',
                        color: const Color(0xFF16A34A),
                        onTap: onRenew,
                      ),
                    if (onView != null &&
                        listing.status == 'approved' &&
                        listing.isVisible)
                      _Action(
                        icon: LucideIcons.eye,
                        label: 'عرض',
                        color: const Color(0xFF4B5563),
                        onTap: onView!,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatArDate(DateTime d) {
    return '${d.year}/${d.month.toString().padLeft(2, '0')}/${d.day.toString().padLeft(2, '0')}';
  }
}

class _Thumb extends StatelessWidget {
  final String? thumb;
  final bool isWanted;

  const _Thumb({required this.thumb, required this.isWanted});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: SizedBox(
        width: 72,
        height: 72,
        child: thumb != null
            ? AppImage(src: thumb, fit: BoxFit.cover)
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
                    alignment: Alignment.center,
                    child: const Text(
                      'مطلوب',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFF97316),
                        fontFamily: 'Cairo',
                      ),
                    ),
                  )
                : const ColoredBox(color: Color(0xFFF3F4F6)),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _Action({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w900,
              color: color,
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }
}
