const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const buyerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  deliveryAddresses: [{
    label: {
      type: String,
      required: true // e.g., 'Home', 'Office', 'Gift'
    },
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'USA'
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    instructions: String, // Delivery instructions
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  }],
  profileImage: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  preferences: {
    // Dietary preferences
    dietary: [{
      type: String,
      enum: ['organic', 'gluten_free', 'vegan', 'vegetarian', 'keto', 'paleo', 'dairy_free', 'nut_free']
    }],
    // Product categories of interest
    interests: [{
      type: String,
      enum: [
        'vegetables', 'fruits', 'grains', 'dairy', 'meat', 'seafood',
        'herbs', 'spices', 'flowers', 'seeds', 'organic_products',
        'local_produce', 'seasonal_items', 'exotic_items'
      ]
    }],
    // Shopping preferences
    shopping: {
      maxDeliveryDistance: {
        type: Number,
        default: 25 // miles
      },
      preferredDeliveryTime: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'flexible']
      },
      buyingFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'bi_weekly', 'monthly', 'occasional']
      },
      budgetRange: {
        min: Number,
        max: Number
      }
    },
    // Communication preferences
    notifications: {
      email: {
        orders: { type: Boolean, default: true },
        promotions: { type: Boolean, default: true },
        newsletters: { type: Boolean, default: false },
        recommendations: { type: Boolean, default: true }
      },
      sms: {
        orders: { type: Boolean, default: false },
        promotions: { type: Boolean, default: false },
        delivery_updates: { type: Boolean, default: true }
      },
      push: {
        orders: { type: Boolean, default: true },
        promotions: { type: Boolean, default: false },
        recommendations: { type: Boolean, default: true }
      }
    }
  },
  // Purchase history and stats
  purchaseStats: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    averageOrderValue: {
      type: Number,
      default: 0
    },
    favoriteCategories: [String],
    lastOrderDate: Date,
    loyaltyPoints: {
      type: Number,
      default: 0
    }
  },
  // Account status and verification
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  phoneVerificationToken: {
    type: String,
    default: null
  },
  // Security and authentication
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  },
  // Account status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  // Wishlist and favorites
  wishlist: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  favoriteSellers: [{
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Seller'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reviews and ratings given by buyer
  reviewsGiven: {
    count: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  },
  // Subscription and membership
  membership: {
    type: {
      type: String,
      enum: ['basic', 'premium', 'vip'],
      default: 'basic'
    },
    startDate: Date,
    endDate: Date,
    benefits: [String],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  // Location for local recommendations
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: String,
    city: String,
    state: String,
    country: {
      type: String,
      default: 'USA'
    }
  }
}, {
  timestamps: true
});

// Create indexes for better performance
buyerSchema.index({ email: 1 });
buyerSchema.index({ phone: 1 });
buyerSchema.index({ isActive: 1 });
buyerSchema.index({ 'location.coordinates': '2dsphere' });
buyerSchema.index({ 'preferences.interests': 1 });

// Virtual for full name
buyerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
buyerSchema.virtual('fullAddress').get(function() {
  if (!this.address.street) return '';
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.zipCode}`;
});

// Check if account is locked
buyerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
buyerSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update purchase stats when saved
buyerSchema.pre('save', function(next) {
  if (this.purchaseStats.totalOrders > 0 && this.purchaseStats.totalSpent > 0) {
    this.purchaseStats.averageOrderValue = this.purchaseStats.totalSpent / this.purchaseStats.totalOrders;
  }
  next();
});

// Compare password method
buyerSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
buyerSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email,
      role: 'buyer',
      fullName: this.fullName,
      membershipType: this.membership.type
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Handle failed login attempts
buyerSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
    };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
buyerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Update last login
buyerSchema.methods.updateLastLogin = function() {
  return this.updateOne({ lastLogin: new Date() });
};

// Add to wishlist
buyerSchema.methods.addToWishlist = function(productId, sellerId) {
  // Check if product is already in wishlist
  const existingItem = this.wishlist.find(item => 
    item.productId.toString() === productId.toString()
  );
  
  if (!existingItem) {
    this.wishlist.push({ productId, sellerId });
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Remove from wishlist
buyerSchema.methods.removeFromWishlist = function(productId) {
  this.wishlist = this.wishlist.filter(item => 
    item.productId.toString() !== productId.toString()
  );
  return this.save();
};

// Add loyalty points
buyerSchema.methods.addLoyaltyPoints = function(points, reason = 'Purchase') {
  this.purchaseStats.loyaltyPoints += points;
  // You could also create a loyalty points history here
  return this.save();
};

// Calculate buyer loyalty level
buyerSchema.methods.getLoyaltyLevel = function() {
  const points = this.purchaseStats.loyaltyPoints;
  if (points >= 10000) return 'Diamond';
  if (points >= 5000) return 'Platinum';
  if (points >= 2000) return 'Gold';
  if (points >= 500) return 'Silver';
  return 'Bronze';
};

// Transform JSON output
buyerSchema.methods.toJSON = function() {
  const buyerObject = this.toObject();
  
  // Remove sensitive fields
  delete buyerObject.password;
  delete buyerObject.resetPasswordToken;
  delete buyerObject.resetPasswordExpire;
  delete buyerObject.loginAttempts;
  delete buyerObject.lockUntil;
  delete buyerObject.emailVerificationToken;
  delete buyerObject.phoneVerificationToken;
  
  // Add computed fields
  buyerObject.loyaltyLevel = this.getLoyaltyLevel();
  
  return buyerObject;
};

// Static method to find buyer by credentials
buyerSchema.statics.findByCredentials = async function(email, password) {
  const buyer = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!buyer) {
    throw new Error('Invalid login credentials');
  }
  
  if (buyer.isLocked) {
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await buyer.comparePassword(password);
  
  if (!isMatch) {
    await buyer.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (buyer.loginAttempts > 0) {
    await buyer.resetLoginAttempts();
  }
  
  // Update last login
  await buyer.updateLastLogin();
  
  return buyer;
};

// Static method to find buyers by location
buyerSchema.statics.findNearby = function(longitude, latitude, maxDistance = 25000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true
  });
};

// Static method to get buyers by interests
buyerSchema.statics.findByInterests = function(interests) {
  return this.find({
    'preferences.interests': { $in: interests },
    isActive: true
  });
};

const Buyer = mongoose.model('Buyer', buyerSchema);

module.exports = Buyer;