const mongoose = require('mongoose');

const pointTransactionSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  amount: {
    type: Number,
    required: true // Positive for earn, negative for spend
  },
  type: {
    type: String,
    enum: ['earn', 'redeem', 'refund', 'bonus'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PointTransaction', pointTransactionSchema);
