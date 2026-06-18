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

    points: {
        type: Number,
        default: 0,
    },

    entriesWallet: { // رصيد فرص السحب المدخرة
        type: Number,
        default: 0,
    },

    xp: { // نقاط الخبرة للارتقاء في المستويات
        type: Number,
        default: 0,
    },

    level: {
        type: Number,
        default: 1,
    },

    codesUsed: {
        type: Number,
        default: 0,
    },

    wishlist: [{ // قائمة العروض المفضلة
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

module.exports = mongoose.model("User", userSchema);
