const { z } = require('zod');

const password = z
  .string()
  .min(8, 'must be at least 8 characters')
  .max(72)
  .regex(/[a-z]/, 'must include a lowercase letter')
  .regex(/[A-Z]/, 'must include an uppercase letter')
  .regex(/\d/, 'must include a number');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id');

exports.register = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email(),
    password,
    role: z.enum(['customer', 'retailer']).default('customer'),
    shopName: z.string().trim().min(2).max(120).optional(),
  })
  .refine((d) => d.role !== 'retailer' || d.shopName, { path: ['shopName'], message: 'is required for retailers' });

exports.login = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(72) });

exports.productCreate = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).optional().default(''),
  price: z.coerce.number().int().min(100, 'minimum is 100 (smallest currency unit)'),
  stock: z.coerce.number().int().min(0),
  category: z.string().trim().min(2).max(60),
  images: z.array(z.string().url()).max(6).optional().default([]),
});
exports.productUpdate = exports.productCreate.partial().extend({ isActive: z.boolean().optional() });

exports.productQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(60).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).default('newest'),
});

exports.createOrder = z.object({
  items: z.array(z.object({ productId: objectId, qty: z.coerce.number().int().min(1).max(20) })).min(1).max(30),
  provider: z.enum(['stripe', 'razorpay']),
  shippingAddress: z.object({
    fullName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(7).max(15),
    line1: z.string().trim().min(3).max(150),
    line2: z.string().trim().max(150).optional(),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    postalCode: z.string().trim().min(3).max(12),
    country: z.string().trim().length(2).default('IN'),
  }),
});

exports.orderStatus = z.object({ status: z.enum(['processing', 'shipped', 'delivered']) });

exports.razorpayVerify = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});
exports.stripeConfirm = z.object({ orderId: objectId });

exports.adminUserUpdate = z.object({
  role: z.enum(['customer', 'retailer', 'delivery', 'admin']).optional(),
  isActive: z.boolean().optional(),
  retailerStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
});

exports.changePassword = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: password,
});
