const ActivationCode = require("../models/ActivationCode");
const Store = require("../models/store");

exports.activateStore = async (req, res) => {
    try {
        const code = req.body.code.trim().toUpperCase();

        const activation = await ActivationCode.findOne({
            code: code,
            isUsed: false
        });

        if (!activation) {
            return res.status(400).json({
                message: "كود التفعيل غير صالح أو مستخدم"
            });
        }

        const store = await Store.findOne({ owner: req.user.id });

        if (!store) {
            return res.status(404).json({
                message: "لا يوجد متجر مرتبط بحسابك"
            });
        }

        store.isActive = true;
        await store.save();

        activation.isUsed = true;
        activation.usedBy = req.user.id;
        await activation.save();

        res.json({ message: "تم تفعيل المتجر بنجاح" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.createStoreActivationCode = async (req, res) => {
    try {
        const { accountType } = req.body; // store أو supplier

        const code = "ACT-" + Math.random().toString(36).substring(2, 8).toUpperCase();

        const activation = await ActivationCode.create({
            code,
            type: accountType, // 👈 هنا التغيير المهم
            isUsed: false,
            createdBy: req.user.id
        });

        res.json({
            message: "تم إنشاء كود التفعيل",
            activation
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};