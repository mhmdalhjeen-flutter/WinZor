import 'package:json_annotation/json_annotation.dart';
import '../../../explore/data/models/store_model.dart';

part 'offer_model.g.dart';

@JsonSerializable()
class OfferModel {
  @JsonKey(name: '_id')
  final String id;
  final String title;
  final String? description;
  final String offerType;
  final double? value;
  final double? originalPrice;
  final double? finalPrice;
  final String? currency;
  final String? image;
  
  // The API sometimes returns store as ID string and sometimes as object
  @JsonKey(fromJson: _storeFromJson)
  final dynamic store; 
  
  final bool isActive;
  final int views;
  final int clicks;
  final double ratingAvg;
  final int ratingCount;
  final DateTime? expiresAt;
  final Map<String, dynamic>? pricing;

  OfferModel({
    required this.id,
    required this.title,
    this.description,
    required this.offerType,
    this.value,
    this.originalPrice,
    this.finalPrice,
    this.currency,
    this.image,
    required this.store,
    required this.isActive,
    this.views = 0,
    this.clicks = 0,
    this.ratingAvg = 0,
    this.ratingCount = 0,
    this.expiresAt,
    this.pricing,
  });

  static dynamic _storeFromJson(dynamic json) {
    if (json is String) return json;
    if (json is Map<String, dynamic>) return StoreModel.fromJson(json);
    return json;
  }

  StoreModel? get storeObject => store is StoreModel ? store as StoreModel : null;
  String get storeId => store is StoreModel ? (store as StoreModel).id : store.toString();

  factory OfferModel.fromJson(Map<String, dynamic> json) => _$OfferModelFromJson(json);
  Map<String, dynamic> toJson() => _$OfferModelToJson(this);
}
