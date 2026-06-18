const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    phone: {
        type: String,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
    },

    // --- الرصيد والجوائز ---
    points: {
        type: Number,
        default: 0,
    },

    entriesWallet: { // رصيد فرص السحب المدخرة
        type: Number,
        default: 0,
    },

    xp: { // نقاط الخبرة
        type: Number,
        default: 0,
    },

    level: {
        type: Number,
        default: 1,
    },

    codesUsed: { // عدد الأكواد المدخلة (يحدد الرتبة)
        type: Number,
        default: 0,
    },

    rank: { // الرتبة: bronze, silver, gold, platinum
        type: String,
        enum: ["bronze", "silver", "gold", "platinum"],
        default: "bronze",
    },

    // --- حالة الحساب ---
    status: {
        type: String,
        enum: ["active", "suspended", "banned"],
        default: "active",
    },

    suspensionUntil: { // تاريخ انتهاء الحظر المؤقت
        type: Date,
        default: null
    },

    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer"
    }],

    role: {
        type: String,
        enum: ["customer", "store", "supplier", "admin"],
        default: "customer",
    },
}, {
    timestamps: true,
});

// Middleware لتحديث الرتبة تلقائياً بناءً على عدد الأكواد قبل الحفظ
userSchema.pre("save", function(next) {
    if (this.isModified("codesUsed")) {
        if (this.codesUsed >= 100) this.rank = "platinum";
        else if (this.codesUsed >= 50) this.rank = "gold";
        else if (this.codesUsed >= 10) this.rank = "silver";
        else this.rank = "bronze";
    }
    next();
});

module.exports = mongoose.model("User", userSchema);
