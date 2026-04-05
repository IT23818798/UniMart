const express = require('express');
const router = express.Router();
const {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  logoutAdmin,
  getDashboardStats,
  getAllProducts,
  getAllOrders,
  getAllAdmins
} = require('../controllers/adminController');

const { adminAuth, checkPermission, checkRole, loginRateLimit } = require('../middleware/adminAuth');

// @desc    Register admin
// @route   POST /api/admin/register
// @access  Public (in production, restrict this route)
router.post('/register', registerAdmin);

// @desc    Login admin
// @route   POST /api/admin/login  
// @access  Public
router.post('/login', loginRateLimit(), loginAdmin);

// @desc    Logout admin
// @route   POST /api/admin/logout
// @access  Private
router.post('/logout', adminAuth, logoutAdmin);

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private
router.get('/profile', adminAuth, getAdminProfile);

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private
router.put('/profile', adminAuth, updateAdminProfile);

// @desc    Change admin password
// @route   PUT /api/admin/change-password
// @access  Private
router.put('/change-password', adminAuth, changeAdminPassword);

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (requires view_analytics permission)
router.get('/dashboard', adminAuth, checkPermission('view_analytics'), getDashboardStats);

// @desc    Get all products
// @route   GET /api/admin/products
// @access  Private (requires manage_products permission)
router.get('/products', adminAuth, checkPermission('manage_products'), getAllProducts);

// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (requires manage_orders permission)
router.get('/orders', adminAuth, checkPermission('manage_orders'), getAllOrders);

// @desc    Get all admins
// @route   GET /api/admin/all
// @access  Private (Super Admin only)
router.get('/all', adminAuth, checkRole(['super_admin']), getAllAdmins);

// @desc    Get all admin users for management
// @route   GET /api/admin/users
// @access  Private (requires manage_users permission)
router.get('/users', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const admins = await Admin.find({})
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .sort({ createdAt: -1 });

    res.json(admins);
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin users'
    });
  }
});

// @desc    Update admin user
// @route   PUT /api/admin/users/:id
// @access  Private (requires manage_users permission)
router.put('/users/:id', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    const { firstName, lastName, email, phone, address, role, isActive } = req.body;
    
    const admin = await Admin.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, phone, address, role, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin'
    });
  }
});

// @desc    Delete admin user
// @route   DELETE /api/admin/users/:id
// @access  Private (requires manage_users permission)
router.delete('/users/:id', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    
    // Prevent self-deletion
    if (req.params.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own admin account'
      });
    }
    
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin'
    });
  }
});

// Seller Management Routes
// @desc    Get all sellers
// @route   GET /api/admin/sellers
// @access  Private (requires manage_sellers permission)
router.get('/sellers', adminAuth, checkPermission('manage_sellers'), async (req, res) => {
  try {
    const Seller = require('../models/Seller');
    const sellers = await Seller.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        sellers,
        count: sellers.length
      }
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sellers'
    });
  }
});

//     Update 

router.put('/sellers/:id/status', adminAuth, checkPermission('manage_sellers'), async (req, res) => {
  try {
    const { status } = req.body;
    const Seller = require('../models/Seller');

    // Map frontend status to backend fields
    let updateFields = {};
    switch (status) {
      case 'active':
        updateFields = { isActive: true, verificationStatus: 'approved' };
        break;
      case 'inactive':
        updateFields = { isActive: false };
        break;
      case 'pending':
        updateFields = { isActive: true, verificationStatus: 'pending' };
        break;
      case 'suspended':
        updateFields = { isActive: false, verificationStatus: 'rejected' };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
    }

    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      data: { seller },
      message: `Seller ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating seller status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seller status'
    });
  }
});

// @desc    Delete seller
// @route   DELETE /api/admin/sellers/:id
// @access  Private (requires manage_sellers permission)
router.delete('/sellers/:id', adminAuth, checkPermission('manage_sellers'), async (req, res) => {
  try {
    const Seller = require('../models/Seller');
    
    const seller = await Seller.findByIdAndDelete(req.params.id);

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
    console.error('Error deleting seller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete seller'
    });
  }
});

// @desc    Update seller details
// @route   PUT /api/admin/sellers/:id
// @access  Private (requires manage_sellers permission)
router.put('/sellers/:id', adminAuth, checkPermission('manage_sellers'), async (req, res) => {
  try {
    const Seller = require('../models/Seller');
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      businessName,
      businessLicense,
      businessType,
      farmSize,
      cropTypes,
      verificationStatus,
      isActive
    } = req.body;

    // Check if email is already taken by another seller
    if (email) {
      const existingSeller = await Seller.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingSeller) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (businessLicense !== undefined) updateData.businessLicense = businessLicense;
    if (businessType !== undefined) updateData.businessType = businessType;
    if (farmSize !== undefined) updateData.farmSize = farmSize;
    if (cropTypes !== undefined) updateData.cropTypes = cropTypes;
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
    if (isActive !== undefined) updateData.isActive = isActive;

    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.json({
      success: true,
      data: { seller },
      message: 'Seller updated successfully'
    });
  } catch (error) {
    console.error('Error updating seller:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seller'
    });
  }
});

// Buyer Management Routes
// @desc    Get all buyers
// @route   GET /api/admin/buyers
// @access  Private (requires manage_users permission)
router.get('/buyers', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const Buyer = require('../models/Buyer');
    const buyers = await Buyer.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        buyers,
        count: buyers.length
      }
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch buyers'
    });
  }
});

// @desc    Update buyer status
// @route   PUT /api/admin/buyers/:id/status
// @access  Private (requires manage_users permission)
router.put('/buyers/:id/status', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const { status } = req.body;
    const Buyer = require('../models/Buyer');

    const buyer = await Buyer.findByIdAndUpdate(
      req.params.id,
      { isActive: status === 'active' },
      { new: true }
    ).select('-password');

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.json({
      success: true,
      data: { buyer },
      message: `Buyer ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating buyer status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update buyer status'
    });
  }
});

// @desc    Delete buyer
// @route   DELETE /api/admin/buyers/:id
// @access  Private (requires manage_users permission)
router.delete('/buyers/:id', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const Buyer = require('../models/Buyer');
    
    const buyer = await Buyer.findByIdAndDelete(req.params.id);

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
    console.error('Error deleting buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete buyer'
    });
  }
});

// @desc    Update buyer details
// @route   PUT /api/admin/buyers/:id
// @access  Private (requires manage_users permission)
router.put('/buyers/:id', adminAuth, checkPermission('manage_users'), async (req, res) => {
  try {
    const Buyer = require('../models/Buyer');
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      dateOfBirth,
      status
    } = req.body;

    // Check if email is already taken by another buyer
    if (email) {
      const existingBuyer = await Buyer.findOne({ 
        email, 
        _id: { $ne: req.params.id } 
      });
      if (existingBuyer) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (status !== undefined) updateData.status = status;

    const buyer = await Buyer.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.json({
      success: true,
      data: { buyer },
      message: 'Buyer updated successfully'
    });
  } catch (error) {
    console.error('Error updating buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update buyer'
    });
  }
});

// @desc    Update admin permissions (for existing admins)
// @route   PUT /api/admin/update-permissions
// @access  Private (Super Admin only)
router.put('/update-permissions', adminAuth, checkRole(['super_admin']), async (req, res) => {
  try {
    const Admin = require('../models/Admin');
    
    // Update all admins to have the new permission structure
    const result = await Admin.updateMany(
      { permissions: { $nin: ['manage_sellers'] } },
      { 
        $addToSet: { 
          permissions: { 
            $each: [
              'manage_sellers',
              'manage_users',
              'manage_products', 
              'manage_orders',
              'manage_settings'
            ]
          }
        }
      }
    );

    res.json({
      success: true,
      message: `Updated permissions for ${result.modifiedCount} admins`,
      data: result
    });
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update admin permissions'
    });
  }
});

// @desc    Test route to check admin authentication
// @route   GET /api/admin/test
// @access  Private
router.get('/test', adminAuth, (req, res) => {
  res.json({
    success: true,
    message: 'Admin authentication working',
    admin: req.admin
  });
});

module.exports = router;