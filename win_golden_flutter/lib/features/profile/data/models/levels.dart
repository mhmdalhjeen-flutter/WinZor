/// Client-side level ladder — mirrors customerFrontend/src/shared/levels.js
class LevelStage {
  final String id;
  final String label;
  final int min;
  final int? max;
  final ColorHex color;
  final int stars;

  const LevelStage({
    required this.id,
    required this.label,
    required this.min,
    required this.max,
    required this.color,
    required this.stars,
  });
}

/// Simple hex color holder to avoid importing Flutter in pure util if needed —
/// UI converts via Color(color.value).
class ColorHex {
  final int value;
  const ColorHex(this.value);
}

const List<LevelStage> kLevelStages = [
  LevelStage(id: 'bronze', label: 'برونزي', min: 0, max: 99, color: ColorHex(0xFFCD7F32), stars: 1),
  LevelStage(id: 'silver', label: 'فضّي', min: 100, max: 299, color: ColorHex(0xFF94A3B8), stars: 2),
  LevelStage(id: 'gold', label: 'ذهبي', min: 300, max: 599, color: ColorHex(0xFFEAB308), stars: 3),
  LevelStage(id: 'platinum', label: 'بلاتيني', min: 600, max: null, color: ColorHex(0xFFA78BFA), stars: 4),
];

class LevelProgress {
  final LevelStage stage;
  final LevelStage? next;
  final double progress;
  final int pointsToNext;

  const LevelProgress({
    required this.stage,
    required this.next,
    required this.progress,
    required this.pointsToNext,
  });

  factory LevelProgress.fromPoints(int points) {
    final stage = kLevelStages.firstWhere(
      (s) => points >= s.min && (s.max == null || points <= s.max!),
      orElse: () => kLevelStages.first,
    );
    final idx = kLevelStages.indexOf(stage);
    final next = idx + 1 < kLevelStages.length ? kLevelStages[idx + 1] : null;
    if (next == null) {
      return LevelProgress(stage: stage, next: null, progress: 100, pointsToNext: 0);
    }
    final span = (next.min - stage.min).toDouble();
    final progress = span <= 0 ? 100.0 : (((points - stage.min) / span) * 100).clamp(0, 100);
    return LevelProgress(
      stage: stage,
      next: next,
      progress: progress.toDouble(),
      pointsToNext: next.min - points,
    );
  }

  factory LevelProgress.fromJson(Map<String, dynamic>? json, int fallbackPoints) {
    if (json == null) return LevelProgress.fromPoints(fallbackPoints);
    try {
      final stageJson = json['stage'] as Map<String, dynamic>?;
      final nextJson = json['next'] as Map<String, dynamic>?;
      if (stageJson == null) return LevelProgress.fromPoints(fallbackPoints);

      LevelStage parseStage(Map<String, dynamic> m) {
        final colorStr = m['color']?.toString() ?? '#94a3b8';
        final hex = colorStr.replaceFirst('#', '');
        final value = int.tryParse(hex.length == 6 ? 'FF$hex' : hex, radix: 16) ?? 0xFF94A3B8;
        return LevelStage(
          id: m['id']?.toString() ?? 'bronze',
          label: m['label']?.toString() ?? '—',
          min: (m['min'] as num?)?.toInt() ?? 0,
          max: m['max'] == null || m['max'] == double.infinity ? null : (m['max'] as num?)?.toInt(),
          color: ColorHex(value),
          stars: (m['stars'] as num?)?.toInt() ?? 1,
        );
      }

      return LevelProgress(
        stage: parseStage(stageJson),
        next: nextJson != null ? parseStage(nextJson) : null,
        progress: (json['progress'] as num?)?.toDouble() ?? 0,
        pointsToNext: (json['pointsToNext'] as num?)?.toInt() ?? 0,
      );
    } catch (_) {
      return LevelProgress.fromPoints(fallbackPoints);
    }
  }
}
