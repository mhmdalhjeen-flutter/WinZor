import '../../../../core/api/api_client.dart';
import '../models/competition_model.dart';

class CompetitionsRepository {
  final ApiClient _apiClient;

  CompetitionsRepository(this._apiClient);

  List<CompetitionModel> _parseList(dynamic data) {
    List<dynamic> raw = [];
    if (data is List) {
      raw = data;
    } else if (data is Map) {
      if (data['competitions'] is List) {
        raw = data['competitions'] as List;
      } else if (data['competition'] != null) {
        raw = [data['competition']];
      }
    }
    return raw
        .whereType<Map>()
        .map((e) => CompetitionModel.fromJson(Map<String, dynamic>.from(e)))
        .where((c) => c.id.isNotEmpty)
        .toList();
  }

  Future<List<CompetitionModel>> getCompetitions() async {
    final response = await _apiClient.dio.get('/competitions');
    return _parseList(response.data);
  }

  Future<List<CompetitionModel>> getFeatured() async {
    final response = await _apiClient.dio.get('/competitions/featured');
    return _parseList(response.data);
  }

  /// Mirrors React FeaturedCompetitions merge: featured endpoint + isFeatured from list, max 2.
  Future<List<CompetitionModel>> getFeaturedMerged() async {
    List<CompetitionModel> fromFeatured = [];
    List<CompetitionModel> fromList = [];
    try {
      fromFeatured = await getFeatured();
    } catch (_) {}
    try {
      fromList = await getCompetitions();
    } catch (_) {}

    final featuredFromList = fromList.where((c) => c.isFeatured).toList();
    final seen = <String>{};
    final merged = <CompetitionModel>[];

    for (final c in fromFeatured) {
      if (merged.length >= 2) break;
      if (seen.add(c.id)) merged.add(c);
    }
    for (final c in featuredFromList) {
      if (merged.length >= 2) break;
      if (seen.add(c.id)) merged.add(c);
    }
    return merged;
  }

  Future<CompetitionModel> getById(String id) async {
    final response = await _apiClient.dio.get('/competitions/$id');
    final data = response.data;
    if (data is Map && data['competition'] is Map) {
      return CompetitionModel.fromJson(
        Map<String, dynamic>.from(data['competition'] as Map),
      );
    }
    if (data is Map) {
      return CompetitionModel.fromJson(Map<String, dynamic>.from(data));
    }
    throw StateError('المسابقة غير موجودة');
  }

  Future<CompetitionJoinResult> join(String id, {required int entries}) async {
    final response = await _apiClient.dio.post(
      '/competitions/$id/join',
      data: {'entries': entries},
    );
    final data = Map<String, dynamic>.from(response.data as Map);
    final competition = data['competition'] is Map
        ? CompetitionModel.fromJson(
            Map<String, dynamic>.from(data['competition'] as Map),
          )
        : CompetitionModel.fromJson(data);
    return CompetitionJoinResult(
      competition: competition,
      userPoints: (data['userPoints'] as num?)?.toInt(),
      message: data['message']?.toString() ?? 'تمت المشاركة بنجاح',
    );
  }
}
