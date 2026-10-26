const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let client;
const rzp = () => {
  if (!env.razorpay.keyId || !env.razorpay.keySecret) throw new ApiError(503, 'Razorpay is not configured on the server');
  if (!client) client = new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
};

exports.createOrder = (order) =>
  rzp().orders.create({
    amount: order.total,
    currency: order.currency,
    receipt: String(order._id),
    notes: { orderId: String(order._id) },
  });

exports.fetchPayment = (id) => rzp().payments.fetch(id);
exports.refund = (paymentId) => rzp().payments.refund(paymentId, { speed: 'normal' });

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''), 'utf8');
  const y = Buffer.from(String(b || ''), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

exports.verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  const expected = crypto.createHmac('sha256', env.razorpay.keySecret || '').update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
};

exports.verifyWebhookSignature = (rawBody, signature) => {
  if (!env.razorpay.webhookSecret) throw new ApiError(503, 'Razorpay webhook secret not configured');
  const expected = crypto.createHmac('sha256', env.razorpay.webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
};
