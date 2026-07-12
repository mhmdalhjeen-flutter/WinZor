import { buildCategoryMaps } from './categoryDisplay';

function countStoresInRegions(regions = []) {
  return regions.reduce(
    (sum, region) => sum + (region.parentGroups || []).reduce(
      (gSum, group) => gSum + (group.sections || []).reduce(
        (sSum, section) => sSum + (section.stores?.length || 0),
        0,
      ),
      0,
    ),
    0,
  );
}

function groupMatchesRoot(group, rootId, rootNode, maps) {
  const groupParentId = group.parentCategoryId != null ? String(group.parentCategoryId) : '';
  if (groupParentId && groupParentId === rootId) return true;
  if (rootNode && group.parentCategory === rootNode.name) return true;

  return (group.sections || []).some((section) => {
    if (section.categoryId != null && String(section.categoryId) === rootId) return true;
    if (!maps || !section.categoryName) return false;
    const node = maps.byName.get(section.categoryName);
    return node && String(findRootIdForNode(node, maps)) === rootId;
  });
}

function findRootIdForNode(node, maps) {
  let current = node;
  while (current?.parent || current?.parentId) {
    current = maps.byId.get(String(current.parent || current.parentId));
  }
  return current ? String(current._id) : String(node._id);
}

function sectionMatchesLeaf(section, leafId, maps) {
  if (section.categoryId != null && String(section.categoryId) === leafId) {
    return true;
  }

  if (!maps || !section.categoryName) return false;
  const byName = maps.byName.get(section.categoryName);
  if (byName && String(byName._id) === leafId) return true;

  return false;
}

/**
 * Client-side category filter for /stores/points hierarchical payload.
 *
 * - path length 1: all stores under the selected first-level category
 * - path length 2+: only stores in the exact selected child section (by id)
 */
export function filterPointsProgramRegions(regions = [], categoryPath = [], categoryTree = []) {
  if (!categoryPath?.length) return regions;

  const rootId = String(categoryPath[0]);
  const leafId = String(categoryPath[categoryPath.length - 1]);
  const exactLeaf = categoryPath.length >= 2;

  const maps = categoryTree?.length ? buildCategoryMaps(categoryTree) : null;
  const rootNode = maps?.byId.get(rootId) || null;
  const rootChildren = maps?.childrenByRoot.get(rootId) || rootNode?.children || [];
  const rootHasChildren = rootChildren.length > 0;

  return regions
    .map((regionBlock) => {
      const parentGroups = (regionBlock.parentGroups || [])
        .map((group) => {
          if (!groupMatchesRoot(group, rootId, rootNode, maps)) return null;

          let sections = group.sections || [];

          if (exactLeaf) {
            sections = sections.filter((section) => sectionMatchesLeaf(section, leafId, maps));
          } else if (!rootHasChildren) {
            sections = sections.filter(
              (section) => sectionMatchesLeaf(section, rootId, maps)
                || (section.isParentFallback && groupMatchesRoot(group, rootId, rootNode, maps)),
            );
          }

          if (!sections.length) return null;
          return { ...group, sections };
        })
        .filter(Boolean);

      if (!parentGroups.length) return null;
      return { ...regionBlock, parentGroups };
    })
    .filter(Boolean);
}

export function countPointsProgramStores(regions = []) {
  return countStoresInRegions(regions);
}
