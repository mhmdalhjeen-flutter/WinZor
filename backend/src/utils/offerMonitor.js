const Offer = require("../models/Offer");

/**
 * وظيفة مراقبة العروض:
 * 1. إيقاف العروض التي تجاوزت تاريخ الحذف التلقائي.
 * 2. إرسال تنبيهات للعروض التي ستنتهي خلال 3 أيام.
 */
const monitorOffers = async () => {
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));

        // 1. معالجة العروض المنتهية (الحذف التلقائي)
        const expiredOffers = await Offer.updateMany(
            {
                autoDeleteAt: { $lte: now },
                isActive: true
            },
            {
                $set: { isActive: false }
            }
        );

        if (expiredOffers.modifiedCount > 0) {
            console.log(`[Monitor]: تم إيقاف ${expiredOffers.modifiedCount} عرض منتهي الصلاحية.`);
        }

        // 2. البحث عن العروض التي ستنتهي قريباً ولم يتم تحذير أصحابها
        const pendingWarnings = await Offer.find({
            autoDeleteAt: { $gt: now, $lte: threeDaysFromNow },
            isActive: true,
            deletionWarningSent: false
        }).populate("store", "name phone owner");

        for (const offer of pendingWarnings) {
            // هنا يتم إرسال إشعار (واتساب أو إيميل) - حالياً سنكتفي بتسجيلها في النظام
            console.log(`[Warning]: العرض "${offer.title}" للمتجر "${offer.store.name}" سينتهي خلال أقل من 3 أيام.`);
            
            // تحديث حالة العرض بأنه تم إرسال التحذير
            offer.deletionWarningSent = true;
            await offer.save();
        }

    } catch (error) {
        console.error("[Monitor Error]: خطأ في مراقبة العروض:", error.message);
    }
};

module.exports = monitorOffers;
