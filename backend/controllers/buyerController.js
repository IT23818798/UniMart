const Buyer = require('../models/Buyer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');

// Register a new buyer
const registerBuyer = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      dateOfBirth,
      gender,
      preferences
    } = req.body;

    // Check if buyer already exists
    const existingBuyer = await Buyer.findOne({ email });
    if (existingBuyer) {
      return res.status(400).json({
        success: false,
        message: 'Buyer with this email already exists'
      });
    }

    // Create buyer object
    const buyerData = {
      firstName,
      lastName,
      email,
      password,
      phone,
      isActive: true
    };

    // Add optional fields if provided
    if (address) buyerData.address = address;
    if (dateOfBirth) buyerData.dateOfBirth = dateOfBirth;
    if (gender) buyerData.gender = gender;
    if (preferences) buyerData.preferences = preferences;

    // Create new buyer
    const buyer = new Buyer(buyerData);
    await buyer.save();

    // Generate JWT token
    const token = buyer.generateAuthToken();

    // Set token in cookie
    res.cookie('buyerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully',
      data: {
        buyer: buyer.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Buyer registration error:', error);
    
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

// Login buyer
const loginBuyer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find buyer by credentials
    const buyer = await Buyer.findByCredentials(email, password);
    
    // Check if buyer is active
    if (!buyer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Generate JWT token
    const token = buyer.generateAuthToken();

    // Set token in cookie
    res.cookie('buyerToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        buyer: buyer.toJSON(),
        token
      }
    });

  } catch (error) {
    console.error('Buyer login error:', error);
    
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid login credentials'
    });
  }
};

// Logout buyer
const logoutBuyer = async (req, res) => {
  try {
    res.clearCookie('buyerToken');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Buyer logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout'
    });
  }
};

// Get buyer profile
const getBuyerProfile = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.buyer.id)
      .populate('wishlist.productId', 'name price images')
      .populate('favoriteSellers.sellerId', 'businessName location ratings');
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.json({
      success: true,
      data: {
        buyer: buyer.toJSON()
      }
    });
  } catch (error) {
    console.error('Get buyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buyer profile'
    });
  }
};

// Update buyer profile
const updateBuyerProfile = async (req, res) => {
  try {
    const updates = { ...req.body };
    
    
    delete updates.password;
    delete updates._id;
    delete updates.email; 
    delete updates.purchaseStats;
    delete updates.wishlist;
    delete updates.favoriteSellers;

    const buyer = await Buyer.findByIdAndUpdate(
      req.buyer.id, 
      updates, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        buyer: buyer.toJSON()
      }
    });
  } catch (error) {
    console.error('Update buyer profile error:', error);
    
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
      message: 'Error updating buyer profile'
    });
  }
};

// Change buyer password
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

    const buyer = await Buyer.findById(req.buyer.id).select('+password');

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const isCurrentPasswordValid = await buyer.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    buyer.password = newPassword;
    await buyer.save();

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

// Get all reviews written by the authenticated buyer
const getBuyerReviews = async (req, res) => {
  try {
    const buyerId = req.buyer.id;

    const products = await Product.find({
      $or: [{ 'reviews.user': buyerId }, { 'reviews.userId': buyerId }]
    })
      .select('title category images seller reviews')
      .populate('seller', 'businessName firstName lastName');

    const reviews = [];

    products.forEach((product) => {
      const ownReviews = (product.reviews || []).filter(
        (review) =>
          (review.user && review.user.toString() === buyerId.toString()) ||
          (review.userId && review.userId.toString() === buyerId.toString())
      );

      ownReviews.forEach((review) => {
        reviews.push({
          reviewId: review._id,
          productId: product._id,
          productTitle: product.title,
          productCategory: product.category,
          productImage: product.images?.[0] || '',
          sellerName:
            product.seller?.businessName ||
            `${product.seller?.firstName || ''} ${product.seller?.lastName || ''}`.trim() ||
            'Unknown Seller',
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt
        });
      });
    });

    reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? Number((reviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / totalReviews).toFixed(1))
        : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalReviews,
          averageRating
        },
        reviews
      }
    });
  } catch (error) {
    console.error('Get buyer reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buyer reviews'
    });
  }
};

// Get buyer dashboard data
const getDashboardStats = async (req, res) => {
  const buildFallbackStats = (buyer = {}) => ({
    buyerInfo: {
      id: buyer._id || req.buyer?.id || null,
      fullName: buyer.fullName || req.buyer?.fullName || 'Buyer',
      loyaltyLevel: 'bronze',
      loyaltyPoints: 0,
      membershipType: 'basic',
      memberSince: buyer.createdAt || new Date(),
      lastLogin: buyer.lastLogin || null
    },
    purchaseMetrics: {
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: null,
      favoriteCategories: [],
      monthlySpending: 0
    },
    orderData: {
      pendingOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      returnedOrders: 0,
      recentOrders: [],
      upcomingDeliveries: []
    },
    wishlistStats: {
      totalItems: 0,
      recentlyAdded: [],
      topCategories: [],
      averagePrice: 0
    },
    sellerStats: {
      favoriteSellers: 0,
      recentPurchasesFrom: [],
      topRatedSellers: []
    },
    recommendations: {
      products: [],
      sellers: [],
      deals: [],
      seasonal: []
    },
    notifications: {
      unread: 0,
      recent: []
    },
    savings: {
      totalSavings: 0,
      loyaltyRewards: 0,
      membershipBenefits: []
    }
  });

  try {
    const buyerId = req.buyer.id;

    // Get buyer info
    const buyer = await Buyer.findById(buyerId)
      .select('firstName lastName fullName createdAt lastLogin purchaseStats membership wishlist favoriteSellers')
      .lean();
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const loyaltyPoints = Number(buyer.purchaseStats?.loyaltyPoints || 0);
    let loyaltyLevel = 'bronze';
    if (loyaltyPoints >= 5000) loyaltyLevel = 'diamond';
    else if (loyaltyPoints >= 2500) loyaltyLevel = 'platinum';
    else if (loyaltyPoints >= 1000) loyaltyLevel = 'gold';
    else if (loyaltyPoints >= 500) loyaltyLevel = 'silver';

    // Mock dashboard statistics (replace with actual queries from orders/products collections)
    const dashboardStats = {
      buyerInfo: {
        id: buyer._id,
        fullName: buyer.fullName,
        loyaltyLevel,
        loyaltyPoints,
        membershipType: buyer.membership?.type || 'basic',
        memberSince: buyer.createdAt,
        lastLogin: buyer.lastLogin
      },
      purchaseMetrics: {
        totalOrders: buyer.purchaseStats?.totalOrders || 0,
        totalSpent: buyer.purchaseStats?.totalSpent || 0,
        averageOrderValue: buyer.purchaseStats?.averageOrderValue || 0,
        lastOrderDate: buyer.purchaseStats?.lastOrderDate,
        favoriteCategories: buyer.purchaseStats?.favoriteCategories || [],
        monthlySpending: 0 // Calculate from actual orders
      },
      orderData: {
        pendingOrders: 0, // Count from orders collection
        deliveredOrders: 0,
        cancelledOrders: 0,
        returnedOrders: 0,
        recentOrders: [], // Get from orders collection
        upcomingDeliveries: []
      },
      wishlistStats: {
        totalItems: buyer.wishlist?.length || 0,
        recentlyAdded: (buyer.wishlist || []).slice(-5),
        topCategories: [],
        averagePrice: 0
      },
      sellerStats: {
        favoriteSellers: buyer.favoriteSellers?.length || 0,
        recentPurchasesFrom: [], // Get from orders
        topRatedSellers: (buyer.favoriteSellers || []).slice(0, 5)
      },
      recommendations: {
        products: [], // Based on purchase history and preferences
        sellers: [], // Based on location and preferences
        deals: [], // Current promotions matching interests
        seasonal: [] // Seasonal recommendations
      },
      notifications: {
        unread: 0,
        recent: [
          {
            type: 'order_update',
            message: 'Your order #12345 has been shipped',
            timestamp: new Date(),
            read: false
          },
          {
            type: 'promotion',
            message: 'New organic vegetables available from your favorite seller',
            timestamp: new Date(Date.now() - 86400000),
            read: false
          }
        ]
      },
      savings: {
        totalSavings: 0, // From discounts and promotions
        loyaltyRewards: buyer.purchaseStats?.loyaltyPoints || 0,
        membershipBenefits: buyer.membership?.benefits || []
      }
    };

    res.json({
      success: true,
      data: dashboardStats
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    // Do not break dashboard rendering for recoverable data-shape issues.
    res.status(200).json({
      success: true,
      data: buildFallbackStats(),
      warning: 'Dashboard statistics fallback returned due to partial data issue.'
    });
  }
};

// Manage wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId, sellerId } = req.body;
    
    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    await buyer.addToWishlist(productId, sellerId);

    res.json({
      success: true,
      message: 'Product added to wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding product to wishlist'
    });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    await buyer.removeFromWishlist(productId);

    res.json({
      success: true,
      message: 'Product removed from wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing product from wishlist'
    });
  }
};

// Manage delivery addresses
const addDeliveryAddress = async (req, res) => {
  try {
    const addressData = req.body;
    
    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    // If this is set as default, unset others
    if (addressData.isDefault) {
      buyer.deliveryAddresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    buyer.deliveryAddresses.push(addressData);
    await buyer.save();

    res.json({
      success: true,
      message: 'Delivery address added successfully',
      data: {
        addresses: buyer.deliveryAddresses
      }
    });
  } catch (error) {
    console.error('Add delivery address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding delivery address'
    });
  }
};

const getDeliveryAddresses = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.json({
      success: true,
      data: {
        addresses: buyer.deliveryAddresses
      }
    });
  } catch (error) {
    console.error('Get delivery addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delivery addresses'
    });
  }
};

const updateDeliveryAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const updates = { ...req.body };

    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const address = buyer.deliveryAddresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const allowedFields = [
      'label',
      'street',
      'city',
      'state',
      'zipCode',
      'country',
      'instructions',
      'isDefault',
      'coordinates'
    ];

    allowedFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        address[field] = updates[field];
      }
    });

    // If set as default, unset others
    if (address.isDefault) {
      buyer.deliveryAddresses.forEach((addr) => {
        if (addr._id.toString() !== addressId.toString()) {
          addr.isDefault = false;
        }
      });
    }

    await buyer.save();

    res.json({
      success: true,
      message: 'Delivery address updated successfully',
      data: {
        address,
        addresses: buyer.deliveryAddresses
      }
    });
  } catch (error) {
    console.error('Update delivery address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating delivery address'
    });
  }
};

const deleteDeliveryAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    const address = buyer.deliveryAddresses.id(addressId);
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    address.deleteOne();
    await buyer.save();

    res.json({
      success: true,
      message: 'Delivery address deleted successfully',
      data: {
        addresses: buyer.deliveryAddresses
      }
    });
  } catch (error) {
    console.error('Delete delivery address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting delivery address'
    });
  }
};

// Get all buyers (admin function)
const getAllBuyers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, membershipType } = req.query;
    
    const query = {};
    
    if (status) query.isActive = status === 'active';
    if (membershipType) query['membership.type'] = membershipType;

    const buyers = await Buyer.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const totalBuyers = await Buyer.countDocuments(query);

    res.json({
      success: true,
      data: {
        buyers,
        totalPages: Math.ceil(totalBuyers / limit),
        currentPage: page,
        totalBuyers
      }
    });
  } catch (error) {
    console.error('Get all buyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching buyers'
    });
  }
};

// Delete buyer (admin function)
const deleteBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    
    const buyer = await Buyer.findByIdAndDelete(buyerId);
    
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.json({
      success: true,
      message: 'Buyer deleted successfully'
    });
  } catch (error) {
    console.error('Delete buyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting buyer'
    });
  }
};

module.exports = {
  registerBuyer,
  loginBuyer,
  logoutBuyer,
  getBuyerProfile,
  updateBuyerProfile,
  changePassword,
  getDashboardStats,
  addToWishlist,
  removeFromWishlist,
  addDeliveryAddress,
  getBuyerReviews,
  getAllBuyers,
  deleteBuyer
};