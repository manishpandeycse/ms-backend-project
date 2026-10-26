const User = require('../models/User');
const tokens = require('../services/token.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role, shopName } = req.body;
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');

  // "admin" and "delivery" can never be self-assigned; admins promote users from the dashboard
  const user = await User.create({
    name, email, password, role,
    ...(role === 'retailer' ? { shopName, retailerStatus: 'pending' } : {}),
  });
  await tokens.issueRefresh(user, req, res);
  res.status(201).json({ user: user.toPublic(), accessToken: tokens.signAccess(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
  const generic = new ApiError(401, 'Incorrect email or password');

  if (!user) throw generic;
  if (user.lockUntil && user.lockUntil > new Date()) {
    const mins = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new ApiError(423, `Too many failed attempts. Try again in ${mins} minute(s).`);
  }
  if (!(await user.comparePassword(password))) {
    await user.registerFailedLogin();
    throw generic;
  }
  if (!user.isActive) throw new ApiError(403, 'This account has been deactivated');

  await user.resetLoginAttempts();
  await tokens.issueRefresh(user, req, res);
  res.json({ user: user.toPublic(), accessToken: tokens.signAccess(user) });
});

exports.refresh = asyncHandler(async (req, res) => {
  const { user, accessToken } = await tokens.rotate(req, res);
  res.json({ user: user.toPublic(), accessToken });
});

exports.logout = asyncHandler(async (req, res) => {
  await tokens.revokeCurrent(req, res);
  res.json({ message: 'Signed out' });
});

exports.me = (req, res) => res.json({ user: req.user.toPublic() });

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  await tokens.revokeAllForUser(user._id); // sign out every device
  await tokens.issueRefresh(user, req, res);
  res.json({ message: 'Password updated', accessToken: tokens.signAccess(user) });
});
