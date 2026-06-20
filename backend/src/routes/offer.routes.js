const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const { createOffer } = require("../controllers/offer.controller");

const Offer = require("../models/offer");


// 📌 GET all offers
router.get("/", async (req, res) => {
    try {
        const offers = await Offer.find({ isActive: true })
            .populate("store", "name image");

        res.json(offers);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// 📌 CREATE offer (protected)
router.post("/", authMiddleware, createOffer);

module.exports = router;