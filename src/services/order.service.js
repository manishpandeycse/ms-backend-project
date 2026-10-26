const Order = require('../models/Order');
const Product = require('../models/Product');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const stripeSvc = require('./stripe.service');
const razorpaySvc = require('./razorpay.service');

// Atomically reserves stock one product at a time; rolls everything back if any item fails.
exports.reserveStock = async (lines) => {
  const reserved = [];
  try {
    for (const l of lines) {
      const r = await Product.updateOne(
        { _id: l.product, isActive: true, stock: { $gte: l.qty } },
        { $inc: { stock: -l.qty } }
      );
      if (r.modifiedCount !== 1) throw new ApiError(409, `"${l.name}" is out of stock or has too few units left`);
      reserved.push(l);
    }
  } catch (err) {
    await exports.restoreStock(reserved);
    throw err;
  }
};

exports.restoreStock = async (lines) => {
  if (!lines.length) return;
  await Product.bulkWrite(lines.map((l) => ({ updateOne: { filter: { _id: l.product }, update: { $inc: { stock: l.qty } } } })));
};

exports.calcTotals = (itemsTotal) => {
  const shipping = itemsTotal >= env.freeShippingAbove ? 0 : env.shippingFee;
  const tax = Math.round(itemsTotal * env.taxRate);
  return { itemsTotal, shipping, tax, total: itemsTotal + shipping + tax };
};

// pending_payment -> cancelled/expired and returns reserved stock. Safe to call twice.
exports.closePending = async (orderId, newStatus) => {
  const order = await Order.findOneAndUpdate({ _id: orderId, status: 'pending_payment' }, { status: newStatus }, { new: true });
  if (order) await exports.restoreStock(order.items.map((i) => ({ product: i.product, qty: i.qty })));
  return order;
};

exports.refundPayment = async (order, paymentId) => {
  const provider = order.payment.provider;
  try {
    const r = provider === 'stripe' ? await stripeSvc.refund(order.payment.providerOrderId) : await razorpaySvc.refund(paymentId || order.payment.paymentId);
    return Order.findByIdAndUpdate(order._id, { status: 'refunded', 'payment.status': 'refunded', 'payment.refundId': r.id, 'payment.paymentId': paymentId || order.payment.paymentId }, { new: true });
  } catch (err) {
    console.error('Refund failed for order', String(order._id), err.message);
    return Order.findByIdAndUpdate(order._id, { status: 'refund_required', 'payment.status': 'refund_failed', 'payment.paymentId': paymentId || order.payment.paymentId }, { new: true });
  }
};

// Single entry point used by webhooks AND client confirmations. Fully idempotent.
exports.settlePaid = async (orderId, paymentId) => {
  const paid = await Order.findOneAndUpdate(
    { _id: orderId, status: 'pending_payment' },
    { $set: { status: 'paid', 'payment.status': 'succeeded', 'payment.paymentId': paymentId, 'payment.paidAt': new Date() } },
    { new: true }
  );
  if (paid) return paid;

  const current = await Order.findById(orderId);
  // Money arrived after the order was cancelled/expired (stock already released): refund automatically.
  if (current && ['cancelled', 'expired'].includes(current.status)) return exports.refundPayment(current, paymentId);
  return current; // already paid / processed: nothing to do
};
