import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';
import '../../features/orders/presentation/providers/orders_providers.dart';
import '../theme/app_colors.dart';
import 'enter_code_dialog.dart';
import 'whatsapp_icon.dart';

const kSupportWhatsAppUrl = 'https://wa.me/970592090288';

class FloatingActionsStack extends ConsumerWidget {
  const FloatingActionsStack({super.key});

  Future<void> _openWhatsApp() async {
    final uri = Uri.parse(kSupportWhatsAppUrl);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bottomInset = MediaQuery.of(context).padding.bottom;
    final isAuth = ref.watch(authProvider).isAuth;
    final cartVisible = isAuth && ref.watch(cartHasItemsProvider);
    final fabBottom = (cartVisible ? 132.0 : 72.0) + bottomInset;

    return Positioned(
      left: 8,
      bottom: fabBottom,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _FloatingActionButton(
            label: 'واتساب',
            gradient: const [Color(0xFF25D366), Color(0xFF128C7E)],
            onTap: _openWhatsApp,
            child: const WhatsAppIcon(size: 22, color: Colors.white),
          ),
          const SizedBox(height: 10),
          _FloatingActionButton(
            label: 'ادخل\nالكود',
            gradient: const [
              Color(0xFFDC2626),
              AppColors.primary,
              Color(0xFF991B1B),
            ],
            onTap: () => showEnterCodeDialog(context, ref),
            child: const Icon(LucideIcons.zap, color: Colors.white, size: 20),
          ),
        ],
      ),
    );
  }
}

class _FloatingActionButton extends StatelessWidget {
  final String label;
  final List<Color> gradient;
  final VoidCallback onTap;
  final Widget child;

  const _FloatingActionButton({
    required this.label,
    required this.gradient,
    required this.onTap,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: LinearGradient(
              colors: gradient,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: gradient.first.withOpacity(0.35),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              child,
              const SizedBox(height: 2),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 8.5,
                  fontWeight: FontWeight.w900,
                  height: 1.05,
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
