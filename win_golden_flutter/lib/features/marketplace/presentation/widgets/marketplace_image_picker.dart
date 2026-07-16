import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/widgets/app_image.dart';
import '../../../home/presentation/providers/home_providers.dart';

/// Picks local files, uploads via Cloudinary (`/api/upload/image`), stores HTTPS URLs.
class MarketplaceImagePicker extends ConsumerStatefulWidget {
  final List<String> images;
  final int mainImageIndex;
  final Function(String) onImagePicked;
  final Function(int) onRemoveImage;
  final Function(int) onMainImageChange;
  final bool optional;
  final bool wantedMode;

  const MarketplaceImagePicker({
    super.key,
    required this.images,
    required this.mainImageIndex,
    required this.onImagePicked,
    required this.onRemoveImage,
    required this.onMainImageChange,
    this.optional = false,
    this.wantedMode = false,
  });

  @override
  ConsumerState<MarketplaceImagePicker> createState() =>
      _MarketplaceImagePickerState();
}

class _MarketplaceImagePickerState extends ConsumerState<MarketplaceImagePicker> {
  bool _uploading = false;

  Future<void> _pickImage() async {
    if (_uploading || widget.images.length >= 3) return;

    final picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 85,
    );
    if (image == null) return;

    setState(() => _uploading = true);
    try {
      final url = await ref.read(imageUploadServiceProvider).uploadImageFile(image.path);
      if (!mounted) return;
      widget.onImagePicked(url);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final int emptyCount = (3 - widget.images.length).clamp(0, 3);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_uploading)
          const Padding(
            padding: EdgeInsets.only(bottom: 8),
            child: LinearProgressIndicator(minHeight: 3),
          ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
          ),
          itemCount: widget.images.length + emptyCount,
          itemBuilder: (context, index) {
            if (index < widget.images.length) {
              return _buildImageItem(index);
            } else {
              return _buildEmptySlot(index - widget.images.length);
            }
          },
        ),
        if (!widget.optional && widget.images.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 8.0),
            child: Center(
              child: Text(
                'أضف صورة واحدة على الأقل (حتى 3)',
                style: TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildImageItem(int index) {
    final String url = widget.images[index];
    final bool isMain = widget.mainImageIndex == index;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        GestureDetector(
          onTap: () => widget.onMainImageChange(index),
          child: Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isMain ? const Color(0xFFB91C1C) : const Color(0xFFE5E7EB),
                width: isMain ? 2 : 1,
              ),
            ),
            clipBehavior: Clip.antiAlias,
            child: AppImage(src: url, fit: BoxFit.cover, width: double.infinity, height: double.infinity),
          ),
        ),
        Positioned(
          top: -6,
          left: -6,
          child: GestureDetector(
            onTap: () => widget.onRemoveImage(index),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(LucideIcons.x, size: 12, color: Colors.white),
            ),
          ),
        ),
        if (isMain && widget.images.length > 1)
          Positioned(
            bottom: 4,
            right: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFB91C1C),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'رئيسية',
                style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildEmptySlot(int index) {
    final bool isWantedSlot = widget.wantedMode && widget.images.isEmpty && index == 0;

    return GestureDetector(
      onTap: _uploading ? null : _pickImage,
      child: Container(
        decoration: BoxDecoration(
          color: isWantedSlot ? const Color(0xFFFFF7ED) : const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isWantedSlot ? const Color(0xFFFED7AA) : const Color(0xFFE5E7EB),
            style: BorderStyle.solid,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: isWantedSlot
              ? const [
                  Text('مطلوب', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Color(0xFFEA580C))),
                  Text('صورة اختيارية', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Color(0xFFF97316))),
                ]
              : const [
                  Icon(LucideIcons.plus, size: 24, color: Colors.grey),
                  SizedBox(height: 4),
                  Text('إضافة صورة', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey)),
                ],
        ),
      ),
    );
  }
}
