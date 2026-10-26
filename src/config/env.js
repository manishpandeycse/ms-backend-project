require('dotenv').config();

['MONGO_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach((k) => {
  if (!process.env[k]) throw new Error(`Missing required environment variable: ${k}`);
});

const num = (v, d) => (v !== undefined && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : d);

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: num(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtlDays: num(process.env.REFRESH_TOKEN_TTL_DAYS, 7),
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  currency: (process.env.CURRENCY || 'INR').toUpperCase(),
  taxRate: num(process.env.TAX_RATE, 0.18),
  freeShippingAbove: num(process.env.FREE_SHIPPING_ABOVE, 50000),
  shippingFee: num(process.env.SHIPPING_FEE, 4900),
  pendingOrderTtlMin: num(process.env.PENDING_ORDER_TTL_MIN, 30),
  stripe: {
    secret: process.env.STRIPE_SECRET_KEY,
    publishable: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },
};
