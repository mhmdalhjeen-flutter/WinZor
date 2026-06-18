const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },

    description: {
        type: String,
    },

    phone: {
        type: String,
        required: true,
    },

    whatsapp: {
        type: String,
    },

    region: {
        type: String,
        required: true,
        enum: ["North", "Gaza", "Middle", "South", "Rafah"]
    },

    subRegion: {
        type: String,
        required: true,
    },

    address: {
        type: String,
    },

    category: {
        type: String,
        required: true,
    },

    logo: {
        type: String,
    },

    coverImage: {
        type: String,
    },

    isActive: {
        type: Boolean,
        default: false,
    },

    activationCode: {
        type: String,
    },

    // --- نظام التحكم في الميزات (Feature Toggling) ---
    features: {
        aiTools: { type: Boolean, default: false }, // مساعد الذكاء الاصطناعي
        priorityOffers: { type: Boolean, default: false }, // العروض المميزة
        advancedAnalytics: { type: Boolean, default: false }, // إحصائيات متقدمة
        gamification: { type: Boolean, default: false } // نظام الألعاب والمكافآت
    },

    // --- إحصائيات الاستخدام للتحكم الإداري والمالي ---
    usageStats: {
        aiContentGenerated: { type: Number, default: 0 },
        aiImagesImproved: { type: Number, default: 0 },
        priorityOffersUsed: { type: Number, default: 0 }
    },

    // أقصى مدة مسموحة لبقاء العرض فعالاً (بالأيام)
    maxOfferDays: {
        type: Number,
        default: 30
    },

    totalVisits: {
        type: Number,
        default: 0
    },

    todayVisits: {
        type: Number,
        default: 0
    },

    customersCount: {
        type: Number,
        default: 0
    },

    codesEntered: {
        type: Number,
        default: 0
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model("Store", storeSchema);
