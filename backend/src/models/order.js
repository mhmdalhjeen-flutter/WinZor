// models/order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    item:     { type: mongoose.Schema.Types.ObjectId, required: true },
    itemType: { type: String, enum: ['Product', 'Offer'], required: true },
    quantity: { type: Number, required: true, min: 1 },
    price:    { type: Number, required: true },
    name:     { type: String, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store:    { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    items:    [orderItemSchema],
    total:    { type: Number, required: true },
    status:   {
        type:    String,
        enum:    [
            'pending',              // بانتظار تأكيد صاحب المحل
            'confirmed',            // مؤكّد
            'rejected',             // مرفوض / لم يُؤكَّد
            'delivered',            // تم التسليم
            'cancelled',            // أُلغي (زبون أو محل)
            'completed_off_platform', // اكتمل البيع خارج المنصة
        ],
        default: 'pending',
    },
    /** هل أُهديت نقطة للزبون عند التأكيد؟ */
    pointsAwarded: { type: Boolean, default: false },
    /** هل خُصم كرت من المتجر عند التأكيد؟ */
    cardDeducted:  { type: Boolean, default: false },
}, { timestamps: true });

orderSchema.index({ store: 1, status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ customer: 1, store: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);