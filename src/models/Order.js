const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: String,
        price: Number, // snapshot of unit price at purchase time
        qty: { type: Number, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'IN' },
    },
    itemsTotal: Number,
    shipping: Number,
    tax: Number,
    total: Number,
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'expired', 'refunded', 'refund_required'],
      default: 'pending_payment',
      index: true,
    },
    payment: {
      provider: { type: String, enum: ['stripe', 'razorpay'] },
      providerOrderId: { type: String, index: true }, // Stripe PaymentIntent id / Razorpay order id
      paymentId: String,
      status: { type: String, enum: ['created', 'succeeded', 'refunded', 'refund_failed'], default: 'created' },
      paidAt: Date,
      refundId: String,
    },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
