const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const COOKIE = 'mn_rt';
const REUSE_GRACE_MS = 10 * 1000; // tolerates a duplicate refresh fired by the same browser within 10s
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

const cookieOpts = (maxAge) => ({
  httpOnly: true,
  secure: env.isProd || env.cookieSameSite === 'none',
  sameSite: env.cookieSameSite,
  path: '/api/auth',
  maxAge,
});

exports.signAccess = (user) =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.accessSecret, {
    algorithm: 'HS256',
    expiresIn: env.accessTtl,
    issuer: 'shopnest',
  });

exports.verifyAccess = (token) =>
  jwt.verify(token, env.accessSecret, { algorithms: ['HS256'], issuer: 'shopnest' });

async function issueRefresh(user, req, res, family = crypto.randomUUID()) {
  const raw = crypto.randomBytes(48).toString('hex');
  const ttl = env.refreshTtlDays * 24 * 60 * 60 * 1000;
  await RefreshToken.create({
    user: user._id,
    tokenHash: sha256(raw), // only the hash is stored, a DB leak cannot be replayed
    family,
    expiresAt: new Date(Date.now() + ttl),
    ip: req.ip,
    userAgent: (req.get('user-agent') || '').slice(0, 250),
  });
  res.cookie(COOKIE, raw, cookieOpts(ttl));
}
exports.issueRefresh = issueRefresh;

exports.clearCookie = (res) => res.clearCookie(COOKIE, cookieOpts(0));

// Refresh-token rotation with reuse detection
exports.rotate = async (req, res) => {
  const raw = req.cookies && req.cookies[COOKIE];
  if (!raw) throw new ApiError(401, 'Session expired, please sign in again');

  const doc = await RefreshToken.findOne({ tokenHash: sha256(raw) });
  if (!doc || doc.expiresAt < new Date()) {
    exports.clearCookie(res);
    throw new ApiError(401, 'Session expired, please sign in again');
  }

  if (doc.revoked) {
    const recentlyRotated = doc.revokedAt && Date.now() - doc.revokedAt.getTime() < REUSE_GRACE_MS;
    if (!recentlyRotated) {
      // A rotated token was replayed: assume theft and kill the whole session family
      await RefreshToken.updateMany({ family: doc.family }, { revoked: true, revokedAt: new Date() });
      exports.clearCookie(res);
    }
    throw new ApiError(401, 'Session expired, please sign in again');
  }

  const claimed = await RefreshToken.findOneAndUpdate(
    { _id: doc._id, revoked: false },
    { revoked: true, revokedAt: new Date() }
  );
  if (!claimed) throw new ApiError(401, 'Session expired, please sign in again');

  const user = await User.findById(doc.user);
  if (!user || !user.isActive) {
    exports.clearCookie(res);
    throw new ApiError(401, 'Account unavailable');
  }
  await issueRefresh(user, req, res, doc.family);
  return { user, accessToken: exports.signAccess(user) };
};

exports.revokeCurrent = async (req, res) => {
  const raw = req.cookies && req.cookies[COOKIE];
  if (raw) await RefreshToken.updateOne({ tokenHash: sha256(raw) }, { revoked: true, revokedAt: new Date() });
  exports.clearCookie(res);
};

exports.revokeAllForUser = (userId) =>
  RefreshToken.updateMany({ user: userId, revoked: false }, { revoked: true, revokedAt: new Date() });
