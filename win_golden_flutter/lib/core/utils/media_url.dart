import '../api/api_client.dart';

/// Shared display strategy (parity with customerFrontend `mediaUrl.js`):
/// - `https://...` → use as-is (Cloudinary or other hosts)
/// - relative `/offers|:products|:stores/...` → prefix with API base
/// - `data:image/...` → pass through for legacy Base64 (decode at widget layer)
const String _absoluteSrcPattern = r'^(https?:|data:|blob:)';

String? resolveImageUrl(String? src, {String apiBase = ApiClient.baseUrl}) {
  if (src == null) return null;
  final trimmed = src.trim();
  if (trimmed.isEmpty) return null;

  if (RegExp(_absoluteSrcPattern, caseSensitive: false).hasMatch(trimmed)) {
    return trimmed;
  }

  final base = apiBase.replaceAll(RegExp(r'/+$'), '');
  final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
  return '$base$path';
}

String? resolveOfferImage(Map<String, dynamic>? offer) {
  if (offer == null) return null;
  final direct = resolveImageUrl(offer['image']?.toString());
  if (direct != null) return direct;
  final id = offer['_id']?.toString();
  if (offer['hasImage'] == true && id != null && id.isNotEmpty) {
    return resolveImageUrl('/offers/$id/image');
  }
  return null;
}

String? resolveProductImage(Map<String, dynamic>? product) {
  if (product == null) return null;
  final direct = resolveImageUrl(product['image']?.toString());
  if (direct != null) return direct;
  final id = product['_id']?.toString();
  if (product['hasImage'] == true && id != null && id.isNotEmpty) {
    return resolveImageUrl('/products/$id/image');
  }
  return null;
}

String? resolveStoreLogo(Map<String, dynamic>? store) {
  if (store == null) return null;
  final direct = resolveImageUrl(store['logo']?.toString());
  if (direct != null) return direct;
  final id = store['_id']?.toString();
  if (store['hasLogo'] == true && id != null && id.isNotEmpty) {
    return resolveImageUrl('/stores/$id/logo');
  }
  return null;
}

String? resolveStoreCover(Map<String, dynamic>? store) {
  if (store == null) return null;
  final direct = resolveImageUrl(store['coverImage']?.toString());
  if (direct != null) return direct;
  final id = store['_id']?.toString();
  if (store['hasCoverImage'] == true && id != null && id.isNotEmpty) {
    return resolveImageUrl('/stores/$id/cover');
  }
  return null;
}

bool isDataUrl(String? src) =>
    src != null && src.trim().toLowerCase().startsWith('data:');

bool isHttpUrl(String? src) {
  if (src == null) return false;
  final t = src.trim().toLowerCase();
  return t.startsWith('https://') || t.startsWith('http://');
}
