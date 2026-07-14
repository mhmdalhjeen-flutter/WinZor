class DrawModel {
  final String id;
  final String name;
  final String? description;
  final String? requiredRank;
  final String? status;
  final int minParticipants;
  final int totalEntries;
  final int participantsCount;

  const DrawModel({
    required this.id,
    required this.name,
    this.description,
    this.requiredRank,
    this.status,
    this.minParticipants = 1,
    this.totalEntries = 0,
    this.participantsCount = 0,
  });

  factory DrawModel.fromJson(Map<String, dynamic> json) {
    final participants = json['participants'];
    int count = 0;
    if (participants is List) {
      count = participants.length;
    } else if (json['currentParticipants'] is num) {
      count = (json['currentParticipants'] as num).toInt();
    }

    return DrawModel(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      description: json['description']?.toString(),
      requiredRank: json['requiredRank']?.toString(),
      status: json['status']?.toString(),
      minParticipants: (json['minParticipants'] as num?)?.toInt() ?? 1,
      totalEntries: (json['totalEntries'] as num?)?.toInt() ?? 0,
      participantsCount: count,
    );
  }

  int get progressPercent {
    final min = minParticipants <= 0 ? 1 : minParticipants;
    return ((participantsCount / min) * 100).round().clamp(0, 100);
  }

  int get remainingSlots => (minParticipants - participantsCount).clamp(0, 1 << 30);
}

const Map<String, String> kDrawRankLabels = {
  'bronze': 'برونزية',
  'silver': 'فضية',
  'gold': 'ذهبية',
  'platinum': 'بلاتينية',
  'all': 'الجميع',
};

class DrawJoinResult {
  final String message;
  final int? remainingWallet;
  final int? myEntries;
  final int? totalEntries;
  final int? currentParticipants;
  final int? minParticipants;
  final String? status;

  const DrawJoinResult({
    required this.message,
    this.remainingWallet,
    this.myEntries,
    this.totalEntries,
    this.currentParticipants,
    this.minParticipants,
    this.status,
  });

  factory DrawJoinResult.fromJson(Map<String, dynamic> json) {
    return DrawJoinResult(
      message: json['message']?.toString() ?? 'تمت المشاركة في السحب بنجاح',
      remainingWallet: (json['remainingWallet'] as num?)?.toInt(),
      myEntries: (json['myEntries'] as num?)?.toInt(),
      totalEntries: (json['totalEntries'] as num?)?.toInt(),
      currentParticipants: (json['currentParticipants'] as num?)?.toInt(),
      minParticipants: (json['minParticipants'] as num?)?.toInt(),
      status: json['status']?.toString(),
    );
  }
}
