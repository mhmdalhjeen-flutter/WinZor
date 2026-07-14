import 'package:json_annotation/json_annotation.dart';

part 'store_model.g.dart';

@JsonSerializable()
class StoreModel {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String? description;
  final String? category;
  final String? categoryId;
  final String? region;
  final String? subRegion;
  final String? logo;
  final String? coverImage;
  final bool isVerifiedStore;
  final double ratingAvg;
  final int ratingCount;
  final int customersCount;
  final String? membershipStatus;

  StoreModel({
    required this.id,
    required this.name,
    this.description,
    this.category,
    this.categoryId,
    this.region,
    this.subRegion,
    this.logo,
    this.coverImage,
    this.isVerifiedStore = false,
    this.ratingAvg = 0,
    this.ratingCount = 0,
    this.customersCount = 0,
    this.membershipStatus,
  });

  factory StoreModel.fromJson(Map<String, dynamic> json) => _$StoreModelFromJson(json);
  Map<String, dynamic> toJson() => _$StoreModelToJson(this);
}
