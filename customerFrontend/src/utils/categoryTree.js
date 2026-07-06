import { findTreeNode, getEffectivePathId, pathStillValid } from './hierarchyTree';

/** تسطيح الشجرة مع عمق كل عقدة */
export function flattenCategoryTree(nodes, depth = 0) {  const out = [];
  for (const node of nodes || []) {
    out.push({ ...node, depth });
    if (node.children?.length) {
      out.push(...flattenCategoryTree(node.children, depth + 1));
    }
  }
  return out;
}

export function getEffectiveCategoryId(pathIds) {  return getEffectivePathId(pathIds);
}

export { findTreeNode as findCategoryNode, pathStillValid };

/** صفوف الفلتر: جذر + صف لكل مستوى فرعي مفتوح */
export function buildCategoryFilterRows(tree, pathIds = []) {
  const rows = [{ items: tree || [], selectedId: pathIds[0] || null, level: 0 }];
  let current = tree || [];

  for (let i = 0; i < pathIds.length; i += 1) {
    const node = current.find((c) => String(c._id) === String(pathIds[i]));
    if (!node?.children?.length) break;
    current = node.children;
    rows.push({
      items: current,
      selectedId: pathIds[i + 1] || null,
      level: i + 1,
    });
  }

  return rows;
}

export function toggleCategoryPath(pathIds, level, categoryId) {
  if (!categoryId) return [];
  const current = pathIds[level];
  if (current && String(current) === String(categoryId)) {
    return pathIds.slice(0, level);
  }
  return [...pathIds.slice(0, level), categoryId];
}
