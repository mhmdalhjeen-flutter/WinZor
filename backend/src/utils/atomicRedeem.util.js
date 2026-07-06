const mongoose = require("mongoose");
const PromoCode = require("../models/promoCode");
const AdminCode = require("../models/AdminCode");
const ActivationCode = require("../models/ActivationCode");

function toObjectId(userId) {
  return new mongoose.Types.ObjectId(userId);
}

/** Atomic push to usedBy + increment currentUses + deactivate at maxUses */
function usageUpdatePipeline(userId) {
  const uid = toObjectId(userId);
  const usedAt = new Date();
  return [
    {
      $set: {
        usedBy: {
          $concatArrays: [
            { $ifNull: ["$usedBy", []] },
            [{ user: uid, usedAt }],
          ],
        },
        currentUses: { $add: ["$currentUses", 1] },
        isActive: {
          $cond: {
            if: { $gte: [{ $add: ["$currentUses", 1] }, "$maxUses"] },
            then: false,
            else: "$isActive",
          },
        },
      },
    },
  ];
}

function promoRedeemFilter(code, userId) {
  return {
    code,
    isActive: true,
    isRegistrationCode: { $ne: true },
    store: { $exists: true, $ne: null },
    "usedBy.user": { $ne: toObjectId(userId) },
    $expr: { $lt: ["$currentUses", "$maxUses"] },
  };
}

function registrationPromoFilter(code, userId) {
  return {
    code,
    isRegistrationCode: true,
    isActive: true,
    "usedBy.user": { $ne: toObjectId(userId) },
    $expr: { $lt: ["$currentUses", "$maxUses"] },
  };
}

function adminCodeFilter(code, userId) {
  return {
    code,
    isActive: true,
    "usedBy.user": { $ne: toObjectId(userId) },
    $expr: { $lt: ["$currentUses", "$maxUses"] },
  };
}

function activationCodeFilter(code) {
  const now = new Date();
  return {
    code,
    isUsed: false,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
  };
}

function rollbackUsagePipeline(userId) {
  const uid = toObjectId(userId);
  return [
    {
      $set: {
        usedBy: {
          $filter: {
            input: { $ifNull: ["$usedBy", []] },
            cond: { $ne: ["$$this.user", uid] },
          },
        },
        currentUses: { $max: [0, { $subtract: ["$currentUses", 1] }] },
        isActive: {
          $cond: {
            if: {
              $lt: [
                { $max: [0, { $subtract: ["$currentUses", 1] }] },
                "$maxUses",
              ],
            },
            then: true,
            else: "$isActive",
          },
        },
      },
    },
  ];
}

function claimUpdateOptions(session) {
  const opts = { new: true };
  if (session) opts.session = session;
  return opts;
}

/** Returns claimed promo doc or null if already used / exhausted / inactive */
async function atomicClaimPromo(code, userId, session) {
  return PromoCode.findOneAndUpdate(
    promoRedeemFilter(code, userId),
    usageUpdatePipeline(userId),
    claimUpdateOptions(session)
  );
}

async function atomicClaimRegistrationPromo(code, userId, session) {
  return PromoCode.findOneAndUpdate(
    registrationPromoFilter(code, userId),
    usageUpdatePipeline(userId),
    claimUpdateOptions(session)
  );
}

async function atomicClaimAdminCode(code, userId, session) {
  return AdminCode.findOneAndUpdate(
    adminCodeFilter(code, userId),
    usageUpdatePipeline(userId),
    claimUpdateOptions(session)
  );
}

async function rollbackPromoClaim(code, userId, session) {
  return PromoCode.findOneAndUpdate(
    { code, "usedBy.user": toObjectId(userId) },
    rollbackUsagePipeline(userId),
    claimUpdateOptions(session)
  );
}

async function rollbackRegistrationPromoClaim(code, userId, session) {
  return rollbackPromoClaim(code, userId, session);
}

async function rollbackAdminCodeClaim(code, userId, session) {
  return AdminCode.findOneAndUpdate(
    { code, "usedBy.user": toObjectId(userId) },
    rollbackUsagePipeline(userId),
    claimUpdateOptions(session)
  );
}

/** Returns pre-update doc (includes role) or null */
async function atomicClaimActivationCode(code, userId) {
  return ActivationCode.findOneAndUpdate(
    activationCodeFilter(code),
    { $set: { isUsed: true, usedBy: toObjectId(userId) } },
    { new: false }
  );
}

module.exports = {
  atomicClaimPromo,
  atomicClaimRegistrationPromo,
  atomicClaimAdminCode,
  atomicClaimActivationCode,
  rollbackPromoClaim,
  rollbackRegistrationPromoClaim,
  rollbackAdminCodeClaim,
  promoRedeemFilter,
  adminCodeFilter,
};
