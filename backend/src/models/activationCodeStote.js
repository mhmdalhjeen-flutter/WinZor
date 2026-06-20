const mongoose = require("mongoose");

const activationCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Store",
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // admin
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("ActivationCode", activationCodeSchema);