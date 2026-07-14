import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class StoreRegionSuggestion extends StatelessWidget {
  final Map<String, dynamic> suggestion;
  final Function(String) onApply;

  const StoreRegionSuggestion({
    super.key,
    required this.suggestion,
    required this.onApply,
  });

  @override
  Widget build(BuildContext context) {
    final region = suggestion['region'];
    if (region == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFDE68A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(LucideIcons.mapPin, size: 16, color: Color(0xFF78350F)),
              const SizedBox(width: 8),
              const Text(
                'لا نتائج في اختيارك الحالي',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF78350F),
                  fontFamily: 'Cairo',
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            suggestion['message'] ?? '',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Color(0xFF92400E),
              fontFamily: 'Cairo',
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => onApply(region['_id']?.toString() ?? ''),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF59E0B),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                'عرض «${region['name']}»',
                style: const TextStyle(fontWeight: FontWeight.w900, fontFamily: 'Cairo'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
