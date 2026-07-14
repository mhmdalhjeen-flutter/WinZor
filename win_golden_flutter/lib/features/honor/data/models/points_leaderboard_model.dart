class LeaderboardEntry {
  final String id;
  final String name;
  final String? avatar;
  final int rank;
  final int points;

  const LeaderboardEntry({
    required this.id,
    required this.name,
    this.avatar,
    required this.rank,
    required this.points,
  });

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json, {int fallbackRank = 1}) {
    final user = json['user'];
    String id = '';
    String name = 'مستخدم';
    String? avatar;

    if (user is Map) {
      id = (user['_id'] ?? user['id'] ?? '').toString();
      name = (user['name'] ?? json['name'] ?? 'مستخدم').toString();
      avatar = user['avatar']?.toString();
    } else {
      id = (json['_id'] ?? json['id'] ?? '').toString();
      name = (json['name'] ?? 'مستخدم').toString();
      avatar = json['avatar']?.toString();
    }

    return LeaderboardEntry(
      id: id,
      name: name,
      avatar: avatar,
      rank: int.tryParse(json['rank']?.toString() ?? '') ?? fallbackRank,
      points: int.tryParse(json['points']?.toString() ?? '') ?? 0,
    );
  }
}

class PointsLeaderboard {
  final List<LeaderboardEntry> top;
  final int? myRank;
  final int myPoints;
  final LeaderboardEntry? me;

  const PointsLeaderboard({
    required this.top,
    this.myRank,
    this.myPoints = 0,
    this.me,
  });

  factory PointsLeaderboard.fromJson(Map<String, dynamic> json) {
    final rawTop = json['top'];
    final top = <LeaderboardEntry>[];
    if (rawTop is List) {
      for (var i = 0; i < rawTop.length && i < 5; i++) {
        final item = rawTop[i];
        if (item is Map) {
          top.add(LeaderboardEntry.fromJson(
            Map<String, dynamic>.from(item),
            fallbackRank: i + 1,
          ));
        }
      }
    }

    LeaderboardEntry? me;
    final rawMe = json['me'];
    if (rawMe is Map) {
      me = LeaderboardEntry.fromJson(
        Map<String, dynamic>.from(rawMe),
        fallbackRank: int.tryParse(json['myRank']?.toString() ?? '') ?? 0,
      );
    }

    return PointsLeaderboard(
      top: top,
      myRank: int.tryParse(json['myRank']?.toString() ?? ''),
      myPoints: int.tryParse(json['myPoints']?.toString() ?? '') ??
          me?.points ??
          0,
      me: me,
    );
  }
}
