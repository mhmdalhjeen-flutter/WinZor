const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ["store", "product"], // تصنيف للمتاجر أو للمنتجات
        default: "store"
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);
