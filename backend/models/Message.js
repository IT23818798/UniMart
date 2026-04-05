const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'senderType'
  },
  senderType: {
    type: String,
    required: true,
    enum: ['Buyer', 'Seller']
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  recipientType: {
    type: String,
    required: true,
    enum: ['Buyer', 'Seller']
  },
  content: {
    type: String,
    trim: true,
    required: function() {
      return !this.imageUrl && !this.isUnsent;
    }
  },
  imageUrl: {
    type: String,
    default: null
  },
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  senderDeleted: {
    type: Boolean,
    default: false
  },
  recipientDeleted: {
    type: Boolean,
    default: false
  },
  isUnsent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexing for faster conversation fetching
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);