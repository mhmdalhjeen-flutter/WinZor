import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final bool isAuth;
  const AppHeader({super.key, this.isAuth = true});

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: isAuth 
        ? _buildPointsBadge()
        : _buildLogoTitle(),
      actions: isAuth ? _buildAuthActions() : _buildGuestActions(),
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(0.8),
        child: Container(
          color: const Color(0xFFE5E7EB),
          height: 0.8,
        ),
      ),
    );
  }

  Widget _buildPointsBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.stars, color: Colors.amber, size: 18),
          const SizedBox(width: 4),
          const Text(
            '0',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w900,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(width: 4),
          const Icon(Icons.add_circle, color: AppColors.primary, size: 16),
        ],
      ),
    );
  }

  Widget _buildLogoTitle() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: const Icon(Icons.store, color: AppColors.primary), // Placeholder for logo image
        ),
        const SizedBox(width: 8),
        const Text(
          'Win GoldenStore',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w900,
            color: AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildAuthActions() {
    return [
      _buildIconButton(Icons.notifications_none, Colors.red, 0),
      _buildIconButton(Icons.shopping_cart_outlined, Colors.amber, 0),
      _buildIconButton(Icons.chat_bubble_outline, Colors.blue, 0),
      _buildMoreButton(),
      const SizedBox(width: 8),
    ];
  }

  Widget _buildIconButton(IconData icon, Color color, int badge) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2.0),
      child: Stack(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white.withOpacity(0.6)),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          if (badge > 0)
            Positioned(
              top: 0,
              left: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badge.toString(),
                  style: const TextStyle(color: Colors.white, fontSize: 8),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildMoreButton() {
    return Container(
      margin: const EdgeInsets.only(left: 4),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'المزيد',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1F2937),
            ),
          ),
          const SizedBox(width: 4),
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: const Color(0xFF1F2937),
              borderRadius: BorderRadius.circular(5),
            ),
            child: const Center(
              child: Text(
                '+',
                style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildGuestActions() {
    return [
      TextButton(
        onPressed: () {},
        child: const Text('إنشاء حساب', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.w900, fontSize: 11)),
      ),
      Padding(
        padding: const EdgeInsets.only(right: 8.0, left: 8.0),
        child: ElevatedButton(
          onPressed: () {},
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            minimumSize: const Size(0, 36),
          ),
          child: const Text('دخول', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900)),
        ),
      ),
    ];
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
