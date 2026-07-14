import 'package:json_annotation/json_annotation.dart';

part 'hierarchy_node.g.dart';

@JsonSerializable()
class HierarchyNode {
  @JsonKey(name: '_id')
  final String id;
  final String name;
  final String? parent;
  final List<HierarchyNode>? children;
  final String? icon;

  HierarchyNode({
    required this.id,
    required this.name,
    this.parent,
    this.children,
    this.icon,
  });

  factory HierarchyNode.fromJson(Map<String, dynamic> json) => _$HierarchyNodeFromJson(json);
  Map<String, dynamic> toJson() => _$HierarchyNodeToJson(this);
}
