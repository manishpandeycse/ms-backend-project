const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const env = require('../config/env');
const { ROLES } = require('../config/roles');
const orderSvc = require('../services/order.service');
const stripeSvc = require('../services/stripe.service');
const razorpaySvc = require('../services/razorpay.service');

exports.create = asyncHandler(async (req, res) => {
  const { items, provider, shippingAddress } = req.body;

  // Merge duplicate lines, then trust ONLY the database for names and prices
  const qtyById = new Map();
  items.forEach((i) => qtyById.set(i.productId, (qtyById.get(i.productId) || 0) + i.qty));
  const products = await Product.find({ _id: { $in: [...qtyById.keys()] }, isActive: true });
  if (products.length !== qtyById.size) throw new ApiError(400, 'One or more products are no longer available');

  const lines = products.map((p) => ({ product: p._id, retailer: p.retailer, name: p.name, price: p.price, qty: qtyById.get(String(p._id)) }));
  const itemsTotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totals = orderSvc.calcTotals(itemsTotal);

  await orderSvc.reserveStock(lines);

  let order;
  try {
    order = await Order.create({
      user: req.user._id, items: lines, shippingAddress, ...totals, currency: env.currency,
      payment: { provider }, expiresAt: new Date(Date.now() + env.pendingOrderTtlMin * 60 * 1000),
    });

    let payment;
    if (provider === 'stripe') {
      const intent = await stripeSvc.createIntent(order);
      order.payment.providerOrderId = intent.id;
      payment = { provider, clientSecret: intent.client_secret, publishableKey: env.stripe.publishable };
    } else {
      const rzp = await razorpaySvc.createOrder(order);
      order.payment.providerOrderId = rzp.id;
      payment = { provider, razorpayOrderId: rzp.id, keyId: env.razorpay.keyId, amount: order.total, currency: order.currency };
    }
    await order.save();
    res.status(201).json({ order, payment });
  } catch (err) {
    // Gateway/DB failure: never leave stock locked or a dangling order behind
    if (order) await orderSvc.closePending(order._id, 'cancelled');
    else await orderSvc.restoreStock(lines);
    throw err;
  }
});

function scopeFilter(user) {
  switch (user.role) {
    case ROLES.ADMIN: return {};
    case ROLES.RETAILER: return { 'items.retailer': user._id, status: { $ne: 'pending_payment' } };
    case ROLES.DELIVERY: return { status: { $in: ['shipped', 'delivered'] } };
    default: return { user: user._id };
  }
}

exports.list = asyncHandler(async (req, res) => {
  const filter = scopeFilter(req.user);
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name email');
  res.json({ items: orders });
});

exports.getOne = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, ...scopeFilter(req.user) }).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found');
  res.json({ order });
});

exports.cancelPending = asyncHandler(async (req, res) => {
  const owned = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!owned) throw new ApiError(404, 'Order not found');
  const closed = await orderSvc.closePending(owned._id, 'cancelled');
  if (!closed) throw new ApiError(409, 'Only unpaid orders can be cancelled');
  res.json({ order: closed });
});

const NEXT = { paid: 'processing', processing: 'shipped', shipped: 'delivered' };
const WHO = { processing: [ROLES.RETAILER, ROLES.ADMIN], shipped: [ROLES.RETAILER, ROLES.ADMIN], delivered: [ROLES.DELIVERY, ROLES.ADMIN] };

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!WHO[status].includes(req.user.role)) throw new ApiError(403, `Your role cannot set an order to "${status}"`);

  const filter = { _id: req.params.id };
  if (req.user.role === ROLES.RETAILER) filter['items.retailer'] = req.user._id;
  const from = Object.keys(NEXT).find((k) => NEXT[k] === status);
  const order = await Order.findOneAndUpdate({ ...filter, status: from }, { status }, { new: true });
  if (!order) throw new ApiError(409, `Order must be "${from}" before it can be set to "${status}"`);
  res.json({ order });
});
