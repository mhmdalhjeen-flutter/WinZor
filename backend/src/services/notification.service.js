const Notification = require("../models/notification");
const ReferralBatchBuffer = require("../models/referralBatchBuffer");
const { safeLog } = require("../utils/logSanitize.util");
const cache = require("../utils/responseCache.util");

function invalidateNotificationCache(userId) {
  if (!userId) return;
  const uid = String(userId);
  cache.invalidate(`notif:unread:${uid}`);
  cache.invalidate(`notif:list:${uid}:`);
}

const REFERRAL_FLUSH_MS = 2500;
const flushTimers = new Map();

function formatReferralBatchBody(count, totalPoints) {
  if (count === 1) {
    return `تمت إضافة دعوة ناجحة (+${totalPoints} نقطة)`;
  }
  return `تمت إضافة ${count} دعوة ناجحة (+${totalPoints} نقطة)`;
}

async function flushReferralBatch(userId) {
  flushTimers.delete(String(userId));
  try {
    const buf = await ReferralBatchBuffer.findOneAndDelete({ user: userId });
    if (!buf || buf.count < 1) return null;

    const { count, totalPoints } = buf;
    const doc = await Notification.create({
      user: userId,
      type: "referral_batch",
      title: count === 1 ? "دعوة ناجحة!" : "دعوات ناجحة!",
      body: formatReferralBatchBody(count, totalPoints),
      data: { count, totalPoints },
    });
    invalidateNotificationCache(userId);
    return doc;
  } catch (err) {
    safeLog("error", "notification_flush_referral_failed", { message: err.message, userId });
    return null;
  }
}

function scheduleReferralFlush(userId) {
  const key = String(userId);
  if (flushTimers.has(key)) clearTimeout(flushTimers.get(key));
  flushTimers.set(
    key,
    setTimeout(() => {
      flushReferralBatch(userId).catch(() => {});
    }, REFERRAL_FLUSH_MS)
  );
}

/**
 * تجميع مكافأة إحالة واحدة في buffer ثم إشعار موحّد بعد debounce.
 * 100 تسجيل متزامن → إشعار واحد: «تمت إضافة 100 دعوة ناجحة (+300 نقطة)»
 */
async function queueReferralReward({ user, pointsAdded }) {
  if (!user || !pointsAdded) return null;
  try {
    await ReferralBatchBuffer.findOneAndUpdate(
      { user },
      { $inc: { count: 1, totalPoints: pointsAdded } },
      { upsert: true, new: true }
    );
    scheduleReferralFlush(user);
    return true;
  } catch (err) {
    safeLog("error", "notification_queue_referral_failed", { message: err.message, userId: user });
    return null;
  }
}

/**
 * خدمة الإشعارات المركزية (AD-008/AD-009).
 * نقطة واحدة لإنشاء الإشعارات؛ يمكن لاحقاً توسيعها (بريد/واتساب/Push)
 * دون تغيير المستدعين.
 */

// إنشاء إشعار واحد. آمن: لا يرمي استثناءً يُسقط العملية المستدعية.
async function create({ user, type, title, body, data } = {}) {
  if (!user || !title) return null;
  try {
    const doc = await Notification.create({
      user,
      type: type || "general",
      title,
      body: body || "",
      data: data || {},
    });
    invalidateNotificationCache(user);
    return doc;
  } catch (err) {
    safeLog("error", "notification_create_failed", { message: err.message, userId: user, type });
    return null;
  }
}

// إنشاء عدّة إشعارات (مستخدمون متعددون مثلاً).
async function createMany(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const docs = items
    .filter((i) => i && i.user && i.title)
    .map((i) => ({
      user: i.user,
      type: i.type || "general",
      title: i.title,
      body: i.body || "",
      data: i.data || {},
    }));
  if (docs.length === 0) return [];
  try {
    const created = await Notification.insertMany(docs);
    const userIds = [...new Set(docs.map((d) => String(d.user)))];
    userIds.forEach(invalidateNotificationCache);
    return created;
  } catch (err) {
    safeLog("error", "notification_create_many_failed", { message: err.message, count: docs.length });
    return [];
  }
}

module.exports = { create, createMany, queueReferralReward, flushReferralBatch };

// است recovery: إذا توقف السيرفر أثناء التجميع، يُفرّغ buffer القديم
if (process.env.NODE_ENV !== "test") {
  setInterval(async () => {
    try {
      const stale = new Date(Date.now() - 8000);
      const buffers = await ReferralBatchBuffer.find({ updatedAt: { $lt: stale } })
        .select("user")
        .limit(20)
        .lean();
      if (!buffers.length) return;
      await Promise.all(buffers.map((b) => flushReferralBatch(b.user)));
    } catch (err) {
      safeLog("warn", "referral_buffer_sweep_failed", { message: err.message });
    }
  }, 12000);
}
