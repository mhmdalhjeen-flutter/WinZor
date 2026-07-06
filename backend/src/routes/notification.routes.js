const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const c = require("../controllers/notification.controller");
const {
  notificationsListCache,
  notificationsUnreadCache,
} = require("../middleware/responseCache.middleware");

router.use(authMiddleware);

router.get("/", notificationsListCache, c.getMine);
router.get("/unread-count", notificationsUnreadCache, c.unreadCount);
router.patch("/read-all", c.markAllRead);
router.patch("/:id/read", c.markRead);

module.exports = router;
