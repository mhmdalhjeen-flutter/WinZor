const CardType = require("../models/cardType");
const TreasureBox = require("../models/treasureBox");

// --- إدارة أنواع البطاقات ---
exports.createCardType = async (req, res) => {
    try {
        const card = await CardType.create(req.body);
        res.status(201).json({ success: true, data: card });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getCardTypes = async (req, res) => {
    try {
        const cards = await CardType.find({ isActive: true });
        res.status(200).json({ success: true, data: cards });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// --- إدارة الصناديق ---
exports.createTreasureBox = async (req, res) => {
    try {
        const box = await TreasureBox.create(req.body);
        res.status(201).json({ success: true, data: box });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getTreasureBoxes = async (req, res) => {
    try {
        const boxes = await TreasureBox.find().populate('store').populate('rewards.cardType');
        res.status(200).json({ success: true, data: boxes });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
