import 'dart:typed_data';

import 'package:dio/dio.dart';

import '../api/api_client.dart';

/// Canonical upload path shared with React:
/// File → POST /api/upload/image → Cloudinary → HTTPS URL → save in MongoDB.
///
/// Do not encode new uploads as Base64. Legacy Base64 in Mongo remains readable.
class ImageUploadService {
  ImageUploadService(this._apiClient);

  final ApiClient _apiClient;

  Future<String> uploadImageFile(String filePath, {String? filename}) async {
    final name = filename ?? _fileNameFromPath(filePath);
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(filePath, filename: name),
    });
    return _postUpload(formData);
  }

  Future<String> uploadImageBytes(
    List<int> bytes, {
    String filename = 'image.jpg',
  }) async {
    final formData = FormData.fromMap({
      'image': MultipartFile.fromBytes(
        Uint8List.fromList(bytes),
        filename: filename,
      ),
    });
    return _postUpload(formData);
  }

  Future<String> _postUpload(FormData formData) async {
    final response = await _apiClient.dio.post(
      '/upload/image',
      data: formData,
    );
    final data = response.data;
    if (data is! Map) {
      throw StateError('لم يُرجع الخادم رابط الصورة');
    }
    final url = data['url']?.toString();
    if (url == null || url.isEmpty) {
      throw StateError(data['message']?.toString() ?? 'فشل رفع الصورة');
    }
    return url;
  }

  static String _fileNameFromPath(String path) {
    final parts = path.replaceAll('\\', '/').split('/');
    final name = parts.isNotEmpty ? parts.last : 'image.jpg';
    if (name.contains('.')) return name;
    return '$name.jpg';
  }
}
