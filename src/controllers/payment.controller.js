const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const orderSvc = require('../services/order.service');
const stripeSvc = require('../services/stripe.service');
const razorpaySvc = require('../services/razorpay.service');

// Called by the browser after Stripe confirms (or on redirect return). Verifies server-side with Stripe.
exports.stripeConfirm = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.body.orderId, user: req.user._id });
  if (!order || order.payment.provider !== 'stripe') throw new ApiError(404, 'Order not found');
  if (order.status !== 'pending_payment') return res.json({ order });

  const intent = await stripeSvc.retrieveIntent(order.payment.providerOrderId);
  if (intent.status === 'succeeded' && intent.amount === order.total && intent.metadata.orderId === String(order._id)) {
    return res.json({ order: await orderSvc.settlePaid(order._id, intent.id) });
  }
  res.json({ order, paymentStatus: intent.status }); // still processing / requires action
});

exports.razorpayVerify = asyncHandler(async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const order = await Order.findOne({ 'payment.providerOrderId': orderId, 'payment.provider': 'razorpay', user: req.user._id });
  if (!order) throw new ApiError(404, 'Order not found');
  if (!razorpaySvc.verifyCheckoutSignature({ orderId, paymentId, signature })) throw new ApiError(400, 'Payment signature verification failed');
  res.json({ order: await orderSvc.settlePaid(order._id, paymentId) });
});

// ---- Webhooks (raw body, no auth header; authenticity proven by signature) ----
exports.stripeWebhook = asyncHandler(async (req, res) => {
  let event;
  try {
    event = stripeSvc.constructEvent(req.body, req.headers['stripe-signature']);
  } catch (e) {
    if (e.status === 503) throw e;
    return res.status(400).json({ message: 'Invalid signature' });
  }
  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    if (intent.metadata && intent.metadata.orderId) await orderSvc.settlePaid(intent.metadata.orderId, intent.id);
  }
  res.json({ received: true });
});

exports.razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  if (!razorpaySvc.verifyWebhookSignature(req.body, signature)) return res.status(400).json({ message: 'Invalid signature' });

  const event = JSON.parse(req.body.toString('utf8'));
  if (['payment.captured', 'order.paid'].includes(event.event)) {
    const payment = event.payload && event.payload.payment && event.payload.payment.entity;
    if (payment) {
      const order = await Order.findOne({ 'payment.providerOrderId': payment.order_id, 'payment.provider': 'razorpay' });
      if (order) await orderSvc.settlePaid(order._id, payment.id);
    }
  }
  res.json({ received: true });
});
