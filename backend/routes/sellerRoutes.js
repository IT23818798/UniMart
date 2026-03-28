const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/sellerController');

const {
  getSellerProducts,
  getSellerProductById,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct
} = require('../controllers/sellerProductController');

const {
  getSellerOrders,
  getSellerOrderById,
  updateSellerOrderStatus,
  getSellerOrderStats
} = require('../controllers/sellerOrderController');

const {
  authenticateSeller,
  requireVerifiedSeller,
  requireSubscription,
  rateLimitSeller
} = require('../middleware/sellerAuth');

const { adminAuth: authenticateAdmin } = require('../middleware/adminAuth');

// Public routes (no authentication required)
router.post('/register', registerSeller);
router.post('/login', loginSeller);

// Seller search and filtering routes
router.get('/search', (req, res) => {
  res.json({
    success: true,
    message: 'Seller search endpoint',
    data: {
      sellers: [],
      filters: req.query
    }
  });
});

router.get('/nearby', (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required for location search'
    });
  }

  res.json({
    success: true,
    message: 'Nearby sellers endpoint',
    data: {
      sellers: [],
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      radius: parseFloat(radius)
    }
  });
});

router.get('/info/:id', getSellerDetails);

// Buyer review route
const { authenticateBuyer } = require('../middleware/buyerAuth');
router.post('/info/:id/reviews', authenticateBuyer, addSellerReview);

// Protected routes (authentication required)
router.use(authenticateSeller); // All routes below require authentication

// Basic seller routes
router.post('/logout', logoutSeller);
router.get('/profile', getSellerProfile);
router.put('/profile', updateSellerProfile);
router.put('/change-password', changePassword);

// Dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Verified seller routes (require verification)
router.get('/dashboard/advanced', requireVerifiedSeller, getDashboardStats);

// Premium features (require subscription)
router.get('/analytics/detailed', 
  requireVerifiedSeller, 
  requireSubscription('premium'), 
  rateLimitSeller(50, 15 * 60 * 1000),
  (req, res) => {
    res.json({
      success: true,
      message: 'Detailed analytics feature - Premium subscription required',
      data: {
        // Mock premium analytics data
        conversionFunnel: [],
        customerSegments: [],
        advancedMetrics: []
      }
    });
  }
);

router.get('/marketing/tools', 
  requireVerifiedSeller, 
  requireSubscription('basic'),
  (req, res) => {
    res.json({
      success: true,
      message: 'Marketing tools - Basic subscription or higher required',
      data: {
        // Mock marketing tools data
        campaigns: [],
        promotions: [],
        emailTemplates: []
      }
    });
  }
);

// Admin-only routes for seller management
router.get('/admin/all', authenticateAdmin, getAllSellers);
router.put('/admin/:sellerId/verify', authenticateAdmin, verifySeller);
router.delete('/admin/:sellerId', authenticateAdmin, deleteSeller);

// Error handling middleware for seller routes
router.get('/metrics/summary', requireVerifiedSeller, (req, res) => {
  res.json({
    success: true,
    data: {
      salesMetrics: {
        totalRevenue: 0,
        monthlyGrowth: 0,
        orderCount: 0,
        avgOrderValue: 0
      },
      productMetrics: {
        totalProducts: 0,
        activeProducts: 0,
        viewCount: 0,
        conversionRate: 0
      },
      customerMetrics: {
        totalCustomers: 0,
        repeatCustomers: 0,
        customerSatisfaction: 0,
        reviewCount: 0
      }
    }
  });
});

// Seller verification document upload endpoint
router.post('/verification/upload', requireVerifiedSeller, (req, res) => {
  res.json({
    success: true,
    message: 'Document upload endpoint - implement with multer middleware',
    data: {
      uploadedFiles: []
    }
  });
});

// Seller subscription management
router.get('/subscription/status', (req, res) => {
  res.json({
    success: true,
    data: {
      currentPlan: 'free',
      isActive: true,
      expiresAt: null,
      features: ['basic_listing', 'customer_support'],
      usage: {
        productsListed: 0,
        maxProducts: 10,
        ordersProcessed: 0,
        maxOrders: 100
      }
    }
  });
});

router.post('/subscription/upgrade', requireVerifiedSeller, (req, res) => {
  const { plan } = req.body;
  
  if (!['basic', 'premium', 'enterprise'].includes(plan)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription plan'
    });
  }

  res.json({
    success: true,
    message: `Subscription upgrade to ${plan} plan initiated`,
    data: {
      plan,
      paymentRequired: true,
      upgradeUrl: '/payment/subscription'
    }
  });
});

// ============ PRODUCT MANAGEMENT ROUTES ============
// All product routes require seller authentication and verification
router.post('/products', requireVerifiedSeller, createSellerProduct);
router.get('/products', requireVerifiedSeller, getSellerProducts);
router.get('/products/:id', requireVerifiedSeller, getSellerProductById);
router.put('/products/:id', requireVerifiedSeller, updateSellerProduct);
router.delete('/products/:id', requireVerifiedSeller, deleteSellerProduct);

// ============ ORDER MANAGEMENT ROUTES ============
// All order routes require seller authentication and verification
router.get('/orders', requireVerifiedSeller, getSellerOrders);
router.get('/orders/stats/summary', requireVerifiedSeller, getSellerOrderStats);
router.get('/orders/:orderId', requireVerifiedSeller, getSellerOrderById);
router.put('/orders/:orderId/status', requireVerifiedSeller, updateSellerOrderStatus);

// Error handling middleware for seller routes
router.use((error, req, res, next) => {
  console.error('Seller route error:', error);
  
  res.status(500).json({
    success: false,
    message: 'An error occurred processing your request',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

module.exports = router;