// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'store_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StoreModel _$StoreModelFromJson(Map<String, dynamic> json) => StoreModel(
      id: json['_id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      category: json['category'] as String?,
      categoryId: json['categoryId'] as String?,
      region: json['region'] as String?,
      subRegion: json['subRegion'] as String?,
      logo: json['logo'] as String?,
      coverImage: json['coverImage'] as String?,
      isVerifiedStore: json['isVerifiedStore'] as bool? ?? false,
      ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
      ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
      customersCount: (json['customersCount'] as num?)?.toInt() ?? 0,
      membershipStatus: json['membershipStatus'] as String?,
    );

Map<String, dynamic> _$StoreModelToJson(StoreModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'category': instance.category,
      'categoryId': instance.categoryId,
      'region': instance.region,
      'subRegion': instance.subRegion,
      'logo': instance.logo,
      'coverImage': instance.coverImage,
      'isVerifiedStore': instance.isVerifiedStore,
      'ratingAvg': instance.ratingAvg,
      'ratingCount': instance.ratingCount,
      'customersCount': instance.customersCount,
      'membershipStatus': instance.membershipStatus,
    };
