import 'package:flutter/material.dart';

/// React brand image paths — `customerFrontend/src/assets`.
abstract final class AppBrandAssets {
  /// Compact mark — Header, HomeHero, PointsBadge, AuthExperienceBranding.
  static const compactLogo = 'assets/brand/win-goldenstore-logo.png';

  /// Full circular logo — Intro, Login, Register (`win-goldenstore2222222.png`).
  static const fullLogo = 'assets/brand/win-goldenstore-full.png';
}

/// Shared brand image widget — preserves existing layout slots.
class BrandLogo extends StatelessWidget {
  final String asset;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const BrandLogo({
    super.key,
    required this.asset,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.borderRadius,
  });

  /// Compact mark used in header / hero / points badge.
  const BrandLogo.compact({
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.borderRadius,
  }) : asset = AppBrandAssets.compactLogo;

  /// Full circular logo used on intro / login / register.
  const BrandLogo.full({
    super.key,
    this.width,
    this.height,
    this.fit = BoxFit.contain,
    this.borderRadius,
  }) : asset = AppBrandAssets.fullLogo;

  @override
  Widget build(BuildContext context) {
    final image = Image.asset(
      asset,
      width: width,
      height: height,
      fit: fit,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, __, ___) => Icon(
        Icons.store,
        color: Theme.of(context).colorScheme.primary,
        size: (width ?? height ?? 32) * 0.7,
      ),
    );

    if (borderRadius != null) {
      return ClipRRect(borderRadius: borderRadius!, child: image);
    }
    return image;
  }
}
