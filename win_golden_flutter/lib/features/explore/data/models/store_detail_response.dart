import 'package:json_annotation/json_annotation.dart';
import 'store_model.dart';
import '../../../home/data/models/offer_model.dart'; // تم تصحيح المسار من ../../ إلى ../../../

part 'store_detail_response.g.dart';

@JsonSerializable()
class StoreDetailResponse {
  final StoreModel store;
  final List<Map<String, dynamic>>? offers; 
  final List<Map<String, dynamic>>? products;
  final String? membershipStatus;
  final bool? storeCompetitionsEnabled;

  StoreDetailResponse({
    required this.store,
    this.offers,
    this.products,
    this.membershipStatus,
    this.storeCompetitionsEnabled,
  });

  factory StoreDetailResponse.fromJson(Map<String, dynamic> json) => _$StoreDetailResponseFromJson(json);
  Map<String, dynamic> toJson() => _$StoreDetailResponseToJson(this);
}

@JsonSerializable()
class MemberPrize {
  @JsonKey(name: '_id')
  final String id;
  final String title;
  final String? icon;
  final String? description;

  MemberPrize({
    required this.id,
    required this.title,
    this.icon,
    this.description,
  });

  factory MemberPrize.fromJson(Map<String, dynamic> json) => _$MemberPrizeFromJson(json);
  Map<String, dynamic> toJson() => _$MemberPrizeToJson(this);
}
