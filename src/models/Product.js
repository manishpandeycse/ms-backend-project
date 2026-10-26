const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 4000, default: '' },
    // Money is always stored as an integer in the smallest currency unit (paise / cents)
    price: { type: Number, required: true, min: 100, validate: Number.isInteger },
    stock: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    category: { type: String, required: true, trim: true, index: true },
    images: { type: [String], default: [] },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
