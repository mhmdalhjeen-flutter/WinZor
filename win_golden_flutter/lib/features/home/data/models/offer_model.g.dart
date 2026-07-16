// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offer_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

OfferModel _$OfferModelFromJson(Map<String, dynamic> json) => OfferModel(
      id: json['_id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      offerType: json['offerType'] as String,
      value: (json['value'] as num?)?.toDouble(),
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      finalPrice: (json['finalPrice'] as num?)?.toDouble(),
      currency: json['currency'] as String?,
      image: json['image'] as String?,
      store: OfferModel._storeFromJson(json['store']),
      isActive: json['isActive'] as bool,
      views: (json['views'] as num?)?.toInt() ?? 0,
      clicks: (json['clicks'] as num?)?.toInt() ?? 0,
      ratingAvg: (json['ratingAvg'] as num?)?.toDouble() ?? 0,
      ratingCount: (json['ratingCount'] as num?)?.toInt() ?? 0,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.parse(json['expiresAt'] as String),
      pricing: json['pricing'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$OfferModelToJson(OfferModel instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'title': instance.title,
      'description': instance.description,
      'offerType': instance.offerType,
      'value': instance.value,
      'originalPrice': instance.originalPrice,
      'finalPrice': instance.finalPrice,
      'currency': instance.currency,
      'image': instance.image,
      'store': instance.store,
      'isActive': instance.isActive,
      'views': instance.views,
      'clicks': instance.clicks,
      'ratingAvg': instance.ratingAvg,
      'ratingCount': instance.ratingCount,
      'expiresAt': instance.expiresAt?.toIso8601String(),
      'pricing': instance.pricing,
    };
