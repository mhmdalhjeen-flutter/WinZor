const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        // مثال: "كود تم إدخاله", "متجر جديد", "سحب جديد", "محاولة دخول خاطئة"
    },
    details: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store"
    },
    ipAddress: {
        type: String
    },
    severity: {
        type: String,
        enum: ["info", "warning", "danger"],
        default: "info"
    }
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
