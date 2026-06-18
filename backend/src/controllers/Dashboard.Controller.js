const Store = require("../models/Store");
const Offer = require("../models/Offer");
const Product = require("../models/Product");
const PromoCode = require("../models/PromoCode");

exports.getDashboard = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user.id });

        const products = await Product.find({ store: store._id });
        const offers = await Offer.find({ store: store._id });
        const codes = await PromoCode.find({ store: store._id });

        const activityScore =
            store.totalVisits +
            codes.reduce((a, c) => a + c.currentUses, 0) +
            products.length;

        res.json({
            store,
            analytics: {
                visits: store.totalVisits,
                products: products.length,
                offers: offers.length,
                codes: codes.length,
                activityScore
            }
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};