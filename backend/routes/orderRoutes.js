const express = require('express');
const router = express.Router();
const {
  createOrder,
  getBuyerOrders,
  getSellerOrders,
  updateOrderStatus,
  deleteOrderSeller,
  deleteOrderBuyer,
  updateOrderStatusBuyer,
  updateOrderBuyer
} = require('../controllers/orderController');

// Middlewares
const { authenticateBuyer, requireEmailVerification } = require('../middleware/buyerAuth');
const { authenticateSeller } = require('../middleware/sellerAuth');

// --- Buyer Routes ---
// Buyers can create orders and view their own orders
router.post('/buyer', authenticateBuyer, requireEmailVerification, createOrder);
router.get('/buyer', authenticateBuyer, getBuyerOrders);
router.put('/buyer/:id/status', authenticateBuyer, updateOrderStatusBuyer);
router.put('/buyer/:id', authenticateBuyer, updateOrderBuyer);
router.delete('/buyer/:id', authenticateBuyer, deleteOrderBuyer);

// --- Seller Routes ---
// Sellers can view orders placed to them and update their statuses
router.get('/seller', authenticateSeller, getSellerOrders);
router.put('/seller/:id/status', authenticateSeller, updateOrderStatus);
router.delete('/seller/:id', authenticateSeller, deleteOrderSeller);

module.exports = router;
