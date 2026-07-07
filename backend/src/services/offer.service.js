const Offer = require("../models/offer");
const Store = require("../models/store");
const User = require("../models/user");
const pricingService = require("./pricing.service");
const { getCategoryAndDescendantNames, resolveCategoryNamesForSearch } = require("../controllers/category.controller");
const { restrictOfferQueryToCustomerStores } = require("../utils/storeFilter");
const { resolveNetworkStoreIds } = require("../utils/offerFeed.util");
const { buildUserSignals, sortOffersPersonalized, sortOffersByRank } = require("../utils/personalizedRank.util");
const { getDescendantIds } = require("../utils/region.util");

const LIST_OFFER_SELECT =
  "title description offerType originalPrice value finalPrice currency isActive priority views createdAt expiresAt image bogoGetQuantity bogoBuyQuantity freeItemName customLabel store";

function isDataUrl(value) {
  return typeof value === "string" && value.startsWith("data:");
}

/** قوائم العروض لا ترسل base64 — يبطّئ الشبكة وواجهة المتصفح */
function stripHeavyFields(offer) {
  if (!offer || typeof offer !== "object") return offer;
  const o = { ...offer };
  if (isDataUrl(o.image)) {
    o.hasImage = true;
    o.image = null;
  } else {
    o.hasImage = !!o.image;
  }
  if (o.store && typeof o.store === "object") {
    o.store = { ...o.store };
    if (isDataUrl(o.store.logo)) o.store.logo = null;
  }
  return o;
}

function attachPricing(offer) {
  return pricingService.attachPricingToOffer(offer);
}

function attachPricingList(offers, { forList = false } = {}) {
  return (offers || []).map((o) => {
    const priced = attachPricing(o);
    return forList ? stripHeavyFields(priced) : priced;
  });
}

async function applyRegionToStoreQuery(storeQuery, regionParam) {
  if (!regionParam) return;
  const ids = await getDescendantIds(regionParam);
  if (ids.length) {
    storeQuery.$or = [
      { regionId: { $in: ids } },
      { subRegionId: { $in: ids } },
      { region: regionParam },
    ];
  }
}

async function applySearchToOfferQuery(offerQuery, q) {
  if (!q || !q.trim()) return;
  const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = new RegExp(safe, "i");
  const categoryNames = await resolveCategoryNamesForSearch(q);
  const storeOr = [{ name: rx }, { category: rx }];
  if (categoryNames.length) {
    storeOr.push({ category: { $in: categoryNames } });
  }
  const matchStores = await Store.find({ $or: storeOr }).select("_id");
  offerQuery.$or = [{ title: rx }, { store: { $in: matchStores.map((s) => s._id) } }];
}

async function buildPublicOfferQuery(query) {
  const { category, region, subRegion } = query;
  const offerQuery = { isActive: true };
  const storeQuery = {};

  if (category) {
    const names = await getCategoryAndDescendantNames(category);
    storeQuery.category = { $in: names.length ? names : ["__none__"] };
  }
  if (region) await applyRegionToStoreQuery(storeQuery, region);
  if (subRegion) await applyRegionToStoreQuery(storeQuery, subRegion);

  if (Object.keys(storeQuery).length > 0) {
    const stores = await Store.find(storeQuery).select("_id");
    offerQuery.store = { $in: stores.map((s) => s._id) };
  }

  await restrictOfferQueryToCustomerStores(offerQuery);
  return offerQuery;
}

async function rankOffers(offers, userId, { forList = true } = {}) {
  const plain = offers.map((o) => (o.toObject ? o.toObject() : o));
  const signals = userId ? await buildUserSignals(userId) : null;
  const ranked = signals
    ? sortOffersPersonalized(plain, signals)
    : sortOffersByRank(plain);
  return attachPricingList(ranked, { forList });
}

async function listActiveOffers(query, userId) {
  const offerQuery = await buildPublicOfferQuery(query);
  const offers = await Offer.find(offerQuery)
    .select(LIST_OFFER_SELECT)
    .populate(
      "store",
      "name logo region subRegion category ratingAvg ratingCount regionId subRegionId"
    )
    .limit(200)
    .lean();
  return rankOffers(offers, userId);
}

async function listOfferFeed(query, userId) {
  const { q, category, region, subRegion, cursor } = query;
  const limit = Math.min(parseInt(query.limit, 10) || 12, 50);

  const offerQuery = { isActive: true };
  const storeQuery = {};
  if (category) {
    const names = await getCategoryAndDescendantNames(category);
    storeQuery.category = { $in: names.length ? names : ["__none__"] };
  }
  const regionFilter = subRegion || region;
  if (regionFilter) await applyRegionToStoreQuery(storeQuery, regionFilter);
  if (Object.keys(storeQuery).length > 0) {
    const stores = await Store.find(storeQuery).select("_id");
    offerQuery.store = { $in: stores.map((s) => s._id) };
  }

  await restrictOfferQueryToCustomerStores(offerQuery);
  await applySearchToOfferQuery(offerQuery, q);

  const fetchLimit = Math.min(limit * 4, 200);
  const docs = await Offer.find(offerQuery)
    .select(LIST_OFFER_SELECT)
    .populate(
      "store",
      "name logo region subRegion category ratingAvg ratingCount regionId subRegionId"
    )
    .limit(fetchLimit)
    .lean();

  const ranked = await rankOffers(docs, userId);

  let page = ranked;
  if (cursor) {
    const idx = ranked.findIndex((o) => String(o._id) === String(cursor));
    page = idx >= 0 ? ranked.slice(idx + 1) : ranked;
  }

  const items = page.slice(0, limit);
  const nextCursor = page.length > limit ? items[items.length - 1]?._id || null : null;

  return { items, nextCursor };
}

async function getOfferById(offerId, { incrementViews = true } = {}) {
  const offer = await Offer.findById(offerId).populate(
    "store",
    "name phone whatsapp region subRegion logo category owner"
  );

  if (!offer) {
    const err = new Error("العرض غير موجود");
    err.status = 404;
    throw err;
  }
  if (!offer.isActive) {
    const err = new Error("هذا العرض غير متاح حالياً");
    err.status = 404;
    throw err;
  }

  if (incrementViews) {
    await Offer.findByIdAndUpdate(offer._id, { $inc: { views: 1 } });
    offer.views = (offer.views || 0) + 1;
  }

  return attachPricing(offer);
}

async function getMyOffers(ownerId, query = {}) {
  const store = await Store.findOne({ owner: ownerId });
  if (!store) {
    const err = new Error("لا يوجد متجر مرتبط بحسابك");
    err.status = 404;
    throw err;
  }

  const filter = { store: store._id };
  if (query.all !== "true") filter.isActive = true;

  const limit = Math.min(parseInt(query.limit, 10) || 0, 50) || undefined;
  let dbQuery = Offer.find(filter).sort({ priority: -1, createdAt: -1 });
  if (limit) dbQuery = dbQuery.limit(limit);

  const offers = await dbQuery.select(LIST_OFFER_SELECT).lean();
  return attachPricingList(offers, { forList: false });
}

async function getDashboardOffers(user, query = {}) {
  const ownLimit = Math.min(parseInt(query.ownLimit, 10) || 3, 20);
  const networkLimit = Math.min(parseInt(query.networkLimit, 10) || 3, 20);

  const [dbUser, myStore] = await Promise.all([
    User.findById(user.id),
    Store.findOne({ owner: user.id }),
  ]);

  if (!dbUser) {
    const err = new Error("المستخدم غير موجود");
    err.status = 404;
    throw err;
  }

  let ownOffers = [];
  if (myStore) {
    ownOffers = await Offer.find({ store: myStore._id, isActive: true })
      .select(LIST_OFFER_SELECT)
      .sort({ priority: -1, createdAt: -1 })
      .limit(ownLimit)
      .lean();
  }

  const networkStoreIds = await resolveNetworkStoreIds(dbUser, myStore?._id);
  let networkOffers = [];

  if (networkStoreIds.length) {
    networkOffers = await Offer.find({
      store: { $in: networkStoreIds },
      isActive: true,
    })
      .select(LIST_OFFER_SELECT)
      .populate("store", "name logo category region subRegion")
      .sort({ priority: -1, createdAt: -1 })
      .limit(networkLimit)
      .lean();
  }

  return {
    ownOffers: attachPricingList(ownOffers, { forList: false }),
    networkOffers: attachPricingList(networkOffers, { forList: true }),
    myStoreId: myStore?._id || null,
  };
}

function previewPricing(body) {
  const { offerType, originalPrice, value, finalPrice } = body || {};
  const computed = pricingService.computeOfferFinalPrice({
    offerType,
    originalPrice,
    value,
    finalPrice,
  });

  if (computed == null) {
    return {
      valid: false,
      pricing: null,
      message: "تعذّر حساب السعر — تحقق من حقول نوع العرض",
    };
  }

  const previewOffer = {
    offerType,
    originalPrice,
    value,
    finalPrice: computed,
    currency: "ILS",
  };

  return {
    valid: true,
    pricing: pricingService.buildOfferPricingDTO(previewOffer),
  };
}

module.exports = {
  attachPricing,
  attachPricingList,
  listActiveOffers,
  listOfferFeed,
  getOfferById,
  getMyOffers,
  getDashboardOffers,
  previewPricing,
};
