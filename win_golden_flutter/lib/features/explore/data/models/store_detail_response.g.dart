// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'store_detail_response.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StoreDetailResponse _$StoreDetailResponseFromJson(Map<String, dynamic> json) =>
    StoreDetailResponse(
      store: StoreModel.fromJson(json['store'] as Map<String, dynamic>),
      offers: (json['offers'] as List<dynamic>?)
          ?.map((e) => e as Map<String, dynamic>)
          .toList(),
      products: (json['products'] as List<dynamic>?)
          ?.map((e) => e as Map<String, dynamic>)
          .toList(),
      membershipStatus: json['membershipStatus'] as String?,
      storeCompetitionsEnabled: json['storeCompetitionsEnabled'] as bool?,
    );

Map<String, dynamic> _$StoreDetailResponseToJson(
        StoreDetailResponse instance) =>
    <String, dynamic>{
      'store': instance.store,
      'offers': instance.offers,
      'products': instance.products,
      'membershipStatus': instance.membershipStatus,
      'storeCompetitionsEnabled': instance.storeCompetitionsEnabled,
    };

MemberPrize _$MemberPrizeFromJson(Map<String, dynamic> json) => MemberPrize(
      id: json['_id'] as String,
      title: json['title'] as String,
      icon: json['icon'] as String?,
      description: json['description'] as String?,
    );

Map<String, dynamic> _$MemberPrizeToJson(MemberPrize instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'title': instance.title,
      'icon': instance.icon,
      'description': instance.description,
    };
