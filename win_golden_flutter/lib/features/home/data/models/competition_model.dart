import 'package:json_annotation/json_annotation.dart';

part 'competition_model.g.dart';

@JsonSerializable()
class CompetitionModel {
  @JsonKey(name: '_id')
  final String id;
  final String title;
  final String? description;
  final String? image;
  final int minPoints;
  final int pointsPerEntry;
  final int requiredParticipants;
  final String? location;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? prizeName;
  final String? prizeImage;
  final bool isFeatured;
  final String status;
  final int totalEntries;
  final int participantsCount;

  CompetitionModel({
    required this.id,
    required this.title,
    this.description,
    this.image,
    required this.minPoints,
    required this.pointsPerEntry,
    required this.requiredParticipants,
    this.location,
    this.startDate,
    this.endDate,
    this.prizeName,
    this.prizeImage,
    required this.isFeatured,
    required this.status,
    required this.totalEntries,
    required this.participantsCount,
  });

  factory CompetitionModel.fromJson(Map<String, dynamic> json) => _$CompetitionModelFromJson(json);
  Map<String, dynamic> toJson() => _$CompetitionModelToJson(this);
}
