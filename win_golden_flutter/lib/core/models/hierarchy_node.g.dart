// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'hierarchy_node.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

HierarchyNode _$HierarchyNodeFromJson(Map<String, dynamic> json) =>
    HierarchyNode(
      id: json['_id'] as String,
      name: json['name'] as String,
      parent: json['parent'] as String?,
      children: (json['children'] as List<dynamic>?)
          ?.map((e) => HierarchyNode.fromJson(e as Map<String, dynamic>))
          .toList(),
      icon: json['icon'] as String?,
    );

Map<String, dynamic> _$HierarchyNodeToJson(HierarchyNode instance) =>
    <String, dynamic>{
      '_id': instance.id,
      'name': instance.name,
      'parent': instance.parent,
      'children': instance.children,
      'icon': instance.icon,
    };
