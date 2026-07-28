// models/order.js
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, required: true },
  itemType: { type: String, enum: ['Product', 'Offer'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  name: { type: String, required: true },
}, { _id: false });

const statusTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  at: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, index: true, sparse: true },
  verificationCode: { type: String, index: true, unique: true, sparse: true },
  containerId: { type: String, default: '' },
  containerName: { type: String, default: '' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [orderItemSchema],
  total: { type: Number, required: true },
  currency: { type: String, default: 'ILS' },
  status: {
    type: String,
    enum: [
      'pending',
      'store_accepted',
      'preparing',
      'delivered_to_driver',
      'delivered_to_customer',
      'confirmed',
      'rejected',
      'delivered',
      'cancelled',
      'completed_off_platform',
    ],
    default: 'pending',
  },
  customerNotes: { type: String, default: '' },
  storeNotes: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid'],
    default: 'unpaid',
  },
  paymentProof: { type: String, default: '' },
  pointsAwarded: { type: Boolean, default: false },
  cardDeducted: { type: Boolean, default: false },
  confirmedAt: { type: Date },
  completedAt: { type: Date },
  deleteAfter: { type: Date },
  statusTimeline: [statusTimelineSchema],
}, { timestamps: true });

orderSchema.index({ store: 1, status: 1, createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ customer: 1, store: 1, status: 1, createdAt: -1 });
orderSchema.index({ deleteAfter: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { deleteAfter: { $type: 'date' } } });

module.exports = mongoose.model('Order', orderSchema);
