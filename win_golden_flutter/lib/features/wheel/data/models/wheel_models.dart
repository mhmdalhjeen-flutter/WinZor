class WheelSegment {
  final String id;
  final int index;
  final String name;
  final String? description;
  final String icon;
  final String? image;
  final String color;
  final int minPoints;
  final double displayWeight;
  final bool locked;
  final String prizeType;

  const WheelSegment({
    required this.id,
    required this.index,
    required this.name,
    this.description,
    this.icon = '🎁',
    this.image,
    this.color = '#6366F1',
    this.minPoints = 0,
    this.displayWeight = 1,
    this.locked = false,
    this.prizeType = 'item',
  });

  factory WheelSegment.fromJson(Map<String, dynamic> json, {int fallbackIndex = 0}) {
    return WheelSegment(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      index: (json['index'] as num?)?.toInt() ?? fallbackIndex,
      name: (json['name'] ?? '').toString(),
      description: json['description']?.toString(),
      icon: (json['icon'] ?? '🎁').toString(),
      image: json['image']?.toString(),
      color: (json['color'] ?? '#6366F1').toString(),
      minPoints: (json['minPoints'] as num?)?.toInt() ?? 0,
      displayWeight: (json['displayWeight'] as num?)?.toDouble() ?? 1,
      locked: json['locked'] == true,
      prizeType: (json['prizeType'] ?? 'item').toString(),
    );
  }
}

class WheelPrizeInfo {
  final String id;
  final String name;
  final String icon;
  final String? color;
  final String? image;
  final int minPoints;
  final String? prizeType;
  final int? prizeValue;
  final String? description;

  const WheelPrizeInfo({
    required this.id,
    required this.name,
    this.icon = '🎁',
    this.color,
    this.image,
    this.minPoints = 0,
    this.prizeType,
    this.prizeValue,
    this.description,
  });

  factory WheelPrizeInfo.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const WheelPrizeInfo(id: '', name: '');
    }
    return WheelPrizeInfo(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      icon: (json['icon'] ?? '🎁').toString(),
      color: json['color']?.toString(),
      image: json['image']?.toString(),
      minPoints: (json['minPoints'] as num?)?.toInt() ?? 0,
      prizeType: json['prizeType']?.toString(),
      prizeValue: (json['prizeValue'] as num?)?.toInt(),
      description: json['description']?.toString(),
    );
  }
}

class WheelConfig {
  final bool enabled;
  final int spinCost;
  final int userPoints;
  final int segmentCount;
  final List<WheelSegment> segments;

  const WheelConfig({
    this.enabled = true,
    this.spinCost = 5,
    this.userPoints = 0,
    this.segmentCount = 0,
    this.segments = const [],
  });

  factory WheelConfig.fromJson(Map<String, dynamic> json) {
    final raw = json['segments'];
    final list = <WheelSegment>[];
    if (raw is List) {
      for (var i = 0; i < raw.length; i++) {
        final item = raw[i];
        if (item is Map) {
          list.add(WheelSegment.fromJson(
            Map<String, dynamic>.from(item),
            fallbackIndex: i,
          ));
        }
      }
    }
    return WheelConfig(
      enabled: json['enabled'] != false,
      spinCost: (json['spinCost'] as num?)?.toInt() ?? 5,
      userPoints: (json['userPoints'] as num?)?.toInt() ?? 0,
      segmentCount: (json['segmentCount'] as num?)?.toInt() ?? list.length,
      segments: list,
    );
  }
}

class WheelSpinResult {
  final String? spinId;
  final String outcome; // win | no_win | locked
  final bool charged;
  final int pointsCost;
  final int userPoints;
  final int segmentIndex;
  final int segmentCount;
  final WheelPrizeInfo? prize;
  final String? winId;
  final String message;

  const WheelSpinResult({
    this.spinId,
    required this.outcome,
    this.charged = false,
    this.pointsCost = 0,
    this.userPoints = 0,
    this.segmentIndex = 0,
    this.segmentCount = 0,
    this.prize,
    this.winId,
    this.message = '',
  });

  factory WheelSpinResult.fromJson(Map<String, dynamic> json) {
    return WheelSpinResult(
      spinId: json['spinId']?.toString(),
      outcome: (json['outcome'] ?? 'no_win').toString(),
      charged: json['charged'] == true,
      pointsCost: (json['pointsCost'] as num?)?.toInt() ?? 0,
      userPoints: (json['userPoints'] as num?)?.toInt() ?? 0,
      segmentIndex: (json['segmentIndex'] as num?)?.toInt() ?? 0,
      segmentCount: (json['segmentCount'] as num?)?.toInt() ?? 0,
      prize: json['prize'] is Map
          ? WheelPrizeInfo.fromJson(Map<String, dynamic>.from(json['prize'] as Map))
          : null,
      winId: json['winId']?.toString(),
      message: json['message']?.toString() ?? '',
    );
  }
}

class WheelWin {
  final String id;
  final String prizeName;
  final DateTime? wonAt;
  final String deliveryStatus;
  final WheelPrizeInfo? prize;

  const WheelWin({
    required this.id,
    required this.prizeName,
    this.wonAt,
    this.deliveryStatus = 'pending',
    this.prize,
  });

  factory WheelWin.fromJson(Map<String, dynamic> json) {
    String prizeName = (json['prizeName'] ?? '').toString();
    if (prizeName.isEmpty && json['prize'] is Map) {
      prizeName = (json['prize']['name'] ?? 'جائزة').toString();
    }
    if (prizeName.isEmpty) prizeName = 'جائزة';

    return WheelWin(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      prizeName: prizeName,
      wonAt: DateTime.tryParse(json['wonAt']?.toString() ?? ''),
      deliveryStatus: (json['deliveryStatus'] ?? 'pending').toString(),
      prize: json['prize'] is Map
          ? WheelPrizeInfo.fromJson(Map<String, dynamic>.from(json['prize'] as Map))
          : null,
    );
  }
}
