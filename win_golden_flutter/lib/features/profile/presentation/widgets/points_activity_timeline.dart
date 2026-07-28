import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../data/models/point_sources.dart';
import '../providers/user_center_providers.dart';

class PointsActivityTimeline extends ConsumerWidget {
  const PointsActivityTimeline({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sourcesAsync = ref.watch(recentPointSourcesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'آخر مصادر حصولك على النقاط',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            fontFamily: 'Cairo',
            color: Color(0xFF111827),
          ),
        ),
        const SizedBox(height: 12),
        sourcesAsync.when(
          loading: () => const Center(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
          error: (_, __) => _empty('تعذّر تحميل مصادر النقاط'),
          data: (sources) {
            if (sources.isEmpty) {
              return _empty('لم تحصل على نقاط بعد — تسوّق من المتاجر المعتمدة أو ادخل كوداً');
            }
            return Column(
              children: [
                for (var i = 0; i < sources.length; i++) ...[
                  _TimelineItem(
                    source: sources[i],
                    isLast: i == sources.length - 1,
                  ),
                ],
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _empty(String message) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFF3F4F6)),
      ),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: const TextStyle(
          color: Color(0xFF9CA3AF),
          fontWeight: FontWeight.w700,
          fontFamily: 'Cairo',
          fontSize: 12,
        ),
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final PointSourceItem source;
  final bool isLast;

  const _TimelineItem({required this.source, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final date = source.date;
    final dateLabel = date != null
        ? DateFormat('yyyy/MM/dd HH:mm').format(date.toLocal())
        : '';

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 28,
            child: Column(
              children: [
                Container(
                  width: 10,
                  height: 10,
                  margin: const EdgeInsets.only(top: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF059669),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFBBF7D0), width: 2),
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      color: const Color(0xFFE5E7EB),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF3F4F6)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          source.label,
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Cairo',
                            fontSize: 13,
                          ),
                        ),
                        if (dateLabel.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            dateLabel,
                            style: const TextStyle(
                              fontSize: 10,
                              color: Color(0xFF9CA3AF),
                              fontFamily: 'Cairo',
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (source.points > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        '+${source.points}',
                        style: const TextStyle(
                          color: Color(0xFF059669),
                          fontWeight: FontWeight.w900,
                          fontSize: 12,
                          fontFamily: 'Cairo',
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
