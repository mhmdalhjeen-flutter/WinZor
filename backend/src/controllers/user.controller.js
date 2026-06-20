const user = require("../models/user");
const CardType = require("../models/cardType");
const logActivity = require("../utils/logger");

// تحديث الملف الشخصي (الأيقونة والاسم)
exports.updateProfile = async (req, res) => {
    try {
        const { name, avatar } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        if (name) user.name = name;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.status(200).json({
            message: "تم تحديث الملف الشخصي بنجاح",
            user: {
                id: user._id,
                name: user.name,
                avatar: user.avatar,
                rank: user.rank
            }
        });
    } catch (error) {
        res.status(500).json({ message: "خطأ في تحديث البيانات", error: error.message });
    }
};

// جلب بيانات المستخدم الحالي
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('inventory.cards.cardType').select("-password");
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "خطأ في جلب البيانات" });
    }
};

// --- تبديل البطاقة الملونة بنقاط XP ---
exports.redeemCard = async (req, res) => {
    try {
        const { cardTypeId } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId).populate('inventory.cards.cardType');
        if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

        // البحث عن البطاقة في المخزن
        const cardIndex = user.inventory.cards.findIndex(
            item => item.cardType._id.toString() === cardTypeId
        );

        if (cardIndex === -1 || user.inventory.cards[cardIndex].count <= 0) {
            return res.status(400).json({ message: "أنت لا تملك هذه البطاقة لتبديلها" });
        }

        const card = user.inventory.cards[cardIndex].cardType;
        const pointsToAdd = card.pointsValue;

        // خصم بطاقة واحدة وإضافة النقاط
        user.inventory.cards[cardIndex].count -= 1;
        user.points += pointsToAdd;

        // إذا أصبح العدد صفر، نفضل إبقاء السجل أو حذفه حسب الرغبة (هنا سنبقي السجل بعدد 0)
        
        await user.save();

        // تسجيل النشاط
        await logActivity({
            action: "تبديل بطاقة",
            details: `المستخدم ${user.name} حول بطاقة ${card.name} إلى ${pointsToAdd} نقطة XP`,
            user: user._id
        });

        res.status(200).json({
            success: true,
            message: `تم تبديل البطاقة بنجاح! حصلت على ${pointsToAdd} نقطة`,
            newPoints: user.points,
            remainingCount: user.inventory.cards[cardIndex].count
        });

    } catch (error) {
        res.status(500).json({ message: "خطأ أثناء عملية التبديل", error: error.message });
    }
};
