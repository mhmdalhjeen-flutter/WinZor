import '../models/hierarchy_node.dart';

class HierarchyRow {
  final List<HierarchyNode> items;
  final String? selectedId;
  final int level;

  HierarchyRow({
    required this.items,
    this.selectedId,
    required this.level,
  });
}

class HierarchyUtils {
  static List<HierarchyRow> buildHierarchyRows(List<HierarchyNode> tree, List<String> pathIds) {
    List<HierarchyRow> rows = [
      HierarchyRow(items: tree, selectedId: pathIds.isNotEmpty ? pathIds[0] : null, level: 0)
    ];
    
    List<HierarchyNode> current = tree;

    for (int i = 0; i < pathIds.length; i++) {
      final node = current.where((c) => c.id == pathIds[i]).firstOrNull;
      if (node == null || node.children == null || node.children!.isEmpty) break;
      
      current = node.children!;
      rows.add(HierarchyRow(
        items: current,
        selectedId: pathIds.length > i + 1 ? pathIds[i + 1] : null,
        level: i + 1,
      ));
    }

    return rows;
  }

  static List<String> setHierarchyPath(List<String> pathIds, int level, String? nodeId) {
    if (nodeId == null || nodeId.isEmpty) {
      return pathIds.sublist(0, level);
    }
    return [...pathIds.sublist(0, level), nodeId];
  }

  static List<String> pathToLabels(List<HierarchyNode> tree, List<String> pathIds) {
    return pathIds
        .map((id) => findTreeNode(tree, id)?.name)
        .whereType<String>()
        .toList();
  }

  static HierarchyNode? findTreeNode(List<HierarchyNode>? nodes, String id) {
    if (nodes == null) return null;
    for (final node in nodes) {
      if (node.id == id) return node;
      final found = findTreeNode(node.children, id);
      if (found != null) return found;
    }
    return null;
  }
}
