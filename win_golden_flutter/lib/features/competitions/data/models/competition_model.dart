class CompetitionModel {
  final String id;
  final String title;
  final String? description;
  final String? image;
  final int minPoints;
  final int pointsPerEntry;
  final int requiredParticipants;
  final String? location;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? prizeName;
  final String? prizeImage;
  final String? drawLink;
  final bool isFeatured;
  final String status;
  final int totalEntries;
  final int participantsCount;
  final bool joined;
  final int myEntries;
  final bool hasEnded;

  const CompetitionModel({
    required this.id,
    required this.title,
    this.description,
    this.image,
    this.minPoints = 0,
    this.pointsPerEntry = 1,
    this.requiredParticipants = 0,
    this.location,
    this.startDate,
    this.endDate,
    this.prizeName,
    this.prizeImage,
    this.drawLink,
    this.isFeatured = false,
    this.status = 'active',
    this.totalEntries = 0,
    this.participantsCount = 0,
    this.joined = false,
    this.myEntries = 0,
    this.hasEnded = false,
  });

  bool get ended {
    if (hasEnded || status == 'ended') return true;
    if (endDate != null && !endDate!.isAfter(DateTime.now())) return true;
    return false;
  }

  int get effectivePointsPerEntry => pointsPerEntry <= 0 ? 1 : pointsPerEntry;

  double get progress {
    if (requiredParticipants <= 0) return 0;
    return (participantsCount / requiredParticipants).clamp(0.0, 1.0);
  }

  factory CompetitionModel.fromJson(Map<String, dynamic> json) {
    final end = DateTime.tryParse(json['endDate']?.toString() ?? '');
    final endedFlag = json['hasEnded'] == true ||
        json['status']?.toString() == 'ended' ||
        (end != null && !end.isAfter(DateTime.now()));

    return CompetitionModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      image: _nullableUrl(json['image']),
      minPoints: (json['minPoints'] as num?)?.toInt() ?? 0,
      pointsPerEntry: (json['pointsPerEntry'] as num?)?.toInt() ?? 1,
      requiredParticipants: (json['requiredParticipants'] as num?)?.toInt() ?? 0,
      location: json['location']?.toString(),
      startDate: DateTime.tryParse(json['startDate']?.toString() ?? ''),
      endDate: end,
      prizeName: json['prizeName']?.toString(),
      prizeImage: _nullableUrl(json['prizeImage']),
      drawLink: json['drawLink']?.toString(),
      isFeatured: json['isFeatured'] == true,
      status: (json['status'] ?? 'active').toString(),
      totalEntries: (json['totalEntries'] as num?)?.toInt() ?? 0,
      participantsCount: (json['participantsCount'] as num?)?.toInt() ?? 0,
      joined: json['joined'] == true || json['hasJoined'] == true,
      myEntries: (json['myEntries'] as num?)?.toInt() ?? 0,
      hasEnded: endedFlag,
    );
  }

  static String? _nullableUrl(dynamic raw) {
    if (raw == null) return null;
    final s = raw.toString();
    if (s.isEmpty || s.startsWith('data:')) return null;
    return s;
  }

  CompetitionModel copyWith({
    bool? joined,
    int? myEntries,
    int? participantsCount,
    int? totalEntries,
    bool? hasEnded,
  }) {
    return CompetitionModel(
      id: id,
      title: title,
      description: description,
      image: image,
      minPoints: minPoints,
      pointsPerEntry: pointsPerEntry,
      requiredParticipants: requiredParticipants,
      location: location,
      startDate: startDate,
      endDate: endDate,
      prizeName: prizeName,
      prizeImage: prizeImage,
      drawLink: drawLink,
      isFeatured: isFeatured,
      status: status,
      totalEntries: totalEntries ?? this.totalEntries,
      participantsCount: participantsCount ?? this.participantsCount,
      joined: joined ?? this.joined,
      myEntries: myEntries ?? this.myEntries,
      hasEnded: hasEnded ?? this.hasEnded,
    );
  }
}

class CompetitionJoinResult {
  final CompetitionModel competition;
  final int? userPoints;
  final String message;

  const CompetitionJoinResult({
    required this.competition,
    this.userPoints,
    this.message = 'تمت المشاركة بنجاح',
  });
}

String competitionTimeLeft(DateTime? endDate) {
  if (endDate == null) return '—';
  final diff = endDate.difference(DateTime.now());
  if (diff.isNegative) return 'انتهت';
  final d = diff.inDays;
  final h = diff.inHours % 24;
  return d > 0 ? '$d يوم $h س' : '$h ساعة';
}
