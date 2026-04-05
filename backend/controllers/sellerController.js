const Seller = require('../models/Seller');
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register a new seller
const registerSeller = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      businessName,
      businessLicense,
      businessType,
      farmSize,
      cropTypes,
      location
    } = req.body;

    // Check if seller already exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: 'Seller with this email already exists'
      });
    }

    // Check if business name is already taken
    const existingBusiness = await Seller.findOne({ businessName });
    if (existingBusiness) {
      return res.status(400).json({
        success: false,
        message: 'Business name already exists. Please choose a different name.'
      });
    }

    // Create seller object
    const sellerData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      businessName,
      businessType: businessType || 'farm',
      isActive: true
    };

    // Add optional fields if provided
    if (businessLicense) sellerData.businessLicense = businessLicense;
    if (farmSize) sellerData.farmSize = farmSize;
    if (cropTypes && Array.isArray(cropTypes)) sellerData.cropTypes = cropTypes;
    if (location) sellerData.location = location;

    // Create new seller
    const seller = new Seller(sellerData);
    await seller.save();

    // Generate JWT token
    const token = seller.generateAuthToken();

    // Set token in cookie
    res.cookie('sellerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      success: true,
      message: 'Seller registered successfully',
      data: {
        seller: seller.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Seller registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

// Login seller
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find seller by credentials
    const seller = await Seller.findByCredentials(email, password);
    
    // Check if seller is active
    if (!seller.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Generate JWT token
    const token = seller.generateAuthToken();

    // Set token in cookie
    res.cookie('sellerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        seller: seller.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Seller login error:', error);
    
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid login credentials'
    });
  }
};

// Logout seller
const logoutSeller = async (req, res) => {
  try {
    res.clearCookie('sellerToken');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Seller logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      data: {
        seller: seller.toJSON()
      }
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller profile'
    });
  }
};

// Update seller profile
const updateSellerProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates._id;
    delete updates.email; // Email changes should be handled separately
    delete updates.isVerified;
    delete updates.verificationStatus;
    delete updates.totalSales;
    delete updates.totalProducts;

    const seller = await Seller.findByIdAndUpdate(
      req.seller.id, 
      updates, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        seller: seller.toJSON()
      }
    });
  } catch (error) {
    console.error('Update seller profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating seller profile'
    });
  }
};

// Change seller password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All password fields are required'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New passwords do not match'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get seller with password
    const seller = await Seller.findById(req.seller.id).select('+password');
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await seller.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    seller.password = newPassword;
    await seller.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
};

// Get seller dashboard data
const getDashboardStats = async (req, res) => {
  try {
    const sellerId = req.seller.id;

    // Get seller info
    const seller = await Seller.findById(sellerId);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Mock dashboard statistics (replace with actual queries)
    const dashboardStats = {
      sellerInfo: {
        id: seller._id,
        businessName: seller.businessName,
        sellerScore: seller.calculateSellerScore(),
        verificationStatus: seller.verificationStatus,
        isVerified: seller.isVerified,
        memberSince: seller.createdAt,
        lastLogin: seller.lastLogin
      },
      businessMetrics: {
        totalProducts: seller.totalProducts || 0,
        totalSales: seller.totalSales || 0,
        averageRating: seller.ratings.average || 0,
        totalReviews: seller.ratings.totalReviews || 0,
        subscriptionPlan: seller.subscription.plan || 'free',
        subscriptionStatus: seller.subscription.isActive ? 'active' : 'inactive'
      },
      salesData: {
        totalRevenue: 0, // Calculate from actual orders
        monthlyRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        returnedOrders: 0
      },
      productStats: {
        activeProducts: 0, // Count from products collection
        inactiveProducts: 0,
        outOfStockProducts: 0,
        lowStockProducts: 0,
        totalViews: 0,
        totalWishlistAdds: 0
      },
      recentActivity: {
        recentOrders: [], // Get from orders collection
        recentProducts: [], // Get from products collection
        recentReviews: [], // Get from reviews collection
        notifications: []
      },
      performanceMetrics: {
        conversionRate: 0,
        responseTime: 0, // Average response time to messages
        orderFulfillmentRate: 0,
        customerSatisfactionScore: seller.ratings.average || 0
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// Get all sellers (admin function)
const getAllSellers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, verificationStatus, businessType } = req.query;
    
    const query = {};
    
    if (status) query.isActive = status === 'active';
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (businessType) query.businessType = businessType;

    const sellers = await Seller.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalSellers = await Seller.countDocuments(query);

    res.json({
      success: true,
      data: {
        sellers,
        totalPages: Math.ceil(totalSellers / limit),
        currentPage: page,
        totalSellers
      }
    });
  } catch (error) {
    console.error('Get all sellers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sellers'
    });
  }
};

// Verify seller (admin function)
const verifySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, notes } = req.body;

    const seller = await Seller.findByIdAndUpdate(
      sellerId,
      { 
        verificationStatus: status,
        isVerified: status === 'approved',
        verificationNotes: notes
      },
      { new: true }
    );

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: `Seller verification status updated to ${status}`,
      data: {
        seller: seller.toJSON()
      }
    });
  } catch (error) {
    console.error('Verify seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating seller verification status'
    });
  }
};

// Delete seller (admin function)
const deleteSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    
    const seller = await Seller.findByIdAndDelete(sellerId);
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      message: 'Seller deleted successfully'
    });
  } catch (error) {
    console.error('Delete seller error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting seller'
    });
  }
};

const Order = require('../models/Order');

// Get seller details (Public/Buyer view)
const getSellerDetails = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id)
      .select('-password -bankDetails -loginAttempts -lockUntil -resetPasswordToken -resetPasswordExpire');
    const totalProducts = seller ? await Product.countDocuments({
      $or: [
        { seller: seller._id },
        { seller: seller._id.toString() },
        { seller: seller.businessName }
      ]
    }) : 0;
    
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const locationText = seller.location?.address || seller.address || 'Not specified';

    res.json({
      success: true,
      data: {
        id: seller._id,
        businessName: seller.businessName,
        firstName: seller.firstName,
        lastName: seller.lastName,
        fullName: seller.fullName,
        email: seller.email,
        phone: seller.phone,
        address: seller.address,
        location: seller.location,
        locationText,
        businessType: seller.businessType,
        businessTypeLabel: seller.businessType ? seller.businessType.replace(/_/g, ' ') : 'farm',
        isVerified: seller.isVerified,
        verificationStatus: seller.verificationStatus,
        ratings: seller.ratings,
        reviews: seller.reviews,
        totalProducts: Math.max(totalProducts, seller.totalProducts || 0),
        memberSince: seller.createdAt,
        profileImage: seller.profileImage,
        createdAt: seller.createdAt,
        updatedAt: seller.updatedAt
      }
    });
  } catch (error) {
    console.error('Get seller details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller details'
    });
  }
};

// Add a review for a seller (Buyer only)
const addSellerReview = async (req, res) => {
  try {
    const { rating, comment, orderId } = req.body;
    const sellerId = req.params.id;
    const buyerId = req.buyer.id;

    // Validate if the order belongs to this buyer and seller, and is completed
    const order = await Order.findOne({ 
      _id: orderId, 
      buyer: buyerId, 
      seller: sellerId 
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found or unauthorized' });
    }

    if (order.orderStatus !== 'done' && order.orderStatus !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Order must be completed before leaving a review' });
    }

    if (order.isReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this order' });
    }

    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    // Add review
    const review = {
      buyerId,
      buyerName: `${req.buyer.firstName || ''} ${req.buyer.lastName || ''}`.trim() || 'Anonymous Buyer',
      rating: Number(rating),
      comment,
      orderId
    };

    seller.reviews.push(review);

    // Update aggregate ratings
    seller.ratings.totalReviews = seller.reviews.length;
    seller.ratings.average = seller.reviews.reduce((acc, item) => item.rating + acc, 0) / seller.reviews.length;

    await seller.save({ validateBeforeSave: false });

    // Mark order as reviewed
    order.isReviewed = true;
    await order.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, message: 'Review added successfully', data: seller });
  } catch (error) {
    console.error('Add seller review error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

module.exports = {
  registerSeller,
  loginSeller,
  logoutSeller,
  getSellerProfile,
  updateSellerProfile,
  changePassword,
  getDashboardStats,
  getAllSellers,
  verifySeller,
  deleteSeller,
  getSellerDetails,
  addSellerReview
};