const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/roles');

const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER, index: true },
    isActive: { type: Boolean, default: true },
    // retailer-only
    shopName: { type: String, trim: true, maxlength: 120 },
    retailerStatus: { type: String, enum: ['pending', 'approved', 'rejected'] },
    // brute-force protection
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hash(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function compare(plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.methods.registerFailedLogin = async function failed() {
  const attempts = (this.loginAttempts || 0) + 1;
  const update = { loginAttempts: attempts };
  if (attempts >= MAX_ATTEMPTS) {
    update.lockUntil = new Date(Date.now() + LOCK_MS);
    update.loginAttempts = 0;
  }
  await this.constructor.updateOne({ _id: this._id }, update);
};

userSchema.methods.resetLoginAttempts = function reset() {
  return this.constructor.updateOne({ _id: this._id }, { loginAttempts: 0, $unset: { lockUntil: 1 } });
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    shopName: this.shopName,
    retailerStatus: this.retailerStatus,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
