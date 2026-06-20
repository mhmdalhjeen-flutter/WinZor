const mongoose = require("mongoose");

const drawBatchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "يجب تحديد اسم للفعالية"],
        trim: true
    },
    description: {
        type: String
    },
    eventType: { 
        type: String,
        enum: ["field", "online", "fast_contest"],
        default: "online"
    },
    targetAudience: { 
        type: String,
        default: "الجميع"
    },
    prizes: [{
        item: String,
        count: Number
    }],
    eventDate: { 
        type: Date,
        required: [true, "يجب تحديد موعد للفعالية"]
    },
    
    minParticipants: { 
        type: Number,
        default: 0
    },
    requiredRank: { 
        type: String,
        enum: ["bronze", "silver", "gold", "platinum", "all"],
        default: "all"
    },
    
    status: {
        type: String,
        enum: [
            "open",                 // التسجيل مفتوح
            "quorum_reached",       // تم الوصول للعدد المطلوب وبانتظار موافقة الأدمن
            "active",               // وافق الأدمن والفعالية جارية/مستمرة
            "closed",               // تم إغلاق التسجيل نهائياً
            "completed",            // انتهت الفعالية وتم إعلان الفائزين
            "cancelled"             // تم إلغاء الفعالية
        ],
        default: "open"
    },

    adminApproval: { // موافقة الأدمن اليدوية للبدء
        isApproved: { type: Boolean, default: false },
        approvedAt: Date
    },

    displayOnHome: { 
        type: Boolean,
        default: true
    },
    displayDuration: { 
        type: Number,
        default: 24
    },

    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now }
    }],

    winners: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        prize: String,
        wonAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });

// خاصية افتراضية لحساب العدد الحالي
drawBatchSchema.virtual("currentCount").get(function() {
    return this.participants.length;
});

module.exports = mongoose.model("DrawBatch", drawBatchSchema);
