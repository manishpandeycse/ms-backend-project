const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const tokens = require('../services/token.service');
const orderSvc = require('../services/order.service');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.stats = asyncHandler(async (req, res) => {
  const [users, retailers, pendingRetailers, products, orders, revenue] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'retailer', retailerStatus: 'approved' }),
    User.countDocuments({ role: 'retailer', retailerStatus: 'pending' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ['paid', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);
  res.json({ users, retailers, pendingRetailers, products, orders, revenue: revenue[0] ? revenue[0].total : 0 });
});

exports.listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = String(req.query.role);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  res.json({ items: await User.find(filter).sort({ createdAt: -1 }).limit(200) .then((a) => a.map((u) => u.toPublic())) });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && (req.body.isActive === false || (req.body.role && req.body.role !== 'admin'))) {
    throw new ApiError(400, 'You cannot deactivate or demote your own admin account');
  }
  Object.assign(user, req.body);
  if (req.body.role === 'retailer' && !user.retailerStatus) { user.retailerStatus = 'approved'; user.shopName = user.shopName || `${user.name}'s Shop`; }
  await user.save();
  if (req.body.role || req.body.isActive === false) await tokens.revokeAllForUser(user._id);
  res.json({ user: user.toPublic() });
});

exports.refundOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found');
  if (!['paid', 'processing', 'refund_required'].includes(order.status)) throw new ApiError(409, 'This order cannot be refunded in its current state');
  const wasRefundNeeded = order.status === 'refund_required';
  const refunded = await orderSvc.refundPayment(order, order.payment.paymentId);
  if (refunded.status === 'refunded' && !wasRefundNeeded) await orderSvc.restoreStock(order.items.map((i) => ({ product: i.product, qty: i.qty })));
  res.json({ order: refunded });
});
