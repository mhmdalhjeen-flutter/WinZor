import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../theme/app_colors.dart';
import '../../features/explore/data/models/store_model.dart';
import '../utils/media_url.dart';
import 'app_image.dart';

class StoreCard extends StatelessWidget {
  final StoreModel store;
  final String? membershipStatus;

  const StoreCard({
    super.key,
    required this.store,
    this.membershipStatus,
  });

  @override
  Widget build(BuildContext context) {
    final String? logo = resolveStoreLogo({
      '_id': store.id,
      'logo': store.logo,
      'hasLogo': store.logo != null && store.logo!.isNotEmpty,
    });
    final String location = store.subRegion ?? store.region ?? '';
    final String? categoryLabel = store.category?.split(' › ').last;

    return GestureDetector(
      onTap: () => context.push('/store/${store.id}'),
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(left: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: const Color(0xFFF3F4F6)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 24,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Logo area
            Container(
              height: 116,
              width: double.infinity,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFF9FAFB), Color(0xFFF3F4F6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Stack(
                children: [
                  if (logo != null && logo.isNotEmpty)
                    AppImage(
                      src: logo,
                      width: double.infinity,
                      height: double.infinity,
                      fit: BoxFit.cover,
                    )
                  else
                    const Center(
                      child: Icon(LucideIcons.store, color: Colors.grey, size: 40),
                    ),
                  if (store.isVerifiedStore)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF10B981).withOpacity(0.25),
                              blurRadius: 4,
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Info area
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          store.name,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF111827),
                            height: 1.2,
                            fontFamily: 'Cairo',
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  if (store.isVerifiedStore)
                    Padding(
                      padding: const EdgeInsets.only(top: 4.0),
                      child: _buildVerifiedBadge(),
                    ),
                  const SizedBox(height: 8),
                  if (categoryLabel != null)
                    Text(
                      categoryLabel,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                        fontFamily: 'Cairo',
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(LucideIcons.mapPin, size: 11, color: Color(0xFF9CA3AF)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6B7280),
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(LucideIcons.star, size: 12, color: Colors.amber, fill: 1.0),
                          const SizedBox(width: 4),
                          Text(
                            store.ratingAvg.toStringAsFixed(1),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(LucideIcons.users, size: 12, color: Color(0xFF9CA3AF)),
                          const SizedBox(width: 4),
                          Text(
                            store.customersCount.toString(),
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Color(0xFF9CA3AF)),
                          ),
                        ],
                      ),
                    ],
                  ),

                  if (membershipStatus != null) ...[
                    const SizedBox(height: 8),
                    _buildMembershipBadge(membershipStatus!),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerifiedBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(4),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(LucideIcons.badgeCheck, size: 10, color: Color(0xFF2563EB)),
          SizedBox(width: 4),
          Text(
            'متجر موثق',
            style: TextStyle(
              fontSize: 8,
              fontWeight: FontWeight.w900,
              color: Color(0xFF2563EB),
              fontFamily: 'Cairo',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembershipBadge(String status) {
    final bool isPending = status == 'pending';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isPending ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        isPending ? 'قيد الانتظار' : 'عضو',
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.w900,
          color: isPending ? const Color(0xFFB45309) : const Color(0xFF15803D),
          fontFamily: 'Cairo',
        ),
      ),
    );
  }
}
