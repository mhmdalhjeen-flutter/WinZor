import '../../../core/models/hierarchy_node.dart';
import '../../../core/utils/hierarchy_utils.dart';

class _CategoryMaps {
  final Map<String, HierarchyNode> byId;
  final Map<String, HierarchyNode> byName;
  final Map<String, List<HierarchyNode>> childrenByRoot;

  _CategoryMaps({
    required this.byId,
    required this.byName,
    required this.childrenByRoot,
  });
}

_CategoryMaps _buildCategoryMaps(List<HierarchyNode> tree) {
  final byId = <String, HierarchyNode>{};
  final byName = <String, HierarchyNode>{};
  final roots = <HierarchyNode>[];

  void walk(List<HierarchyNode>? nodes) {
    if (nodes == null) return;
    for (final node in nodes) {
      byId[node.id] = node;
      byName[node.name] = node;
      walk(node.children);
    }
  }

  walk(tree);
  for (final node in tree) {
    if (node.parent == null || node.parent!.isEmpty) roots.add(node);
  }

  final childrenByRoot = <String, List<HierarchyNode>>{};
  for (final root in roots) {
    childrenByRoot[root.id] = byId.values
        .where((n) => n.parent == root.id)
        .toList();
  }

  return _CategoryMaps(
    byId: byId,
    byName: byName,
    childrenByRoot: childrenByRoot,
  );
}

String _findRootIdForNode(HierarchyNode node, _CategoryMaps maps) {
  var current = node;
  while (current.parent != null && current.parent!.isNotEmpty) {
    final parent = maps.byId[current.parent];
    if (parent == null) break;
    current = parent;
  }
  return current.id;
}

bool _groupMatchesRoot(
  Map<String, dynamic> group,
  String rootId,
  HierarchyNode? rootNode,
  _CategoryMaps? maps,
) {
  final groupParentId = group['parentCategoryId']?.toString() ?? '';
  if (groupParentId.isNotEmpty && groupParentId == rootId) return true;
  if (rootNode != null && group['parentCategory'] == rootNode.name) {
    return true;
  }

  final sections = group['sections'];
  if (sections is! List) return false;

  return sections.any((section) {
    if (section is! Map) return false;
    if (section['categoryId'] != null &&
        section['categoryId'].toString() == rootId) {
      return true;
    }
    if (maps == null) return false;
    final name = section['categoryName']?.toString();
    if (name == null) return false;
    final node = maps.byName[name];
    return node != null && _findRootIdForNode(node, maps) == rootId;
  });
}

bool _sectionMatchesLeaf(
  Map<String, dynamic> section,
  String leafId,
  _CategoryMaps? maps,
) {
  if (section['categoryId'] != null &&
      section['categoryId'].toString() == leafId) {
    return true;
  }
  if (maps == null) return false;
  final name = section['categoryName']?.toString();
  if (name == null) return false;
  final byName = maps.byName[name];
  return byName != null && byName.id == leafId;
}

/// Mirrors React `pointsProgramFilters.js`.
List<Map<String, dynamic>> filterPointsProgramRegions(
  List<dynamic> regions,
  List<String> categoryPath,
  List<HierarchyNode> categoryTree,
) {
  if (categoryPath.isEmpty) {
    return regions
        .whereType<Map>()
        .map((e) => Map<String, dynamic>.from(e))
        .toList();
  }

  final rootId = categoryPath.first;
  final leafId = categoryPath.last;
  final exactLeaf = categoryPath.length >= 2;
  final maps = categoryTree.isNotEmpty ? _buildCategoryMaps(categoryTree) : null;
  final rootNode = maps?.byId[rootId];
  final rootChildren = maps?.childrenByRoot[rootId] ?? rootNode?.children ?? [];
  final rootHasChildren = rootChildren.isNotEmpty;

  final result = <Map<String, dynamic>>[];

  for (final regionRaw in regions) {
    if (regionRaw is! Map) continue;
    final regionBlock = Map<String, dynamic>.from(regionRaw);
    final parentGroupsRaw = regionBlock['parentGroups'];
    if (parentGroupsRaw is! List) continue;

    final parentGroups = <Map<String, dynamic>>[];
    for (final groupRaw in parentGroupsRaw) {
      if (groupRaw is! Map) continue;
      final group = Map<String, dynamic>.from(groupRaw);
      if (!_groupMatchesRoot(group, rootId, rootNode, maps)) continue;

      var sections = (group['sections'] is List)
          ? (group['sections'] as List)
              .whereType<Map>()
              .map((e) => Map<String, dynamic>.from(e))
              .toList()
          : <Map<String, dynamic>>[];

      if (exactLeaf) {
        sections = sections
            .where((s) => _sectionMatchesLeaf(s, leafId, maps))
            .toList();
      } else if (!rootHasChildren) {
        sections = sections.where((section) {
          return _sectionMatchesLeaf(section, rootId, maps) ||
              (section['isParentFallback'] == true &&
                  _groupMatchesRoot(group, rootId, rootNode, maps));
        }).toList();
      }

      if (sections.isEmpty) continue;
      parentGroups.add({...group, 'sections': sections});
    }

    if (parentGroups.isEmpty) continue;
    result.add({...regionBlock, 'parentGroups': parentGroups});
  }

  return result;
}

int countPointsProgramStores(List<Map<String, dynamic>> regions) {
  var sum = 0;
  for (final region in regions) {
    final groups = region['parentGroups'];
    if (groups is! List) continue;
    for (final group in groups) {
      if (group is! Map) continue;
      final sections = group['sections'];
      if (sections is! List) continue;
      for (final section in sections) {
        if (section is! Map) continue;
        final stores = section['stores'];
        if (stores is List) sum += stores.length;
      }
    }
  }
  return sum;
}

String? effectiveHierarchyId(List<String> path) =>
    path.isNotEmpty ? path.last : null;

bool hierarchyPathStillValid(List<HierarchyNode> tree, List<String> path) {
  if (path.isEmpty) return true;
  List<HierarchyNode>? current = tree;
  for (final id in path) {
    final node = HierarchyUtils.findTreeNode(current, id);
    if (node == null) return false;
    current = node.children;
  }
  return true;
}
