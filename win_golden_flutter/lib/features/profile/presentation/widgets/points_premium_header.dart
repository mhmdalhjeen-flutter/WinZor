import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_brand_assets.dart';
import '../../data/models/user_center_models.dart';

class PointsPremiumHeader extends StatelessWidget {
  final CenterUser user;
  final int points;

  const PointsPremiumHeader({
    super.key,
    required this.user,
    required this.points,
  });

  @override
  Widget build(BuildContext context) {
    final avatar = user.avatar;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: const LinearGradient(
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
          colors: [
            Color(0xFFE8F5EE),
            Color(0xFFF0F9F4),
            Color(0xFFFEF9E7),
            Color(0xFFFDF6E3),
          ],
          stops: [0.0, 0.35, 0.72, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
        border: Border.all(color: const Color(0xFFE8E4DA)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _Avatar(avatarUrl: avatar),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  user.name.isNotEmpty ? user.name : 'مستخدم',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    fontFamily: 'Cairo',
                    color: Color(0xFF111827),
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.72),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE5E7EB)),
            ),
            child: Column(
              children: [
                const Text(
                  'عدد النقاط',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF6B7280),
                    fontFamily: 'Cairo',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  NumberFormat('#,###', 'en_US').format(points),
                  style: const TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF111827),
                    fontFamily: 'Cairo',
                    height: 1,
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

class _Avatar extends StatelessWidget {
  final String? avatarUrl;

  const _Avatar({this.avatarUrl});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 64,
      height: 64,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFBBF7D0), width: 2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: avatarUrl != null && avatarUrl!.isNotEmpty
          ? Image.network(avatarUrl!, fit: BoxFit.cover)
          : Container(
              color: const Color(0xFFECFDF5),
              child: const Center(
                child: BrandLogo.compact(width: 36, height: 36),
              ),
            ),
    );
  }
}
