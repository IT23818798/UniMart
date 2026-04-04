const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin authentication middleware
const adminAuth = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.adminToken) {
      token = req.cookies.adminToken;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get admin from token
      const admin = await Admin.findById(decoded.id);
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Admin not found.'
        });
      }

      if (!admin.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      // Add admin to request
      req.admin = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      };

      next();
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};

// Permission check middleware
const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const { role, permissions } = req.admin;
      
      // Super admin has all permissions (handle case variations)
      if (role === 'super_admin' || role === 'SUPER_ADMIN') {
        return next();
      }
      
      // Check if admin has required permission
      if (!permissions || !permissions.includes(requiredPermission)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permission: ${requiredPermission}`,
          debug: {
            adminRole: role,
            adminPermissions: permissions,
            requiredPermission
          }
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in permission check'
      });
    }
  };
};

// Role check middleware
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const { role } = req.admin;
      
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in role check'
      });
    }
  };
};

// Rate limiting for admin login attempts
const loginRateLimit = (maxAttempts = 10, windowMs = 5 * 60 * 1000) => { // 10 attempts in 5 minutes
  const attempts = new Map();

  return (req, res, next) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    const key = req.ip + ':' + (req.body.email || '');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    const userAttempts = attempts.get(key) || [];
    const validAttempts = userAttempts.filter(time => time > windowStart);

    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.'
      });
    }

    // Add current attempt
    validAttempts.push(now);
    attempts.set(key, validAttempts);

    next();
  };
};

module.exports = {
  adminAuth,
  checkPermission,
  checkRole,
  loginRateLimit
};