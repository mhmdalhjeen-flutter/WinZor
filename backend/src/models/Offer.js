const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    },

    description: { 
        type: String 
    },

    offerType: {
        type: String,
        enum: ["discount", "fixed_price", "bogo", "free_item"],
        required: true,
    },

    value: {
        type: Number,
        default: null,
    },

    currency: {
        type: String,
        default: "ILS",
    },

    image: {
        type: String,
    },

    priority: { // نظام الترتيب المميز (كلما زاد الرقم ظهر العرض أولاً)
        type: Number,
        default: 0
    },

    isFeatured: { // تمييز العرض كعرض "بطل" أو خاص
        type: Boolean,
        default: false
    },

    startDate: { // تاريخ بداية ظهور العرض
        type: Date,
        default: Date.now
    },

    expiresAt: { // تاريخ انتهاء العرض (المحدد من صاحب المحل)
        type: Date,
    },

    autoDeleteAt: { // تاريخ الحذف/الإيقاف التلقائي (المحدد من النظام)
        type: Date
    },

    isExtended: { // هل تم تمديد العرض (مدفوع)
        type: Boolean,
        default: false
    },

    deletionWarningSent: { // هل تم إرسال تحذير الحذف
        type: Boolean,
        default: false
    },

    views: { // عدد المشاهدات
        type: Number,
        default: 0
    },

    clicks: { // عدد النقرات (المهتمين)
        type: Number,
        default: 0
    },

    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        required: true,
    },

    isActive: {
        type: Boolean,
        default: true,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model("Offer", offerSchema);
