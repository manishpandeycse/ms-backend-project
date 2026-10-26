const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/roles');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTS = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 } };

exports.list = asyncHandler(async (req, res) => {
  const { q, category, page, limit, sort } = req.query;
  const filter = { isActive: true };
  if (category) filter.category = category;
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

  const [items, total] = await Promise.all([
    Product.find(filter).sort(SORTS[sort]).skip((page - 1) * limit).limit(limit).populate('retailer', 'shopName'),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

exports.categories = asyncHandler(async (req, res) => {
  res.json({ categories: await Product.distinct('category', { isActive: true }) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const p = await Product.findOne({ _id: req.params.id, isActive: true }).populate('retailer', 'shopName');
  if (!p) throw new ApiError(404, 'Product not found');
  res.json({ product: p });
});

exports.mine = asyncHandler(async (req, res) => {
  const filter = req.user.role === ROLES.ADMIN ? {} : { retailer: req.user._id };
  res.json({ items: await Product.find(filter).sort({ createdAt: -1 }) });
});

exports.create = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, retailer: req.user._id });
  res.status(201).json({ product });
});

async function loadOwned(req) {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  if (req.user.role !== ROLES.ADMIN && String(p.retailer) !== String(req.user._id)) throw new ApiError(403, 'You can only manage your own products');
  return p;
}

exports.update = asyncHandler(async (req, res) => {
  const p = await loadOwned(req);
  Object.assign(p, req.body);
  await p.save();
  res.json({ product: p });
});

// Soft delete keeps historical orders intact
exports.remove = asyncHandler(async (req, res) => {
  const p = await loadOwned(req);
  p.isActive = false;
  await p.save();
  res.json({ message: 'Product removed' });
});
