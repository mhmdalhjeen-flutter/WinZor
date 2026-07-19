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
const QR_DISPLAY_PX = 110;       // displayed size inside the cell (~90–120 px)
const QR_RENDER_PX  = 440;       // high-res source for sharp print (4× display)
const QR_ROW_HEIGHT = 96;        // points — keeps full QR visible without clipping
const QR_COL_WIDTH  = 16;        // Excel char units ≈ ~110 px display width

function excelColWidthForText(text, min = 12, max = 45) {
    const len = String(text || "").length;
    // Arabic glyphs need a bit more horizontal room than Latin
    const approx = Math.ceil(len * 1.15) + 3;
    return Math.min(Math.max(approx, min), max);
}

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
        const worksheet = workbook.addWorksheet("الأكواد", {
            views: [{ rightToLeft: true, state: "frozen", ySplit: 1 }],
            properties: { defaultRowHeight: 20 },
        });

        worksheet.columns = [
            { header: "اسم المتجر", key: "store", width: 20 },
            { header: "الرمز",      key: "code",  width: 20 },
            { header: "رمز QR",     key: "qr",    width: QR_COL_WIDTH },
        ];

        const headerRow = worksheet.getRow(1);
        headerRow.font      = { bold: true, size: 12, color: { argb: "FF1F2937" } };
        headerRow.alignment = {
            horizontal: "center",
            vertical: "middle",
            readingOrder: "rtl",
            wrapText: true,
        };
        headerRow.height = 28;
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFE8EEF4" },
        };
        headerRow.eachCell((cell) => {
            cell.border = {
                top:    { style: "thin", color: { argb: "FFCBD5E1" } },
                bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
                left:   { style: "thin", color: { argb: "FFCBD5E1" } },
                right:  { style: "thin", color: { argb: "FFCBD5E1" } },
            };
        });

        const storeName = order.store?.name || "";
        let maxStoreWidth = excelColWidthForText("اسم المتجر");
        let maxCodeWidth  = excelColWidthForText("الرمز");

        // Center QR inside the cell (Excel col width ≈ 7px/unit; row height in points ≈ 1.333px)
        const cellWidthPx  = QR_COL_WIDTH * 7;
        const cellHeightPx = QR_ROW_HEIGHT * (96 / 72);
        const colInset = Math.max(0, (cellWidthPx  - QR_DISPLAY_PX) / 2) / cellWidthPx;
        const rowInset = Math.max(0, (cellHeightPx - QR_DISPLAY_PX) / 2) / cellHeightPx;

        for (let i = 0; i < order.codes.length; i++) {
            const promoCode = order.codes[i];
            const rowIndex  = i + 2;
            const code      = promoCode.code;

            worksheet.addRow({
                store: storeName,
                code,
            });

            const row = worksheet.getRow(rowIndex);
            row.height = QR_ROW_HEIGHT;
            row.getCell(1).alignment = {
                vertical: "middle",
                horizontal: "right",
                readingOrder: "rtl",
                wrapText: true,
            };
            row.getCell(2).alignment = {
                vertical: "middle",
                horizontal: "center",
                readingOrder: "ltr",
            };
            row.getCell(3).alignment = {
                vertical: "middle",
                horizontal: "center",
            };

            maxStoreWidth = Math.max(maxStoreWidth, excelColWidthForText(storeName));
            maxCodeWidth  = Math.max(maxCodeWidth,  excelColWidthForText(code, 14, 36));

            // High-res PNG with quiet zone; displayed at fixed square size (no stretch)
            const qrDataUrl = await QRCode.toDataURL(code, {
                errorCorrectionLevel: "H",
                type: "image/png",
                width: QR_RENDER_PX,
                margin: 4,
                color: { dark: "#000000", light: "#FFFFFF" },
            });
            const base64  = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            const imageId = workbook.addImage({ base64, extension: "png" });

            // Equal width/height + oneCell edit keeps the QR sharp and undistorted
            worksheet.addImage(imageId, {
                tl: {
                    col: 2 + colInset,
                    row: (rowIndex - 1) + rowInset,
                },
                ext: {
                    width:  QR_DISPLAY_PX,
                    height: QR_DISPLAY_PX,
                },
                editAs: "oneCell",
            });
        }

        worksheet.getColumn(1).width = maxStoreWidth;
        worksheet.getColumn(2).width = maxCodeWidth;
        worksheet.getColumn(3).width = QR_COL_WIDTH;

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="codes-${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        safeLog("error", "code_order_export_failed", { message: err.message, userId: req.user?.id });
        res.status(500).json({ message: "تعذّر تصدير الأكواد" });
    }
};