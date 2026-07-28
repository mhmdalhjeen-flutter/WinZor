class PointSourceItem {
  final String id;
  final String label;
  final int points;
  final DateTime? date;

  const PointSourceItem({
    required this.id,
    required this.label,
    required this.points,
    this.date,
  });

  factory PointSourceItem.fromJson(Map<String, dynamic> json) {
    return PointSourceItem(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      points: (json['points'] as num?)?.toInt() ?? 0,
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'label': label,
        'points': points,
        'date': date?.toIso8601String(),
      };
}

int _parsePointsFromText(String? text) {
  final m = RegExp(r'(\d+)\s*نقاط?').firstMatch(text ?? '');
  return m != null ? int.tryParse(m.group(1)!) ?? 0 : 0;
}

int _extractPositivePoints(Map<String, dynamic> notification) {
  final type = notification['type']?.toString();
  final body = notification['body']?.toString() ?? '';
  final data = notification['data'];
  final dataMap = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};

  if (type == 'order_point_gift') {
    final fromData = (dataMap['points'] as num?)?.toInt();
    if (fromData != null && fromData > 0) return fromData;
    final fromText = _parsePointsFromText(body);
    return fromText > 0 ? fromText : 1;
  }
  if (type == 'referral_batch') {
    return (dataMap['totalPoints'] as num?)?.toInt() ?? _parsePointsFromText(body);
  }

  final plusMatch = RegExp(r'\(\+(\d+)\s*نقطة').firstMatch(body);
  if (plusMatch != null) return int.tryParse(plusMatch.group(1)!) ?? 0;

  final addMatch = RegExp(r'تمت إضافة\s+(\d+)\s*نقاط?').firstMatch(body);
  if (addMatch != null) return int.tryParse(addMatch.group(1)!) ?? 0;

  final refundMatch = RegExp(r'استرداد\s+(\d+)\s*نقاط').firstMatch(body);
  if (refundMatch != null) return int.tryParse(refundMatch.group(1)!) ?? 0;

  return 0;
}

String _labelForNotification(Map<String, dynamic> notification, int points) {
  final type = notification['type']?.toString();
  final body = notification['body']?.toString() ?? '';
  final data = notification['data'];
  final dataMap = data is Map ? Map<String, dynamic>.from(data) : <String, dynamic>{};

  if (type == 'order_point_gift') {
    final storeName = dataMap['storeName']?.toString() ??
        body.replaceFirst(RegExp(r'.*من قبل\s*'), '').trim();
    return storeName.isNotEmpty ? 'شراء من متجر $storeName' : 'شراء من متجر';
  }
  if (type == 'referral_batch') return 'دعوة أصدقائك';
  if (type == 'bazaar_listing_rejected' && body.contains('استرداد')) return 'استرداد نقاط';
  if (RegExp(r'استرداد\s+كود|كود|بطاقة', caseSensitive: false).hasMatch(body) && points > 0) {
    return 'بطاقة نقاط';
  }
  final title = notification['title']?.toString() ?? '';
  if (title.isNotEmpty && RegExp(r'هدية|مكافأة').hasMatch(title)) return title;
  return title.isNotEmpty ? title : 'مكافأة نقاط';
}

PointSourceItem? mapNotificationToPointSource(Map<String, dynamic> notification) {
  final id = notification['_id']?.toString();
  if (id == null || id.isEmpty) return null;
  final points = _extractPositivePoints(notification);
  if (points <= 0) return null;
  return PointSourceItem(
    id: 'notif-$id',
    label: _labelForNotification(notification, points),
    points: points,
    date: DateTime.tryParse(notification['createdAt']?.toString() ?? ''),
  );
}

PointSourceItem? mapWheelWinToPointSource(Map<String, dynamic> win) {
  final id = win['_id']?.toString();
  if (id == null || id.isEmpty) return null;

  final prize = win['prize'];
  final prizeMap = prize is Map ? Map<String, dynamic>.from(prize) : null;
  int points = 0;

  if (prizeMap != null && prizeMap['prizeType'] == 'points') {
    points = (prizeMap['prizeValue'] as num?)?.toInt() ??
        _parsePointsFromText(win['prizeName']?.toString());
  } else {
    points = _parsePointsFromText(win['prizeName']?.toString());
    if (points <= 0) return null;
    if (prizeMap != null &&
        prizeMap['prizeType'] != null &&
        prizeMap['prizeType'] != 'points') {
      return null;
    }
  }

  if (points <= 0) return null;
  return PointSourceItem(
    id: 'wheel-$id',
    label: 'عجلة الحظ',
    points: points,
    date: DateTime.tryParse(
      win['wonAt']?.toString() ?? win['createdAt']?.toString() ?? '',
    ),
  );
}

List<PointSourceItem> mergeRecentPointSources(
  List<dynamic> notifications,
  List<dynamic> wheelWins, [
  int limit = 3,
]) {
  final items = <PointSourceItem>[];
  for (final n in notifications) {
    if (n is Map) {
      final mapped = mapNotificationToPointSource(Map<String, dynamic>.from(n));
      if (mapped != null) items.add(mapped);
    }
  }
  for (final w in wheelWins) {
    if (w is Map) {
      final mapped = mapWheelWinToPointSource(Map<String, dynamic>.from(w));
      if (mapped != null) items.add(mapped);
    }
  }
  items.sort((a, b) {
    final ad = a.date ?? DateTime.fromMillisecondsSinceEpoch(0);
    final bd = b.date ?? DateTime.fromMillisecondsSinceEpoch(0);
    return bd.compareTo(ad);
  });
  return items.take(limit).toList();
}
