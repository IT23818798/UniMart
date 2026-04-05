const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a product title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price must be greater than or equal to 0']
  },
  stock: {
    type: Number,
    required: [true, 'Please provide product stock'],
    min: [0, 'Stock cannot be less than 0']
  },
  category: {
    type: String,
    required: [true, 'Please provide a product category'],
    enum: {
      values: ['Electronics', 'Clothing', 'Books', 'Home', 'Beauty', 'Food', 'Other', 'Services'],
      message: '{VALUE} is not supported'
    }
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be less than 0'],
    max: [5, 'Average rating cannot be more than 5']
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'Buyer',
      required: true
    },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Buyer'
    },
    name: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

productSchema.index({ status: 1 });

module.exports = mongoose.model('Product', productSchema);
