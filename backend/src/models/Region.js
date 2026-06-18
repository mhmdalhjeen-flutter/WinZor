const mongoose = require("mongoose");

const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    subRegions: [{ // المناطق الفرعية التابعة لهذه المحافظة
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Region", regionSchema);
