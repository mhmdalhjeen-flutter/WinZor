// controllers/codeOrder.controller.js
const CodeOrder = require("../models/codeOrder");
const CardType  = require("../models/cardType");
const Store     = require("../models/store");
const PromoCode = require("../models/promoCode");
const crypto    = require("crypto");
const ExcelJS   = require("exceljs");
const QRCode    = require("qrcode");
const { generatePromoCodeString } = require("../utils/promoCode.util");
const { assertNoMongoOperators, cleanString, intInRange, requireObjectId } = require("../utils/inputSecurity.util");
const { safeLog } = require("../utils/logSanitize.util");

// ─────────────────────────────────────────────────────────────────────────────
// صاحب المتجر: طلب شراء أكواد (مع اختيار ورقي أو رقمي)
// ─────────────────────────────────────────────────────────────────────────────
exports.createCodeOrder = async (req, res) => {
    try {
        assertNoMongoOperators(req.body, "codeOrder");
        const { cardTypeId, quantity, deliveryType } = req.body;

        if (!cardTypeId || !quantity || quantity <= 0)
            return res.status(400).json({ message: "نوع الكرت والكمية مطلوبان" });

        if (!["physical", "digital"].includes(deliveryType))
            return res.status(400).json({ message: "نوع التسليم غير صحيح" });

        const store = await Store.findOne({ owner: req.user.id, isActive: true });
        if (!store) return res.status(404).json({ message: "لا يوجد متجر مرتبط بحسابك" });

        const safeCardTypeId = requireObjectId(cardTypeId, "cardTypeId");
        const safeQuantity = intInRange(quantity, { field: "quantity", min: 1, max: 10000, required: true });
        const safeDeliveryType = cleanString(deliveryType, { field: "deliveryType", max: 20, required: true });
        if (!["physical", "digital"].includes(safeDeliveryType))
            return res.status(400).json({ message: "نوع التسليم غير صحيح" });

        const cardType = await CardType.findById(safeCardTypeId);
        if (!cardType) return res.status(404).json({ message: "نوع الكرت غير موجود" });

        const order = await CodeOrder.create({
            store:        store._id,
            cardType:     safeCardTypeId,
            quantity:     safeQuantity,
            deliveryType: safeDeliveryType,
        });

        res.status(201).json({ message: "تم إرسال الطلب للأدمن بنجاح", order });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// صاحب المتجر: جلب طلباته
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user.id, isActive: true });
        if (!store) return res.status(404).json({ message: "لا يوجد متجر" });

        const orders = await CodeOrder.find({ store: store._id })
            .populate("cardType", "name price points color")
            .sort({ createdAt: -1 });

        res.json({ orders });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// صاحب المتجر: حذف طلب pending فقط
// ─────────────────────────────────────────────────────────────────────────────
exports.deleteMyOrder = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user.id, isActive: true });
        const id = requireObjectId(req.params.id, "id");
        const order = await CodeOrder.findById(id);
        if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
        if (order.store.toString() !== store._id.toString())
            return res.status(403).json({ message: "غير مسموح" });
        if (order.status !== "pending")
            return res.status(400).json({ message: "لا يمكن حذف طلب تم تكوينه" });

        await order.deleteOne();
        res.json({ message: "تم حذف الطلب" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// أدمن: جلب كل الطلبات
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await CodeOrder.find()
            .populate("store", "name phone whatsapp address")
            .populate("cardType", "name price points color")
            .sort({ createdAt: -1 });
        res.json({ orders });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// أدمن: تكوين الأكواد
// ✅ رقمي  → يولد أكواد ويضيفها مباشرة لرصيد المتجر (store.cards)
// ✅ ورقي  → يولد أكواد فقط للتصدير ولا يلمس رصيد المتجر
// ─────────────────────────────────────────────────────────────────────────────
exports.configureOrder = async (req, res) => {
    try {
        const id = requireObjectId(req.params.id, "id");
        const order = await CodeOrder.findById(id).populate("cardType");
        if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
        if (order.status === "configured")
            return res.status(400).json({ message: "تم تكوين هذا الطلب مسبقاً" });

        const storeDoc = await Store.findById(order.store);
        if (!storeDoc?.codePrefix) {
            return res.status(400).json({ message: "المتجر لا يملك بصمة أكواد" });
        }

        // توليد الأكواد
        const newCodes = [];
        for (let i = 0; i < order.quantity; i++) {
            newCodes.push({
                code:          generatePromoCodeString(storeDoc.codePrefix),
                rewardPoints:  order.cardType.points,
                rewardEntries: 1,
                store:         order.store,
                createdBy:     req.user.id,
            });
        }
        const created = await PromoCode.insertMany(newCodes);

        order.status       = "configured";
        order.codes        = created.map(c => c._id);
        order.configuredBy = req.user.id;
        order.configuredAt = new Date();
        await order.save();

        // ✅ رقمي: أضف الكروت مباشرة لرصيد المتجر وغيّر الحالة لـ received تلقائياً
        if (order.deliveryType === "digital") {
            await Store.findByIdAndUpdate(order.store, {
                $inc: { cards: order.quantity }
            });
            order.status     = "received";
            order.receivedAt = new Date();
            await order.save();

            return res.json({
                message: `✅ رقمي: تم تكوين ${order.quantity} كرت وإضافتها مباشرة لرصيد المتجر`,
                codes:   created,
                digital: true,
            });
        }

        // ورقي: فقط أكواد جاهزة للتصدير
        res.json({
            message: `تم تكوين ${order.quantity} كود بنجاح — جاهز للتصدير والطباعة`,
            codes:   created,
            digital: false,
        });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// أدمن: تأكيد استلام الكروت الورقية من المتجر
// ✅ عند الاستلام الورقي: أضف الكروت لرصيد المتجر
// ─────────────────────────────────────────────────────────────────────────────
exports.markAsReceived = async (req, res) => {
    try {
        const id = requireObjectId(req.params.id, "id");
        const order = await CodeOrder.findById(id);
        if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
        if (order.status !== "configured")
            return res.status(400).json({ message: "الطلب لم يتم تكوينه بعد" });
        if (order.deliveryType === "digital")
            return res.status(400).json({ message: "الطلب الرقمي يُضاف تلقائياً" });

        // ✅ أضف الكروت لرصيد المتجر عند تأكيد استلام الورقي
        await Store.findByIdAndUpdate(order.store, {
            $inc: { cards: order.quantity }
        });

        order.status     = "received";
        order.receivedAt = new Date();
        await order.save();

        res.json({ message: "تم تأكيد الاستلام وإضافة الكروت لرصيد المتجر" });
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// أدمن: تصدير Excel + QR
// ─────────────────────────────────────────────────────────────────────────────
exports.exportOrderCodes = async (req, res) => {
    try {
        const id = requireObjectId(req.params.id, "id");
        const order = await CodeOrder.findById(id)
            .populate({ path: "codes", model: "PromoCode" })
            .populate("cardType", "name points")
            .populate("store", "name");

        if (!order) return res.status(404).json({ message: "الطلب غير موجود" });
        if (!order.codes || order.codes.length === 0)
            return res.status(400).json({ message: "لا توجد أكواد لهذا الطلب" });

        const workbook  = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("الأكواد");

        worksheet.columns = [
            { header: "م",            key: "index",        width: 6  },
            { header: "الكود",        key: "code",         width: 20 },
            { header: "النقاط",       key: "points",       width: 10 },
            { header: "نوع التسليم", key: "deliveryType", width: 14 },
            { header: "المتجر",       key: "store",        width: 20 },
            { header: "QR Code",      key: "qr",           width: 18 },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font      = { bold: true, size: 12 };
        headerRow.alignment = { horizontal: "center", vertical: "middle" };
        headerRow.height    = 24;

        for (let i = 0; i < order.codes.length; i++) {
            const promoCode = order.codes[i];
            const rowIndex  = i + 2;

            worksheet.addRow({
                index:        i + 1,
                code:         promoCode.code,
                points:       order.cardType?.points || 0,
                deliveryType: order.deliveryType === "digital" ? "رقمي 📱" : "ورقي 🖨️",
                store:        order.store?.name || "",
            });

            const row = worksheet.getRow(rowIndex);
            row.height    = 90;
            row.alignment = { vertical: "middle", horizontal: "center" };

            const qrDataUrl = await QRCode.toDataURL(promoCode.code, { width: 100, margin: 1 });
            const base64    = qrDataUrl.replace("data:image/png;base64,", "");
            const imageId   = workbook.addImage({ base64, extension: "png" });
            worksheet.addImage(imageId, {
                tl: { col: 5,    row: rowIndex - 1 },
                br: { col: 5.99, row: rowIndex      },
            });
        }

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="codes-${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        safeLog("error", "code_order_export_failed", { message: err.message, userId: req.user?.id });
        res.status(500).json({ message: "تعذّر تصدير الأكواد" });
    }
};