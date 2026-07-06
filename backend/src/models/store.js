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
    },

    regionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", default: null },
    subRegionId: { type: mongoose.Schema.Types.ObjectId, ref: "Region", default: null },

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

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },

    logo: {
        type: String,
    },

    coverImage: {
        type: String,
    },

    /** هل شاهد صاحب المتجر نافذة ترحيب الصورة/الغلاف */
    brandingWelcomeSeen: {
        type: Boolean,
        default: false,
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

    /** بصمة فريدة لأكواد الكروت — تُولَّد عند إنشاء المتجر */
    codePrefix: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true,
    },

    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },

    cards: {
    type: Number,
    default: 0,          // عدد الكروت المتاحة
    },

    bypassCards: {
        type: Boolean,
        default: false,      // الأدمن يفعّلها ليتخطى شرط الكروت
    },
    address: { type: String, default: "" },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, {
    timestamps: true,
});

storeSchema.index({ owner: 1 });
storeSchema.index({ isActive: 1, createdAt: -1 });
storeSchema.index({ isActive: 1, regionId: 1 });
storeSchema.index({ isActive: 1, subRegionId: 1 });
storeSchema.index({ isActive: 1, categoryId: 1 });

module.exports = mongoose.model("Store", storeSchema);
