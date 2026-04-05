const express = require('express');
const router = express.Router();
const { 
  sendMessage, 
  getConversations, 
  getMessages, 
  uploadMessageImage, 
  deleteMessage, 
  deleteConversation 
} = require('../controllers/messageController');
const { authenticateBuyer } = require('../middleware/buyerAuth');
const { authenticateSeller } = require('../middleware/sellerAuth');

// Unified middleware to check for either buyer or seller token
const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');

const authenticateAnyUser = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null;
    
    // Tokens can come from cookies or the Authorization header
    const buyerToken = req.cookies?.buyerToken || headerToken;
    const sellerToken = req.cookies?.sellerToken || headerToken;
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    // Try verifying as a Buyer
    if (buyerToken) {
      try {
        const decoded = jwt.verify(buyerToken, secret);
        const buyer = await Buyer.findById(decoded.id);
        if (buyer && buyer.isActive) {
          req.buyer = { id: buyer._id, email: buyer.email, fullName: buyer.fullName };
          return next();
        }
      } catch (err) {
        // Token might be invalid for buyer, but let's try seller below
      }
    }

    // Try verifying as a Seller
    if (sellerToken) {
      try {
        const decoded = jwt.verify(sellerToken, secret);
        const seller = await Seller.findById(decoded.id);
        if (seller && seller.isActive) {
          req.seller = { id: seller._id, email: seller.email, businessName: seller.businessName };
          return next();
        }
      } catch (err) {
        // Not a valid seller token either
      }
    }

    return res.status(401).json({
      success: false,
      message: 'Access denied. Please log in as a buyer or seller.'
    });
  } catch (error) {
    console.error('Unified Auth Error:', error);
    res.status(500).json({ success: false, message: 'Auth server error' });
  }
};

router.post('/', authenticateAnyUser, sendMessage);
router.post('/upload', authenticateAnyUser, uploadMessageImage);
router.get('/conversations', authenticateAnyUser, getConversations);
router.get('/:otherId', authenticateAnyUser, getMessages);
router.delete('/conversation/:otherId', authenticateAnyUser, deleteConversation);
router.delete('/:id', authenticateAnyUser, deleteMessage);

module.exports = router;
