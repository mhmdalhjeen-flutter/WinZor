const HonorBoard = require("../models/honorBoard");

// جلب العناصر النشطة للوحة الشرف
exports.getActiveHonorItems = async (req, res) => {
    try {
        const now = new Date();
        const items = await HonorBoard.find({
            isActive: true,
            displayUntil: { $gt: now }
        })
        .populate("user", "name avatar rank")
        .sort({ priority: -1, createdAt: -1 });

        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ أثناء جلب لوحة الشرف", error: error.message });
    }
};

// إضافة عنصر جديد للوحة الشرف (للأدمن)
exports.addToHonorBoard = async (req, res) => {
    try {
        const { userId, title, message, awardImage, durationInHours, priority } = req.body;

        const displayUntil = new Date();
        displayUntil.setHours(displayUntil.getHours() + parseInt(durationInHours || 24));

        const newItem = new HonorBoard({
            user: userId,
            title,
            message,
            awardImage,
            displayUntil,
            priority: priority || 0
        });

        await newItem.save();
        res.status(201).json({ message: "تمت الإضافة للوحة الشرف بنجاح", item: newItem });
    } catch (error) {
        res.status(500).json({ message: "فشل إضافة العنصر", error: error.message });
    }
};

// حذف أو إخفاء عنصر
exports.toggleStatus = async (req, res) => {
    try {
        const item = await HonorBoard.findById(req.params.id);
        if (!item) return res.status(404).json({ message: "العنصر غير موجود" });

        item.isActive = !item.isActive;
        await item.save();
        res.status(200).json({ message: "تم تحديث الحالة", isActive: item.isActive });
    } catch (error) {
        res.status(500).json({ message: "خطأ في التحديث", error: error.message });
    }
};
