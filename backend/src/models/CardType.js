const mongoose = require("mongoose");

const cardTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: "#FFD700" // default gold
    },
    pointsValue: {
        type: Number,
        required: true,
        default: 0
    },
    icon: {
        type: String, // يمكن تخزين اسم أيقونة من Lucide أو رابط صورة
        default: "credit-card"
    },
    description: {
        type: String,
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("CardType", cardTypeSchema);
