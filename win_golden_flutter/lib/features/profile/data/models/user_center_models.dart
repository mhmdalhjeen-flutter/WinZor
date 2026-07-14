import 'levels.dart';

class UserCenterLegal {
  final String terms;
  final String privacy;
  final String disclaimer;

  const UserCenterLegal({
    this.terms = '',
    this.privacy = '',
    this.disclaimer = '',
  });

  factory UserCenterLegal.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserCenterLegal();
    return UserCenterLegal(
      terms: json['terms']?.toString() ?? '',
      privacy: json['privacy']?.toString() ?? '',
      disclaimer: json['disclaimer']?.toString() ?? '',
    );
  }

  String byTab(String tab) {
    switch (tab) {
      case 'privacy':
        return privacy;
      case 'disclaimer':
        return disclaimer;
      default:
        return terms;
    }
  }
}

class UserCenterLastPrize {
  final String? name;
  final DateTime? date;
  final String? type;

  const UserCenterLastPrize({this.name, this.date, this.type});

  factory UserCenterLastPrize.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserCenterLastPrize();
    return UserCenterLastPrize(
      name: json['name']?.toString(),
      date: DateTime.tryParse(json['date']?.toString() ?? ''),
      type: json['type']?.toString(),
    );
  }
}

class UserCenterStats {
  final int points;
  final int competitionsJoined;
  final int prizesWon;
  final int referralsCount;
  final int membershipsCount;
  final int codesUsed;
  final int promoCodesRedeemed;
  final UserCenterLastPrize? lastPrize;

  const UserCenterStats({
    this.points = 0,
    this.competitionsJoined = 0,
    this.prizesWon = 0,
    this.referralsCount = 0,
    this.membershipsCount = 0,
    this.codesUsed = 0,
    this.promoCodesRedeemed = 0,
    this.lastPrize,
  });

  factory UserCenterStats.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserCenterStats();
    return UserCenterStats(
      points: (json['points'] as num?)?.toInt() ?? 0,
      competitionsJoined: (json['competitionsJoined'] as num?)?.toInt() ?? 0,
      prizesWon: (json['prizesWon'] as num?)?.toInt() ?? 0,
      referralsCount: (json['referralsCount'] as num?)?.toInt() ?? 0,
      membershipsCount: (json['membershipsCount'] as num?)?.toInt() ?? 0,
      codesUsed: (json['codesUsed'] as num?)?.toInt() ?? 0,
      promoCodesRedeemed: (json['promoCodesRedeemed'] as num?)?.toInt() ?? 0,
      lastPrize: json['lastPrize'] is Map
          ? UserCenterLastPrize.fromJson(Map<String, dynamic>.from(json['lastPrize'] as Map))
          : null,
    );
  }
}

class UserPreferences {
  final String? regionId;
  final String? regionName;
  final List<String> interests;
  final List<String> storeTypes;
  final List<String> productInterests;

  const UserPreferences({
    this.regionId,
    this.regionName,
    this.interests = const [],
    this.storeTypes = const [],
    this.productInterests = const [],
  });

  factory UserPreferences.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const UserPreferences();
    final region = json['regionId'];
    String? regionId;
    String? regionName;
    if (region is Map) {
      regionId = region['_id']?.toString();
      regionName = region['name']?.toString();
    } else if (region != null) {
      regionId = region.toString();
    }
    List<String> asStrings(dynamic v) {
      if (v is! List) return [];
      return v.map((e) => e.toString()).toList();
    }

    return UserPreferences(
      regionId: regionId,
      regionName: regionName,
      interests: asStrings(json['interests']),
      storeTypes: asStrings(json['storeTypes']),
      productInterests: asStrings(json['productInterests']),
    );
  }

  Map<String, dynamic> toPayload() => {
        'regionId': regionId ?? '',
        'interests': interests,
        'storeTypes': storeTypes,
        'productInterests': productInterests,
      };

  UserPreferences copyWith({
    String? regionId,
    String? regionName,
    List<String>? interests,
    List<String>? storeTypes,
    List<String>? productInterests,
  }) {
    return UserPreferences(
      regionId: regionId ?? this.regionId,
      regionName: regionName ?? this.regionName,
      interests: interests ?? this.interests,
      storeTypes: storeTypes ?? this.storeTypes,
      productInterests: productInterests ?? this.productInterests,
    );
  }
}

class CenterUser {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? avatar;
  final int points;
  final String? referralCode;
  final int codesUsed;
  final UserPreferences preferences;
  final bool? isVerified;
  final bool? phoneVerified;
  final bool? emailVerified;

  const CenterUser({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.avatar,
    this.points = 0,
    this.referralCode,
    this.codesUsed = 0,
    this.preferences = const UserPreferences(),
    this.isVerified,
    this.phoneVerified,
    this.emailVerified,
  });

  factory CenterUser.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const CenterUser(id: '', name: '');
    }
    return CenterUser(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      avatar: json['avatar']?.toString(),
      points: (json['points'] as num?)?.toInt() ?? 0,
      referralCode: json['referralCode']?.toString(),
      codesUsed: (json['codesUsed'] as num?)?.toInt() ?? 0,
      preferences: UserPreferences.fromJson(
        json['preferences'] is Map
            ? Map<String, dynamic>.from(json['preferences'] as Map)
            : null,
      ),
      isVerified: json['isVerified'] as bool?,
      phoneVerified: json['phoneVerified'] as bool?,
      emailVerified: json['emailVerified'] as bool?,
    );
  }
}

class UserCenterData {
  final CenterUser user;
  final LevelProgress level;
  final UserCenterStats stats;
  final UserCenterLegal legal;

  const UserCenterData({
    required this.user,
    required this.level,
    required this.stats,
    required this.legal,
  });

  factory UserCenterData.fromJson(Map<String, dynamic> json) {
    final user = CenterUser.fromJson(
      json['user'] is Map ? Map<String, dynamic>.from(json['user'] as Map) : null,
    );
    final points = (json['stats'] is Map
            ? (json['stats']['points'] as num?)?.toInt()
            : null) ??
        user.points;
    return UserCenterData(
      user: user,
      level: LevelProgress.fromJson(
        json['level'] is Map ? Map<String, dynamic>.from(json['level'] as Map) : null,
        points,
      ),
      stats: UserCenterStats.fromJson(
        json['stats'] is Map ? Map<String, dynamic>.from(json['stats'] as Map) : null,
      ),
      legal: UserCenterLegal.fromJson(
        json['legal'] is Map ? Map<String, dynamic>.from(json['legal'] as Map) : null,
      ),
    );
  }
}

class AchievementMilestone {
  final String id;
  final String name;
  final String? icon;
  final String? image;
  final int pointsRequired;
  final bool unlocked;
  final bool animationSeen;

  const AchievementMilestone({
    required this.id,
    required this.name,
    this.icon,
    this.image,
    required this.pointsRequired,
    this.unlocked = false,
    this.animationSeen = false,
  });

  factory AchievementMilestone.fromJson(Map<String, dynamic> json) {
    return AchievementMilestone(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      icon: json['icon']?.toString(),
      image: json['image']?.toString(),
      pointsRequired: (json['pointsRequired'] as num?)?.toInt() ?? 0,
      unlocked: json['unlocked'] == true,
      animationSeen: json['animationSeen'] == true,
    );
  }

  AchievementMilestone copyWith({bool? animationSeen}) {
    return AchievementMilestone(
      id: id,
      name: name,
      icon: icon,
      image: image,
      pointsRequired: pointsRequired,
      unlocked: unlocked,
      animationSeen: animationSeen ?? this.animationSeen,
    );
  }
}

class PlatformSettings {
  final bool referralProgram;
  final bool storeCompetitions;
  final bool wheel;
  final bool wheelUserCenterPlacement;
  /// Raw `settings.verification` from `GET /settings/public`.
  final Map<String, dynamic>? verification;

  const PlatformSettings({
    this.referralProgram = true,
    this.storeCompetitions = true,
    this.wheel = true,
    this.wheelUserCenterPlacement = true,
    this.verification,
  });

  bool get showWheelBtn => wheel && wheelUserCenterPlacement;

  factory PlatformSettings.fromJson(Map<String, dynamic>? settings) {
    if (settings == null) return const PlatformSettings();
    final features = settings['features'] is Map
        ? Map<String, dynamic>.from(settings['features'] as Map)
        : <String, dynamic>{};
    final wheelCfg = settings['wheel'] is Map
        ? Map<String, dynamic>.from(settings['wheel'] as Map)
        : <String, dynamic>{};
    final placements = wheelCfg['placements'] is Map
        ? Map<String, dynamic>.from(wheelCfg['placements'] as Map)
        : <String, dynamic>{};
    final verification = settings['verification'] is Map
        ? Map<String, dynamic>.from(settings['verification'] as Map)
        : null;

    return PlatformSettings(
      referralProgram: features['referralProgram'] != false,
      storeCompetitions: features['storeCompetitions'] != false,
      wheel: features['wheel'] != false,
      wheelUserCenterPlacement: placements['userCenter'] != false,
      verification: verification,
    );
  }
}

class CenterCompetition {
  final String id;
  final String title;
  final String? description;
  final String? image;
  final int minPoints;
  final int pointsPerEntry;
  final DateTime? endDate;
  final bool hasEnded;
  final bool joined;
  final int myEntries;

  const CenterCompetition({
    required this.id,
    required this.title,
    this.description,
    this.image,
    this.minPoints = 0,
    this.pointsPerEntry = 1,
    this.endDate,
    this.hasEnded = false,
    this.joined = false,
    this.myEntries = 0,
  });

  factory CenterCompetition.fromJson(Map<String, dynamic> json) {
    final end = DateTime.tryParse(json['endDate']?.toString() ?? '');
    final endedFlag = json['hasEnded'] == true ||
        (end != null && !end.isAfter(DateTime.now()));
    return CenterCompetition(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      image: json['image']?.toString(),
      minPoints: (json['minPoints'] as num?)?.toInt() ?? 0,
      pointsPerEntry: (json['pointsPerEntry'] as num?)?.toInt() ?? 1,
      endDate: end,
      hasEnded: endedFlag,
      joined: json['joined'] == true || json['hasJoined'] == true,
      myEntries: (json['myEntries'] as num?)?.toInt() ?? 0,
    );
  }

  CenterCompetition copyWith({bool? joined, int? myEntries}) {
    return CenterCompetition(
      id: id,
      title: title,
      description: description,
      image: image,
      minPoints: minPoints,
      pointsPerEntry: pointsPerEntry,
      endDate: endDate,
      hasEnded: hasEnded,
      joined: joined ?? this.joined,
      myEntries: myEntries ?? this.myEntries,
    );
  }
}

class FlatCategory {
  final String id;
  final String name;
  final String? icon;

  const FlatCategory({required this.id, required this.name, this.icon});
}
