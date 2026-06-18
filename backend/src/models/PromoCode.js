const mongoose = require("mongoose");

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    store: { // المتجر المرتبط بالكود (اختياري في حال كان كود تسجيل عام)
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: false 
    },

    rewardPoints: { // عدد النقاط التي يمنحها الكود
        type: Number,
        default: 0
    },

    rewardEntries: { // عدد فرص السحب التي يمنحها الكود
        type: Number,
        default: 0
    },

    isRegistrationCode: { // هل هذا كود لتفعيل حساب (صاحب متجر/تاجر)؟
        type: Boolean,
        default: false
    },

    batchName: { // اسم الدفعة المطبوعة (لأغراض إدارية)
        type: String
    },

    usedBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        usedAt: {
            type: Date,
            default: Date.now
        }
    }],

    isActive: {
        type: Boolean,
        default: true
    },

    maxUses: {
        type: Number,
        default: 1
    },

    currentUses: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

module.exports = mongoose.model("PromoCode", promoCodeSchema);
