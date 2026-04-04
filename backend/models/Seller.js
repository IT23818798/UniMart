const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sellerSchema = new mongoose.Schema({
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
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  businessName: {
    type: String,
    required: [true, 'Business/Farm name is required'],
    trim: true,
    maxlength: [100, 'Business name cannot exceed 100 characters']
  },
  businessLicense: {
    type: String,
    trim: true,
    maxlength: [50, 'License number cannot exceed 50 characters']
  },
  businessType: {
    type: String,
    enum: ['farm', 'agriculture_business', 'distributor', 'cooperative'],
    default: 'farm'
  },
  farmSize: {
    type: Number, // in acres
    min: [0, 'Farm size cannot be negative']
  },
  cropTypes: [{
    type: String,
    enum: [
      'rice', 'wheat', 'corn', 'vegetables', 'fruits', 
      'spices', 'herbs', 'legumes', 'dairy', 'livestock',
      'organic_produce', 'flowers', 'other'
    ]
  }],
  certifications: [{
    name: String,
    issuedBy: String,
    validUntil: Date,
    certificateNumber: String
  }],
  bankDetails: {
    accountHolderName: String,
    bankName: String,
    accountNumber: String,
    routingNumber: String,
    swiftCode: String
  },
  profileImage: {
    type: String,
    default: null
  },
  businessImages: [String],
  location: {
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    },
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'USA'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  verificationDocuments: [{
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Buyer',
      required: true
    },
    buyerName: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalSales: {
    type: Number,
    default: 0
  },
  totalProducts: {
    type: Number,
    default: 0
  },
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
  emailVerificationToken: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      sms: {
        type: Boolean,
        default: false
      },
      push: {
        type: Boolean,
        default: true
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  }
}, {
  timestamps: true
});

// Create indexes for better performance
sellerSchema.index({ email: 1 });
sellerSchema.index({ isActive: 1 });
sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ businessName: 'text' });
sellerSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for full name
sellerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Check if account is locked
sellerSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
sellerSchema.pre('save', async function(next) {
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

// Compare password method
sellerSchema.methods.comparePassword = async function(candidatePassword) {
  if (!candidatePassword) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
sellerSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      email: this.email,
      role: 'seller',
      businessName: this.businessName,
      isVerified: this.isVerified
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Handle failed login attempts
sellerSchema.methods.incLoginAttempts = function() {
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
sellerSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Update last login
sellerSchema.methods.updateLastLogin = function() {
  return this.updateOne({ lastLogin: new Date() });
};

// Calculate seller score based on various factors
sellerSchema.methods.calculateSellerScore = function() {
  let score = 0;
  
  // Base score for active account
  if (this.isActive) score += 20;
  
  // Verification bonus
  if (this.isVerified) score += 30;
  
  // Rating bonus (0-25 points)
  score += (this.ratings.average / 5) * 25;
  
  // Sales activity bonus (0-15 points)
  if (this.totalSales > 0) {
    score += Math.min(15, Math.log10(this.totalSales) * 3);
  }
  
  // Product variety bonus (0-10 points)
  score += Math.min(10, this.totalProducts * 0.5);
  
  return Math.round(Math.min(100, score));
};

// Transform JSON output
sellerSchema.methods.toJSON = function() {
  const sellerObject = this.toObject();
  
  // Remove sensitive fields
  delete sellerObject.password;
  delete sellerObject.resetPasswordToken;
  delete sellerObject.resetPasswordExpire;
  delete sellerObject.loginAttempts;
  delete sellerObject.lockUntil;
  delete sellerObject.emailVerificationToken;
  delete sellerObject.bankDetails;
  
  // Add computed fields
  sellerObject.sellerScore = this.calculateSellerScore();
  
  return sellerObject;
};

// Static method to find seller by credentials
sellerSchema.statics.findByCredentials = async function(email, password) {
  const seller = await this.findOne({ email, isActive: true }).select('+password');
  
  if (!seller) {
    throw new Error('Invalid login credentials');
  }
  
  if (seller.isLocked) {
    throw new Error('Account temporarily locked due to too many failed login attempts');
  }
  
  const isMatch = await seller.comparePassword(password);
  
  if (!isMatch) {
    await seller.incLoginAttempts();
    throw new Error('Invalid login credentials');
  }
  
  // Reset login attempts on successful login
  if (seller.loginAttempts > 0) {
    await seller.resetLoginAttempts();
  }
  
  // Update last login
  await seller.updateLastLogin();
  
  return seller;
};

// Static method to get sellers by location
sellerSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
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
    isActive: true,
    isVerified: true
  });
};

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;