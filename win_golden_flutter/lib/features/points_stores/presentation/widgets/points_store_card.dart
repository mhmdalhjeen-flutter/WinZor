import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/media_url.dart';
import '../../../../core/widgets/app_image.dart';

/// React `PointsStoreCard.jsx`
class PointsStoreCard extends StatelessWidget {
  final Map<String, dynamic> store;

  const PointsStoreCard({super.key, required this.store});

  @override
  Widget build(BuildContext context) {
    final id = (store['_id'] ?? store['id'] ?? '').toString();
    final name = (store['name'] ?? '').toString();
    final description = store['description']?.toString();
    final category = store['category']?.toString();
    final categoryLabel = category != null && category.contains(' › ')
        ? category.split(' › ').last
        : category;
    final region = store['region']?.toString();
    final subRegion = store['subRegion']?.toString();
    final location = [subRegion, region].whereType<String>().where((s) => s.isNotEmpty).join('، ');
    final verified = store['isVerifiedStore'] == true;
    final logo = resolveStoreLogo(store);
    final cover = resolveStoreCover(store);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF3F4F6)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              SizedBox(
                height: 112,
                width: double.infinity,
                child: cover != null
                    ? AppImage(src: cover, fit: BoxFit.cover)
                    : Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFEEF2FF), Color(0xFFEDE9FE)],
                          ),
                        ),
                        child: const Center(
                          child: Icon(LucideIcons.store,
                              size: 32, color: Color(0xFFC7D2FE)),
                        ),
                      ),
              ),
              Positioned(
                bottom: -20,
                right: 16,
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: logo != null
                      ? AppImage(src: logo, fit: BoxFit.cover)
                      : const Icon(LucideIcons.store, size: 20),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 28, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        name,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w900,
                          fontFamily: 'Cairo',
                          color: Color(0xFF111827),
                        ),
                      ),
                    ),
                    if (verified)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'موثّق',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            color: Color(0xFF166534),
                          ),
                        ),
                      ),
                  ],
                ),
                if (categoryLabel != null && categoryLabel.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    categoryLabel,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'Cairo',
                      color: AppColors.primary,
                    ),
                  ),
                ],
                if (location.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin,
                          size: 12, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Cairo',
                            color: Color(0xFF6B7280),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
                if (description != null && description.trim().isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      fontFamily: 'Cairo',
                      color: Color(0xFF4B5563),
                      height: 1.35,
                    ),
                  ),
                ],
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 40,
                  child: ElevatedButton(
                    onPressed: id.isEmpty
                        ? null
                        : () => context.push('/store/$id'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'زيارة المتجر',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'Cairo',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
