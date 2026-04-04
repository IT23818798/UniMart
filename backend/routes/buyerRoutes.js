const express = require('express');
const router = express.Router();
const {
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
  getAllBuyers,
  deleteBuyer
} = require('../controllers/buyerController');

const {
  authenticateBuyer,
  requireEmailVerification,
  requireMembership,
  rateLimitBuyer,
  requireLoyaltyPoints
} = require('../middleware/buyerAuth');

const { adminAuth: authenticateAdmin } = require('../middleware/adminAuth');

// Public routes (no authentication required)
router.post('/register', registerBuyer);
router.post('/login', loginBuyer);

// Basic buyer routes
router.post('/logout', logoutBuyer);
router.get('/profile', authenticateBuyer, getBuyerProfile);
router.put('/profile', authenticateBuyer, updateBuyerProfile);
router.put('/change-password', authenticateBuyer, changePassword);

// Dashboard routes
router.get('/dashboard/stats', authenticateBuyer, getDashboardStats);

// Wishlist management
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);
router.get('/wishlist', (req, res) => {
  res.json({
    success: true,
    message: 'Wishlist endpoint - implement with full product details',
    data: {
      wishlist: []
    }
  });
});

// Address management
router.post('/addresses', addDeliveryAddress);
router.get('/addresses', (req, res) => {
  res.json({
    success: true,
    message: 'Delivery addresses endpoint',
    data: {
      addresses: []
    }
  });
});

router.put('/addresses/:addressId', (req, res) => {
  res.json({
    success: true,
    message: 'Update delivery address endpoint',
    data: {
      address: req.body
    }
  });
});

router.delete('/addresses/:addressId', (req, res) => {
  res.json({
    success: true,
    message: 'Delete delivery address endpoint'
  });
});

// Order history and tracking
router.get('/orders', (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  
  res.json({
    success: true,
    message: 'Order history endpoint - implement with orders collection',
    data: {
      orders: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0
      },
      filters: { status }
    }
  });
});

router.get('/orders/:orderId', (req, res) => {
  res.json({
    success: true,
    message: 'Order details endpoint',
    data: {
      order: {
        id: req.params.orderId,
        status: 'processing',
        items: []
      }
    }
  });
});

// Reviews and ratings
router.post('/reviews', (req, res) => {
  res.json({
    success: true,
    message: 'Create review endpoint - implement with reviews collection',
    data: {
      review: req.body
    }
  });
});

router.get('/reviews', (req, res) => {
  res.json({
    success: true,
    message: 'Get buyer reviews endpoint',
    data: {
      reviews: []
    }
  });
});

// Notifications
router.get('/notifications', (req, res) => {
  res.json({
    success: true,
    data: {
      notifications: [
        {
          id: '1',
          type: 'order_update',
          title: 'Order Shipped',
          message: 'Your order #12345 has been shipped and is on its way!',
          read: false,
          createdAt: new Date()
        },
        {
          id: '2',
          type: 'promotion',
          title: 'New Deals Available',
          message: 'Check out fresh organic vegetables from your favorite sellers',
          read: false,
          createdAt: new Date(Date.now() - 86400000)
        }
      ],
      unreadCount: 2
    }
  });
});

router.put('/notifications/:notificationId/read', (req, res) => {
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
});

// Recommendations
router.get('/recommendations/products', (req, res) => {
  res.json({
    success: true,
    message: 'Product recommendations based on purchase history',
    data: {
      recommendations: []
    }
  });
});

router.get('/recommendations/sellers', (req, res) => {
  res.json({
    success: true,
    message: 'Seller recommendations based on location and preferences',
    data: {
      recommendations: []
    }
  });
});

// Premium member features
router.get('/premium/analytics', 
  requireMembership('premium'),
  rateLimitBuyer(20, 15 * 60 * 1000),
  (req, res) => {
    res.json({
      success: true,
      message: 'Advanced analytics for premium members',
      data: {
        spendingAnalytics: [],
        savingsReport: [],
        purchasePatterns: []
      }
    });
  }
);

router.get('/premium/concierge', 
  requireMembership('vip'),
  (req, res) => {
    res.json({
      success: true,
      message: 'VIP concierge service',
      data: {
        personalShopper: true,
        prioritySupport: true,
        exclusiveDeals: []
      }
    });
  }
);

// Loyalty program
router.get('/loyalty/status', (req, res) => {
  res.json({
    success: true,
    data: {
      currentPoints: 1250,
      level: 'Silver',
      nextLevel: 'Gold',
      pointsToNextLevel: 750,
      benefits: ['5% cashback', 'Free delivery on orders $50+', 'Early access to sales'],
      redeemableRewards: [
        { id: 1, name: '$5 Off Next Order', points: 500 },
        { id: 2, name: 'Free Delivery', points: 200 },
        { id: 3, name: '$10 Off Next Order', points: 1000 }
      ]
    }
  });
});

router.post('/loyalty/redeem', 
  requireLoyaltyPoints(100),
  (req, res) => {
    const { rewardId, points } = req.body;
    
    res.json({
      success: true,
      message: 'Reward redeemed successfully',
      data: {
        rewardId,
        pointsUsed: points,
        remainingPoints: 1150 // This should be calculated
      }
    });
  }
);

// Search and discovery
router.get('/search/products', (req, res) => {
  const { q, category, location, priceRange, organic } = req.query;
  
  res.json({
    success: true,
    message: 'Product search endpoint',
    data: {
      products: [],
      filters: { q, category, location, priceRange, organic },
      totalResults: 0
    }
  });
});

router.get('/search/sellers', (req, res) => {
  const { q, location, radius, rating } = req.query;
  
  res.json({
    success: true,
    message: 'Seller search endpoint',
    data: {
      sellers: [],
      filters: { q, location, radius, rating },
      totalResults: 0
    }
  });
});

// Admin-only routes for buyer management
router.get('/admin/all', authenticateAdmin, getAllBuyers);
router.delete('/admin/:buyerId', authenticateAdmin, deleteBuyer);

router.get('/admin/:buyerId/stats', authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Admin view of buyer statistics',
    data: {
      buyerId: req.params.buyerId,
      totalOrders: 0,
      totalSpent: 0,
      averageOrderValue: 0,
      lastLoginDate: null,
      membershipHistory: []
    }
  });
});

// Email verification
router.post('/verify-email', (req, res) => {
  res.json({
    success: true,
    message: 'Verification email sent'
  });
});

router.get('/verify-email/:token', (req, res) => {
  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

// Error handling middleware for buyer routes
router.use((error, req, res, next) => {
  console.error('Buyer route error:', error);
  
  res.status(500).json({
    success: false,
    message: 'An error occurred processing your request',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

module.exports = router;