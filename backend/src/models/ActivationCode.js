const mongoose = require("mongoose");

const activationCodeSchema = new mongoose.Schema({
    code: String,
type: {
    type: String,
    enum: ["store_activation"],
    default: "store_activation"
},// store_activation
isUsed: {
    type: Boolean,
    default: false
},

    usedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    expiresAt: Date
}, {
    timestamps: true
});
module.exports = mongoose.model("ActivationCode", activationCodeSchema);
