import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../data/models/chat_models.dart';

class ReferencedItemsBar extends StatelessWidget {
  final List<ChatReferencedItem> items;

  const ReferencedItemsBar({super.key, required this.items});

  Future<void> _open(BuildContext context, ChatReferencedItem item) async {
    final path = chatItemPath(item);
    if (path != null) {
      context.push(path);
      return;
    }
    final url = item.itemUrl;
    if (url == null || url.isEmpty) return;
    if (url.startsWith('/')) {
      context.push(url);
    } else if (url.startsWith('http')) {
      final uri = Uri.tryParse(url);
      if (uri != null) await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
      decoration: const BoxDecoration(
        color: Color(0xFFEEF2FF),
        border: Border(bottom: BorderSide(color: Color(0xFFE0E7FF))),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'عناصر مرتبطة بالمحادثة',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              fontFamily: 'Cairo',
              color: Color(0xFF4338CA),
            ),
          ),
          const SizedBox(height: 6),
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (_, i) {
                final item = items[i];
                final icon = itemTypeIcon(item.itemType);
                return InkWell(
                  onTap: () => _open(context, item),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFC7D2FE)),
                    ),
                    child: Row(
                      children: [
                        if (item.itemImage != null &&
                            item.itemImage!.isNotEmpty &&
                            item.itemImage!.startsWith('http'))
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(
                              imageUrl: item.itemImage!,
                              width: 32,
                              height: 32,
                              fit: BoxFit.cover,
                            ),
                          )
                        else
                          Text(icon, style: const TextStyle(fontSize: 18)),
                        const SizedBox(width: 6),
                        Text(
                          '$icon ${item.itemName.isEmpty ? 'عنصر' : item.itemName}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            fontFamily: 'Cairo',
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
