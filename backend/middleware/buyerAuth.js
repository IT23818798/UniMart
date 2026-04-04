const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');

// Middleware to authenticate buyer
const authenticateBuyer = async (req, res, next) => {
  try {
    const token = req.cookies.buyerToken || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Find buyer and check if account is still active
    const buyer = await Buyer.findById(decoded.id);

    if (!buyer || !buyer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or inactive buyer account.'
      });
    }

    req.buyer = {
      id: buyer._id,
      email: buyer.email,
      fullName: buyer.fullName,
      membershipType: buyer.membership.type,
      loyaltyLevel: buyer.getLoyaltyLevel()
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

    console.error('Buyer authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Middleware to check if buyer has verified email
const requireEmailVerification = async (req, res, next) => {
  next();
};

// Middleware to check membership level
const requireMembership = (minLevel = 'basic') => {
  const membershipHierarchy = {
    'basic': 0,
    'premium': 1,
    'vip': 2
  };

  return async (req, res, next) => {
    try {
      const buyer = await Buyer.findById(req.buyer.id);

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: 'Buyer not found'
        });
      }

      const userMembershipLevel = membershipHierarchy[buyer.membership.type] || 0;
      const requiredMembershipLevel = membershipHierarchy[minLevel] || 0;

      if (userMembershipLevel < requiredMembershipLevel || !buyer.membership.isActive) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${minLevel} membership or higher`,
          currentMembership: buyer.membership.type,
          requiredMembership: minLevel,
          membershipActive: buyer.membership.isActive
        });
      }

      next();
    } catch (error) {
      console.error('Membership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking membership status'
      });
    }
  };
};

// Middleware for rate limiting per buyer
const rateLimitBuyer = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const buyerRequests = new Map();

  return (req, res, next) => {
    const buyerId = req.buyer.id;
    const now = Date.now();

    if (!buyerRequests.has(buyerId)) {
      buyerRequests.set(buyerId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const buyerData = buyerRequests.get(buyerId);

    if (now > buyerData.resetTime) {
      buyerRequests.set(buyerId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (buyerData.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((buyerData.resetTime - now) / 1000)
      });
    }

    buyerData.count++;
    next();
  };
};

// Middleware to check loyalty points threshold
const requireLoyaltyPoints = (minPoints = 0) => {
  return async (req, res, next) => {
    try {
      const buyer = await Buyer.findById(req.buyer.id);

      if (!buyer) {
        return res.status(404).json({
          success: false,
          message: 'Buyer not found'
        });
      }

      if (buyer.purchaseStats.loyaltyPoints < minPoints) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${minPoints} loyalty points`,
          currentPoints: buyer.purchaseStats.loyaltyPoints,
          requiredPoints: minPoints
        });
      }

      next();
    } catch (error) {
      console.error('Loyalty points check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking loyalty points'
      });
    }
  };
};

module.exports = {
  authenticateBuyer,
  requireEmailVerification,
  requireMembership,
  rateLimitBuyer,
  requireLoyaltyPoints
};