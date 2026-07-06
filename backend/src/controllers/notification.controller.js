const Notification = require("../models/notification");
const cache = require("../utils/responseCache.util");

// إشعاراتي (اختياري ?unread=true لغير المقروءة فقط).
exports.getMine = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.unread === "true") filter.read = false;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const notifications = await Notification.find(filter)
      .select("type title body data read createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// عدد غير المقروء (لشارة الجرس).
exports.unreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "الإشعار غير موجود" });
    cache.invalidate(`notif:unread:${req.user.id}`);
    cache.invalidate(`notif:list:${req.user.id}:`);
    res.json({ notification: notif });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "معرّف غير صحيح" });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );
    cache.invalidate(`notif:unread:${req.user.id}`);
    cache.invalidate(`notif:list:${req.user.id}:`);
    res.json({ message: "تم تعليم الكل كمقروء" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
