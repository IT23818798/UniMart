const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  title: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  orderItems: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'done'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed' // Keeping simple for MVP
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'points', 'split'],
    default: 'card'
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsUsed: {
    type: Number,
    default: 0
  },
  shippingAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    phone: { type: String }
  },
  contactPhone: {
    type: String,
    required: false
  },
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'pickup'
  },
  isReviewed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
