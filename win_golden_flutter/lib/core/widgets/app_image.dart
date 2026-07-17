import 'dart:convert';
import 'dart:typed_data';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../utils/media_url.dart';

/// Shared image display for HTTPS, relative API media paths, and legacy Base64.
class AppImage extends StatelessWidget {
  const AppImage({
    super.key,
    required this.src,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.placeholder,
    this.errorWidget,
  });

  final String? src;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Widget? placeholder;
  final Widget? errorWidget;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveImageUrl(src);
    if (resolved == null) {
      return placeholder ?? _fallback();
    }

    if (isDataUrl(resolved)) {
      final bytes = Uri.parse(resolved).data?.contentAsBytes() ??
          _tryDecodeBase64(resolved);
      if (bytes == null || bytes.isEmpty) {
        return errorWidget ?? _fallback();
      }
      return Image.memory(
        Uint8List.fromList(bytes),
        fit: fit,
        width: width,
        height: height,
        errorBuilder: (_, __, ___) => errorWidget ?? _fallback(),
      );
    }

    return CachedNetworkImage(
      imageUrl: resolved,
      fit: fit,
      width: width,
      height: height,
      placeholder: (_, __) =>
          placeholder ??
          Container(color: const Color(0xFFF3F4F6), width: width, height: height),
      errorWidget: (_, __, ___) => errorWidget ?? _fallback(),
    );
  }

  Widget _fallback() {
    return Container(
      width: width,
      height: height,
      color: const Color(0xFFF3F4F6),
      child: const Icon(LucideIcons.image, color: Colors.grey, size: 28),
    );
  }

  static List<int>? _tryDecodeBase64(String dataUrl) {
    final comma = dataUrl.indexOf(',');
    if (comma < 0) return null;
    try {
      return base64Decode(dataUrl.substring(comma + 1));
    } catch (_) {
      return null;
    }
  }
}
