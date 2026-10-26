const Stripe = require('stripe');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

let client;
exports.stripe = () => {
  if (!env.stripe.secret) throw new ApiError(503, 'Stripe is not configured on the server');
  if (!client) client = new Stripe(env.stripe.secret);
  return client;
};

exports.createIntent = (order) =>
  exports.stripe().paymentIntents.create(
    {
      amount: order.total,
      currency: order.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      description: `ShopNest order ${order._id}`,
      metadata: { orderId: String(order._id) },
    },
    { idempotencyKey: `pi_${order._id}` } // a retried request can never create a second charge
  );

exports.retrieveIntent = (id) => exports.stripe().paymentIntents.retrieve(id);

exports.refund = (paymentIntentId) =>
  exports.stripe().refunds.create({ payment_intent: paymentIntentId }, { idempotencyKey: `refund_${paymentIntentId}` });

exports.constructEvent = (rawBody, signature) => {
  if (!env.stripe.webhookSecret) throw new ApiError(503, 'Stripe webhook secret not configured');
  return exports.stripe().webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
};
