const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const optionalAuth = require("../middleware/optionalAuth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const Offer = require("../models/offer");
const { requireOwnedStoreResource } = require("../middleware/ownership.middleware");
const offerService = require("../services/offer.service");
const {
  createOffer,
  deleteOffer,
  updateOffer,
  renewOffer,
} = require("../controllers/offer.controller");

router.get("/", optionalAuth, async (req, res) => {
  try {
    const offers = await offerService.listActiveOffers(req.query, req.user?.id);
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/feed", optionalAuth, async (req, res) => {
  try {
    const feed = await offerService.listOfferFeed(req.query, req.user?.id);
    res.json(feed);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "مؤشر التصفّح غير صحيح" });
    }
    res.status(500).json({ message: err.message });
  }
});

router.get("/my", authMiddleware, roleMiddleware.businessOrAdmin, async (req, res) => {
  try {
    const offers = await offerService.getMyOffers(req.user.id, req.query);
    res.json({ offers });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
});

router.get("/dashboard", authMiddleware, roleMiddleware.business, async (req, res) => {
  try {
    const data = await offerService.getDashboardOffers(req.user, req.query);
    res.json(data);
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const offer = await offerService.getOfferById(req.params.id);
    res.json({ offer });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "معرّف العرض غير صحيح" });
    }
    const status = err.status || 500;
    res.status(status).json({ message: err.message });
  }
});

router.post("/", authMiddleware, roleMiddleware.businessOrAdmin, createOffer);
router.delete("/:id", authMiddleware, roleMiddleware.businessOrAdmin, requireOwnedStoreResource(Offer, "id", "العرض غير موجود"), deleteOffer);
router.put("/:id", authMiddleware, roleMiddleware.businessOrAdmin, requireOwnedStoreResource(Offer, "id", "العرض غير موجود"), updateOffer);
router.patch("/:id/renew", authMiddleware, roleMiddleware.businessOrAdmin, requireOwnedStoreResource(Offer, "id", "العرض غير موجود"), renewOffer);

module.exports = router;
