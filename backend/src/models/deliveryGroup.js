const mongoose = require('mongoose');

/**
 * Placeholder for future multi-store delivery trips.
 * One DeliveryGroup may reference multiple store orders.
 * Not used in current checkout flow.
 */
const deliveryGroupSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'draft',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('DeliveryGroup', deliveryGroupSchema);
