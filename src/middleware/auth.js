const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccess } = require('../services/token.service');
const { ROLES } = require('../config/roles');

exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyAccess(token);
  } catch (e) {
    throw new ApiError(401, e.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
  }
  // Fresh DB read: role changes and deactivation take effect immediately
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new ApiError(401, 'Account unavailable');
  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new ApiError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'You do not have permission to do this'));
  next();
};

// Retailers must be approved by an admin before they can sell
exports.requireApprovedRetailer = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) return next();
  if (req.user.role !== ROLES.RETAILER) return next(new ApiError(403, 'Retailer account required'));
  if (req.user.retailerStatus !== 'approved') return next(new ApiError(403, 'Your retailer account is awaiting admin approval'));
  next();
};
