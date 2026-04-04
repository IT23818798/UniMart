const jwt = require('jsonwebtoken');
const Seller = require('../models/Seller');

// Middleware to authenticate seller
const authenticateSeller = async (req, res, next) => {
  try {
    const token = req.cookies.sellerToken || req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Find seller and check if account is still active
    const seller = await Seller.findById(decoded.id);
    
    if (!seller || !seller.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or inactive seller account.'
      });
    }

    req.seller = {
      id: seller._id,
      email: seller.email,
      businessName: seller.businessName,
      isVerified: seller.isVerified,
      verificationStatus: seller.verificationStatus
    };
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.'
      });
    }
    
    console.error('Seller authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Middleware to check if seller is verified
const requireVerifiedSeller = async (req, res, next) => {
  next();
};

// Middleware to check subscription level
const requireSubscription = (minPlan = 'free') => {
  const planHierarchy = {
    'free': 0,
    'basic': 1,
    'premium': 2,
    'enterprise': 3
  };

  return async (req, res, next) => {
    try {
      const seller = await Seller.findById(req.seller.id);
      
      if (!seller) {
        return res.status(404).json({
          success: false,
          message: 'Seller not found'
        });
      }

      const userPlanLevel = planHierarchy[seller.subscription.plan] || 0;
      const requiredPlanLevel = planHierarchy[minPlan] || 0;

      if (userPlanLevel < requiredPlanLevel || !seller.subscription.isActive) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${minPlan} subscription or higher`,
          currentPlan: seller.subscription.plan,
          requiredPlan: minPlan,
          subscriptionActive: seller.subscription.isActive
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking subscription status'
      });
    }
  };
};

// Middleware for rate limiting per seller
const rateLimitSeller = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const sellerRequests = new Map();

  return (req, res, next) => {
    const sellerId = req.seller.id;
    const now = Date.now();
    
    if (!sellerRequests.has(sellerId)) {
      sellerRequests.set(sellerId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const sellerData = sellerRequests.get(sellerId);
    
    if (now > sellerData.resetTime) {
      sellerRequests.set(sellerId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (sellerData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((sellerData.resetTime - now) / 1000)
      });
    }

    sellerData.count++;
    next();
  };
};

module.exports = {
  authenticateSeller,
  requireVerifiedSeller,
  requireSubscription,
  rateLimitSeller
};