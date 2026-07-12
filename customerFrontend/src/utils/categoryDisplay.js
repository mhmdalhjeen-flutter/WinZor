const MISC_SECTION_NAMES = new Set(['عروض متنوعة', 'أخرى']);

export function isMiscSectionName(name) {
  return MISC_SECTION_NAMES.has(String(name || '').trim());
}

export function isMiscReel(reel) {
  if (!reel) return false;
  if (isMiscSectionName(reel.categoryName)) return true;
  return reel.categoryId == null && isMiscSectionName(reel.categoryName);
}

function getSectionKey(section) {
  if (section.isParentFallback) {
    return `fallback:${section.parentCategoryId || section.categoryId || section.categoryName}`;
  }
  return String(section.categoryId || section.categoryName);
}

export function flattenCategories(tree, parentId = null) {
  const out = [];
  for (const node of tree || []) {
    out.push({
      ...node,
      parentId: node.parent ?? parentId ?? null,
    });
    if (node.children?.length) {
      out.push(...flattenCategories(node.children, node._id));
    }
  }
  return out;
}

export function buildCategoryMaps(categoryTree) {
  const flat = flattenCategories(categoryTree);
  const byId = new Map(flat.map((node) => [String(node._id), node]));
  const byName = new Map();
  flat.forEach((node) => byName.set(node.name, node));

  const roots = flat.filter((node) => !node.parent && !node.parentId);
  const childrenByRoot = new Map();
  roots.forEach((root) => {
    childrenByRoot.set(
      String(root._id),
      flat.filter((node) => String(node.parent || node.parentId || '') === String(root._id))
    );
  });

  return { flat, byId, byName, roots, childrenByRoot };
}

function findRootId(categoryId, byId) {
  let node = byId.get(String(categoryId));
  while (node?.parent || node?.parentId) {
    node = byId.get(String(node.parent || node.parentId));
  }
  return node ? String(node._id) : null;
}

function findDirectChildOfRoot(categoryId, rootId, byId) {
  let node = byId.get(String(categoryId));
  if (!node) return null;
  if (String(node._id) === String(rootId)) return String(rootId);

  let current = node;
  while (current) {
    if (String(current.parent || current.parentId || '') === String(rootId)) {
      return String(current._id);
    }
    if (!current.parent && !current.parentId) break;
    current = byId.get(String(current.parent || current.parentId));
  }
  return String(node._id);
}

export function resolveStoreCategoryNode(store, maps) {
  const { byId, byName } = maps;
  if (store?.categoryId && byId.has(String(store.categoryId))) {
    return byId.get(String(store.categoryId));
  }

  const catStr = String(store?.category || '').trim();
  if (!catStr) return null;
  if (byName.has(catStr)) return byName.get(catStr);

  if (catStr.includes(' › ')) {
    const parts = catStr.split(' › ').map((part) => part.trim()).filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      if (byName.has(parts[i])) return byName.get(parts[i]);
    }
  }

  return null;
}

export function resolveDisplaySection(store, maps) {
  const node = resolveStoreCategoryNode(store, maps);
  if (!node) {
    const raw = String(store?.category || '').trim();
    const name = raw.includes(' › ') ? raw.split(' › ')[0].trim() : raw;
    if (!name || isMiscSectionName(name)) return null;
    return {
      categoryId: null,
      categoryName: name,
      categoryIcon: '',
      parentCategoryId: null,
      parentCategoryName: null,
      isParentFallback: true,
    };
  }

  const { byId, childrenByRoot } = maps;
  const rootId = findRootId(node._id, byId);
  const root = byId.get(rootId);
  if (!root) return null;

  const children = childrenByRoot.get(rootId) || [];
  const hasChildren = children.length > 0;

  if (!hasChildren) {
    return {
      categoryId: root._id,
      categoryName: root.name,
      categoryIcon: root.icon || '',
      parentCategoryId: null,
      parentCategoryName: null,
      isParentFallback: false,
    };
  }

  if (String(node._id) === rootId) {
    return {
      categoryId: root._id,
      categoryName: root.name,
      categoryIcon: root.icon || '',
      parentCategoryId: root._id,
      parentCategoryName: root.name,
      isParentFallback: true,
    };
  }

  const displayId = findDirectChildOfRoot(node._id, rootId, byId);
  const child = byId.get(displayId) || node;
  return {
    categoryId: child._id,
    categoryName: child.name,
    categoryIcon: child.icon || root.icon || '',
    parentCategoryId: root._id,
    parentCategoryName: root.name,
    isParentFallback: false,
  };
}

function orderSections(sectionList, maps) {
  const { roots, childrenByRoot } = maps;
  const byKey = new Map(sectionList.map((section) => [getSectionKey(section), section]));
  const ordered = [];
  const used = new Set();

  roots.forEach((root) => {
    const children = childrenByRoot.get(String(root._id)) || [];

    if (!children.length) {
      const section = byKey.get(String(root._id));
      if (section && !used.has(getSectionKey(section))) {
        ordered.push(section);
        used.add(getSectionKey(section));
      }
      return;
    }

    children.forEach((child) => {
      const section = byKey.get(String(child._id));
      if (section && !used.has(getSectionKey(section))) {
        ordered.push(section);
        used.add(getSectionKey(section));
      }
    });

    const fallback = sectionList.find(
      (section) => section.isParentFallback && String(section.parentCategoryId) === String(root._id)
    );
    if (fallback && !used.has(getSectionKey(fallback))) {
      ordered.push(fallback);
      used.add(getSectionKey(fallback));
    }
  });

  sectionList.forEach((section) => {
    const key = getSectionKey(section);
    if (!used.has(key)) ordered.push(section);
  });

  return ordered;
}

function dedupeItems(items, idKey = '_id') {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item[idKey]);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function normalizeCategoryReels(reels, categoryTree) {
  const sourceReels = (reels || []).filter((reel) => !isMiscReel(reel));
  if (!categoryTree?.length) return sourceReels;

  const maps = buildCategoryMaps(categoryTree);
  const allOffers = dedupeItems(
    sourceReels.flatMap((reel) => reel.offers || [])
      .concat((reels || []).filter(isMiscReel).flatMap((reel) => reel.offers || []))
  );
  const allProducts = dedupeItems(
    sourceReels.flatMap((reel) => reel.products || [])
      .concat((reels || []).filter(isMiscReel).flatMap((reel) => reel.products || []))
  );

  const sectionMap = new Map();

  const ensureSection = (section) => {
    const key = getSectionKey(section);
    if (!sectionMap.has(key)) {
      sectionMap.set(key, {
        ...section,
        offers: [],
        products: [],
      });
    }
    return sectionMap.get(key);
  };

  allOffers.forEach((offer) => {
    const section = resolveDisplaySection(offer.store, maps);
    if (!section || isMiscSectionName(section.categoryName)) return;
    ensureSection(section).offers.push(offer);
  });

  allProducts.forEach((product) => {
    const section = resolveDisplaySection(product.store, maps);
    if (!section || isMiscSectionName(section.categoryName)) return;
    ensureSection(section).products.push(product);
  });

  return orderSections([...sectionMap.values()], maps)
    .filter((section) => section.offers.length || section.products.length);
}

export function normalizeStoreParentGroups(parentGroups, categoryTree) {
  const allStores = dedupeItems(
    (parentGroups || []).flatMap((group) =>
      (group.sections || []).flatMap((section) => section.stores || []))
  );

  if (!categoryTree?.length) {
    return (parentGroups || [])
      .map((group) => ({
        ...group,
        sections: (group.sections || []).filter((section) => !isMiscSectionName(section.category)),
      }))
      .filter((group) => group.sections.some((section) => section.stores?.length));
  }

  const maps = buildCategoryMaps(categoryTree);
  const parentMap = new Map();

  allStores.forEach((store) => {
    const section = resolveDisplaySection(store, maps);
    if (!section || isMiscSectionName(section.categoryName)) return;

    const parentKey = String(section.parentCategoryId || section.categoryId || section.categoryName);
    const parentName = section.parentCategoryName || section.categoryName;

    if (!parentMap.has(parentKey)) {
      parentMap.set(parentKey, {
        parentCategoryId: section.parentCategoryId || section.categoryId,
        parentCategory: parentName,
        sectionsMap: new Map(),
      });
    }

    const group = parentMap.get(parentKey);
    const sectionKey = getSectionKey(section);
    if (!group.sectionsMap.has(sectionKey)) {
      group.sectionsMap.set(sectionKey, {
        categoryId: section.categoryId,
        category: section.categoryName,
        isParentFallback: section.isParentFallback,
        stores: [],
      });
    }
    group.sectionsMap.get(sectionKey).stores.push(store);
  });

  const result = [];
  const { roots, childrenByRoot } = maps;

  roots.forEach((root) => {
    const children = childrenByRoot.get(String(root._id)) || [];
    const group = parentMap.get(String(root._id));

    if (!children.length) {
      if (!group) return;
      const sections = [...group.sectionsMap.values()].filter((section) => section.stores.length);
      if (sections.length) {
        result.push({
          parentCategoryId: group.parentCategoryId,
          parentCategory: group.parentCategory,
          sections,
        });
      }
      return;
    }

    if (!group) return;

    const sections = [];
    children.forEach((child) => {
      const section = group.sectionsMap.get(String(child._id));
      if (section?.stores?.length) sections.push(section);
    });

    const fallback = group.sectionsMap.get(`fallback:${root._id}`);
    if (fallback?.stores?.length) sections.push(fallback);

    if (sections.length) {
      result.push({
        parentCategoryId: group.parentCategoryId,
        parentCategory: group.parentCategory,
        sections,
      });
    }
  });

  parentMap.forEach((group, key) => {
    if (result.some((entry) => String(entry.parentCategoryId || entry.parentCategory) === key)) return;
    const sections = [...group.sectionsMap.values()].filter((section) => section.stores.length);
    if (sections.length) {
      result.push({
        parentCategoryId: group.parentCategoryId,
        parentCategory: group.parentCategory,
        sections,
      });
    }
  });

  return result;
}
