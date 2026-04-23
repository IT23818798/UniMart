const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getSellerProducts,
  updateProduct,
  deleteProduct,
  getProductById,
  createProductReview,
  getProductThumbnail
} = require('../controllers/productController');

// Middlewares
const { authenticateSeller, requireVerifiedSeller } = require('../middleware/sellerAuth');
const { authenticateBuyer } = require('../middleware/buyerAuth');

// Public / Buyer Routes
router.get('/', getAllProducts);

// Seller Routes
router.use('/seller', authenticateSeller);

router.post('/seller', requireVerifiedSeller, createProduct);
router.get('/seller', getSellerProducts);
router.put('/seller/:id', requireVerifiedSeller, updateProduct);
router.delete('/seller/:id', requireVerifiedSeller, deleteProduct);

// Dynamic /:id Routes (must be below /seller routes so they don't capture 'seller')
router.get('/:id/thumbnail', getProductThumbnail);
router.get('/:id', getProductById);
router.post('/:id/reviews', authenticateBuyer, createProductReview);
const { updateProductReview, deleteProductReview } = require('../controllers/productController');
router.put('/:id/reviews/:reviewId', authenticateBuyer, updateProductReview);
router.delete('/:id/reviews/:reviewId', authenticateBuyer, deleteProductReview);

module.exports = router;
