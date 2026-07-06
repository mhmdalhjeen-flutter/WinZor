// models/cart.js
const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
    {
        item: {
            type:     mongoose.Schema.Types.ObjectId,
            // ❌ لا نضع refPath هنا — سنتولى الـ populate يدوياً في الـ route
            required: true,
        },
        itemType: {
            type:     String,
            enum:     ['Product', 'Offer'],
            required: true,
        },
        quantity: {
            type:    Number,
            default: 1,
            min:     1,
        },
    },
    { _id: false }
);

const cartSchema = new mongoose.Schema(
    {
        user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        items: [cartItemSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);