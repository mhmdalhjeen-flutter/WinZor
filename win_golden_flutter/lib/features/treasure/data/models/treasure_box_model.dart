class TreasureWonCard {
  final String name;
  final String? color;
  final String? icon;
  final int? points;

  const TreasureWonCard({
    required this.name,
    this.color,
    this.icon,
    this.points,
  });

  factory TreasureWonCard.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const TreasureWonCard(name: '');
    return TreasureWonCard(
      name: (json['name'] ?? '').toString(),
      color: json['color']?.toString(),
      icon: json['icon']?.toString(),
      points: int.tryParse(json['points']?.toString() ?? ''),
    );
  }
}

class TreasureOpenResult {
  final bool success;
  final String message;
  final TreasureWonCard? wonCard;

  const TreasureOpenResult({
    required this.success,
    required this.message,
    this.wonCard,
  });

  factory TreasureOpenResult.fromJson(Map<String, dynamic> json) {
    final won = json['wonCard'];
    return TreasureOpenResult(
      success: json['success'] != false,
      message: (json['message'] ?? 'مبروك! فتحت الصندوق').toString(),
      wonCard: won is Map
          ? TreasureWonCard.fromJson(Map<String, dynamic>.from(won))
          : null,
    );
  }
}

class TreasureBoxModel {
  final String id;
  final String title;
  final String? description;
  final String boxType;
  final int costInEnergy;
  final bool isActive;
  final String? storeName;
  final List<Map<String, dynamic>> rewards;

  const TreasureBoxModel({
    required this.id,
    required this.title,
    this.description,
    this.boxType = 'daily',
    this.costInEnergy = 0,
    this.isActive = true,
    this.storeName,
    this.rewards = const [],
  });

  String get typeLabel {
    switch (boxType) {
      case 'daily':
        return 'صندوق يومي';
      case 'sponsored':
        return 'صندوق برعاية';
      default:
        return 'صندوق ترويجي';
    }
  }

  String get costLabel =>
      costInEnergy > 0 ? '$costInEnergy طاقة لفتحه' : 'مجاني — مرة يومياً';

  factory TreasureBoxModel.fromJson(Map<String, dynamic> json) {
    final store = json['store'];
    String? storeName;
    if (store is Map) {
      storeName = store['name']?.toString();
    }

    final rawRewards = json['rewards'];
    final rewards = <Map<String, dynamic>>[];
    if (rawRewards is List) {
      for (final r in rawRewards) {
        if (r is Map) rewards.add(Map<String, dynamic>.from(r));
      }
    }

    return TreasureBoxModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: json['description']?.toString(),
      boxType: (json['boxType'] ?? 'daily').toString(),
      costInEnergy: int.tryParse(json['costInEnergy']?.toString() ?? '') ?? 0,
      isActive: json['isActive'] != false,
      storeName: storeName,
      rewards: rewards,
    );
  }
}
