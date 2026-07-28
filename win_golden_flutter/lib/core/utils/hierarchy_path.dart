import '../models/hierarchy_node.dart';

List<String> resolveHierarchyLabels(
  List<HierarchyNode> tree,
  List<String> pathIds,
) {
  final labels = <String>[];
  var nodes = tree;
  for (final id in pathIds) {
    HierarchyNode? match;
    for (final node in nodes) {
      if (node.id == id) {
        match = node;
        break;
      }
    }
    if (match == null) break;
    labels.add(match.name);
    nodes = match.children ?? [];
  }
  return labels;
}

String joinFilterLabels(List<String> labels) => labels.join(' • ');
