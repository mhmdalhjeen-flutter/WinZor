const mongoose = require("mongoose");

const drawBatchSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    drawType: { // نوع السحب (ميداني، أونلاين، خاص بمحل، إلخ)
        type: String,
        default: "ميداني"
    },
    prizes: [{ // قائمة الجوائز المحددة لهذه الدفعة
        item: String,
        count: Number
    }],
    drawDate: { 
        type: Date,
        required: true
    },
    
    // --- نظام التصويت الميداني ---
    locationOptions: [{ // الأماكن المقترحة للسحب ليصوت عليها الناس
        name: String,
        votes: { type: Number, default: 0 }
    }],
    finalLocation: { // المكان النهائي الذي حدده الأدمن
        type: String
    },
    adminNotes: { // ملاحظات الأدمن وسبب اختيار الموقع (للمراجعة المستقبلية)
        type: String
    },

    status: {
        type: String,
        enum: ["open", "voting", "closed", "completed"],
        default: "open"
    },

    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        entriesCount: {
            type: Number,
            default: 1
        },
        votedLocation: String, // الموقع الذي صوّت له هذا المستخدم
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],

    totalEntries: {
        type: Number,
        default: 0
    },
    totalVoters: { // إجمالي من شارك في التصويت
        type: Number,
        default: 0
    },

    winners: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        prize: String,
        drawLocation: String // مكان السحب الذي فاز فيه
    }]

}, { timestamps: true });

module.exports = mongoose.model("DrawBatch", drawBatchSchema);
