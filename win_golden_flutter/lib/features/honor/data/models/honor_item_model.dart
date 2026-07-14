class HonorItemModel {
  final String id;
  final String title;
  final String message;
  final String? awardImage;
  final String? winnerImage;
  final String? prizeName;
  final DateTime? receivedAt;
  final String? competitionLink;
  final bool isPrimary;
  final int priority;
  final Map<String, dynamic>? user;

  const HonorItemModel({
    required this.id,
    required this.title,
    required this.message,
    this.awardImage,
    this.winnerImage,
    this.prizeName,
    this.receivedAt,
    this.competitionLink,
    this.isPrimary = false,
    this.priority = 0,
    this.user,
  });

  String get userName => user?['name']?.toString() ?? 'فائز';

  String? get userAvatar => user?['avatar']?.toString();

  String get prizeLabel {
    final p = prizeName?.trim();
    if (p != null && p.isNotEmpty) return p;
    return title;
  }

  factory HonorItemModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? userMap;
    final rawUser = json['user'];
    if (rawUser is Map) {
      userMap = Map<String, dynamic>.from(rawUser);
    }

    DateTime? received;
    final rawDate = json['receivedAt'];
    if (rawDate != null) {
      received = DateTime.tryParse(rawDate.toString());
    }

    return HonorItemModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      awardImage: json['awardImage']?.toString() ?? json['prizeImage']?.toString(),
      winnerImage: json['winnerImage']?.toString(),
      prizeName: json['prizeName']?.toString(),
      receivedAt: received,
      competitionLink: json['competitionLink']?.toString(),
      isPrimary: json['isPrimary'] == true,
      priority: int.tryParse(json['priority']?.toString() ?? '') ?? 0,
      user: userMap,
    );
  }
}
