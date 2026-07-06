/** صفوف الفلتر: جذر + صف لكل مستوى فرعي مفتوح */
export function buildRegionFilterRows(tree, pathIds = []) {
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

export function toggleRegionPath(pathIds, level, regionId) {
  if (!regionId) return [];
  const current = pathIds[level];
  if (current && String(current) === String(regionId)) {
    return pathIds.slice(0, level);
  }
  return [...pathIds.slice(0, level), regionId];
}

export function getEffectiveRegionId(pathIds) {
  if (!pathIds?.length) return '';
  return String(pathIds[pathIds.length - 1]);
}

/** regionId = المستوى الأول، subRegionId = أعمق اختيار (إن وُجد) */
export function regionPathToListingIds(pathIds) {
  if (!pathIds?.length) return { regionId: '', subRegionId: '' };
  const regionId = String(pathIds[0]);
  const subRegionId = pathIds.length > 1 ? String(pathIds[pathIds.length - 1]) : '';
  return { regionId, subRegionId };
}

export function findRegionNode(nodes, id) {
  if (!id) return null;
  for (const node of nodes || []) {
    if (String(node._id) === String(id)) return node;
    const found = findRegionNode(node.children, id);
    if (found) return found;
  }
  return null;
}

export function pathFromRegionIds(regionId, subRegionId, tree) {
  if (!regionId) return [];
  if (!subRegionId || String(regionId) === String(subRegionId)) {
    return [String(regionId)];
  }

  const findPath = (nodes, targetId, acc = []) => {
    for (const n of nodes || []) {
      const next = [...acc, String(n._id)];
      if (String(n._id) === String(targetId)) return next;
      const child = findPath(n.children, targetId, next);
      if (child) return child;
    }
    return null;
  };

  const path = findPath(tree, subRegionId);
  if (path && String(path[0]) === String(regionId)) return path;
  return [String(regionId), String(subRegionId)];
}

export function pathStillValid(tree, pathIds) {
  if (!pathIds?.length) return true;
  let current = tree || [];
  for (let i = 0; i < pathIds.length; i += 1) {
    const node = current.find((c) => String(c._id) === String(pathIds[i]));
    if (!node) return false;
    current = node.children || [];
  }
  return true;
}

export function collectDescendantIdsFromTree(tree, regionId) {
  if (!regionId) return [];
  const node = findRegionNode(tree, regionId);
  if (!node) return [String(regionId)];
  const ids = [String(regionId)];
  const walk = (n) => {
    for (const child of n.children || []) {
      ids.push(String(child._id));
      walk(child);
    }
  };
  walk(node);
  return ids;
}

export function listingMatchesRegionFilter(listing, regionId, tree) {
  if (!regionId) return true;
  const allowed = collectDescendantIdsFromTree(tree, regionId);
  const regionIds = [
    listing.regionId?._id || listing.regionId,
    listing.subRegionId?._id || listing.subRegionId,
  ].filter(Boolean).map(String);
  return regionIds.some((id) => allowed.includes(id));
}

export function listingMatchesProductQuery(listing, query) {
  if (!query?.trim()) return true;
  const q = query.trim().toLowerCase();
  if (listing.title?.toLowerCase().includes(q)) return true;
  return (listing.keywords || []).some((k) => String(k).toLowerCase().includes(q));
}
