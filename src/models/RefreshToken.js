const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    revoked: { type: Boolean, default: false },
    revokedAt: Date,
    expiresAt: { type: Date, required: true },
    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

// MongoDB removes expired documents automatically
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
