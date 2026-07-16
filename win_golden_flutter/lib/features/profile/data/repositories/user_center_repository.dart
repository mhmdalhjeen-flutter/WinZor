import '../../../../core/api/api_client.dart';
import '../models/point_sources.dart';
import '../models/user_center_models.dart';

class UserCenterRepository {
  final ApiClient _apiClient;

  UserCenterRepository(this._apiClient);

  Future<UserCenterData> getCenter() async {
    final response = await _apiClient.dio.get('/users/me/center');
    return UserCenterData.fromJson(Map<String, dynamic>.from(response.data as Map));
  }

  Future<Map<String, dynamic>> updateProfile({String? name, String? avatar}) async {
    final body = <String, dynamic>{};
    if (name != null) body['name'] = name;
    if (avatar != null) body['avatar'] = avatar;
    final response = await _apiClient.dio.patch('/users/me/profile', data: body);
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> requestPhoneChange(String newPhone) async {
    final response = await _apiClient.dio.post(
      '/users/me/phone/request',
      data: {'newPhone': newPhone},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> verifyPhoneChange(String code) async {
    final response = await _apiClient.dio.post(
      '/users/me/phone/verify',
      data: {'code': code},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> updatePreferences(UserPreferences prefs) async {
    final response = await _apiClient.dio.patch(
      '/users/me/preferences',
      data: prefs.toPayload(),
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<void> submitSuggestion(String message) async {
    await _apiClient.dio.post('/users/me/suggestions', data: {'message': message});
  }

  Future<Map<String, dynamic>> getAdminContact() async {
    final response = await _apiClient.dio.get('/users/me/admin-contact');
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<List<AchievementMilestone>> getAchievements() async {
    final response = await _apiClient.dio.get('/achievements/my');
    final road = response.data['road'];
    if (road is! List) return [];
    return road
        .whereType<Map>()
        .map((e) => AchievementMilestone.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  Future<void> markAchievementSeen(String id) async {
    await _apiClient.dio.post('/achievements/$id/seen');
  }

  Future<List<PointSourceItem>> getRecentPointSources({int limit = 3}) async {
    List<dynamic> notifications = [];
    List<dynamic> wins = [];

    try {
      final notifRes = await _apiClient.dio.get(
        '/notifications',
        queryParameters: {'limit': 40},
      );
      notifications = notifRes.data['notifications'] as List? ?? [];
    } catch (_) {}

    try {
      final wheelRes = await _apiClient.dio.get('/wheel/my-wins');
      final data = wheelRes.data;
      if (data is Map && data['wins'] is List) {
        wins = data['wins'] as List;
      } else if (data is List) {
        wins = data;
      }
    } catch (_) {}

    return mergeRecentPointSources(notifications, wins, limit);
  }

  Future<List<CenterCompetition>> getCompetitions() async {
    final response = await _apiClient.dio.get('/competitions');
    final data = response.data;
    List<dynamic> list = [];
    if (data is List) {
      list = data;
    } else if (data is Map && data['competitions'] is List) {
      list = data['competitions'] as List;
    }
    return list
        .whereType<Map>()
        .map((e) => CenterCompetition.fromJson(Map<String, dynamic>.from(e)))
        .where((c) => c.id.isNotEmpty)
        .toList();
  }

  Future<Map<String, dynamic>> joinCompetition(String id, {int entries = 1}) async {
    final response = await _apiClient.dio.post(
      '/competitions/$id/join',
      data: {'entries': entries},
    );
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<PlatformSettings> getPlatformSettings() async {
    try {
      final response = await _apiClient.dio.get('/settings/public');
      final settings = response.data is Map
          ? (response.data['settings'] is Map
              ? Map<String, dynamic>.from(response.data['settings'] as Map)
              : Map<String, dynamic>.from(response.data as Map))
          : null;
      return PlatformSettings.fromJson(settings);
    } catch (_) {
      return const PlatformSettings();
    }
  }

  Future<List<Map<String, dynamic>>> getFlatRegions() async {
    final response = await _apiClient.dio.get('/regions');
    final data = response.data;
    if (data is List) {
      return data.whereType<Map>().map((e) => Map<String, dynamic>.from(e)).toList();
    }
    if (data is Map && data['regions'] is List) {
      return (data['regions'] as List)
          .whereType<Map>()
          .map((e) => Map<String, dynamic>.from(e))
          .toList();
    }
    return [];
  }

  Future<List<FlatCategory>> getFlatCategories(String type) async {
    final response = await _apiClient.dio.get(
      '/categories/tree',
      queryParameters: {'type': type},
    );
    final data = response.data;
    if (data is! List) return [];
    final result = <FlatCategory>[];
    void walk(dynamic node) {
      if (node is! Map) return;
      final map = Map<String, dynamic>.from(node);
      final id = map['_id']?.toString() ?? '';
      final name = map['name']?.toString() ?? '';
      if (id.isNotEmpty && name.isNotEmpty) {
        result.add(FlatCategory(id: id, name: name, icon: map['icon']?.toString()));
      }
      final children = map['children'];
      if (children is List) {
        for (final child in children) {
          walk(child);
        }
      }
    }

    for (final node in data) {
      walk(node);
    }
    return result;
  }
}
