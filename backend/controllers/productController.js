const Product = require('../models/Product');

const normalizeRating = (rating) => {
  if (rating === undefined || rating === null || rating === '') {
    return 0;
  }

  const numericRating = Number(rating);
  if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 5) {
    return null;
  }

  return numericRating;
};

const calculateAverageRating = (reviews = []) => {
  const ratedReviews = reviews.filter((review) => Number(review.rating || 0) > 0);

  if (ratedReviews.length === 0) {
    return 0;
  }

  return ratedReviews.reduce((acc, item) => acc + Number(item.rating || 0), 0) / ratedReviews.length;
};

// Create a new product (Seller)
exports.createProduct = async (req, res) => {
  try {
    const { title, description, price, stock, category, images } = req.body;

    // Validations
    if (!title || title.trim() === '') return res.status(400).json({ success: false, message: 'Title is required' });
    if (!description || description.trim() === '') return res.status(400).json({ success: false, message: 'Description is required' });
    if (price === undefined || isNaN(price) || price <= 0) return res.status(400).json({ success: false, message: 'Valid price strictly greater than 0 is required' });
    if (stock === undefined || isNaN(stock) || stock < 0) return res.status(400).json({ success: false, message: 'Valid stock number (0 or greater) is required' });

    const product = new Product({
      seller: req.seller.id,
      title,
      description,
      price,
      stock,
      category,
      images: images || []
    });

    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get all products (Public/Buyer)
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' }).populate('seller', 'businessName firstName lastName');
    res.status(200).json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get single product details
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'businessName firstName lastName')
      .populate('reviews.user', 'firstName lastName');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Create new review
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    // Check if buyer exists in req
    if (!req.buyer || !req.buyer.id) {
      return res.status(401).json({ success: false, message: 'Not authorized to review' });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const normalizedRating = normalizeRating(rating);
    if (normalizedRating === null) {
      return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
    }

    // Removed alreadyReviewed check to allow multiple item reviews

    const review = {
      user: req.buyer.id,
      name: req.buyer.fullName || 'Anonymous Buyer',
      rating: normalizedRating,
      comment
    };

    product.reviews.push(review);

    product.numOfReviews = product.reviews.length;
    product.rating = calculateAverageRating(product.reviews);

    await product.save({ validateBeforeSave: false });

    // Repopulate product to return back with new review including user details
    const updatedProduct = await Product.findById(req.params.id)
      .populate('seller', 'businessName firstName lastName')
      .populate('reviews.user', 'firstName lastName');

    res.status(201).json({ success: true, message: 'Review added', data: updatedProduct });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// Update a product review
exports.updateProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!req.buyer || !req.buyer.id) {
       return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.user.toString() !== req.buyer.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this review' });
    }

    if (rating !== undefined && rating !== null && rating !== '') {
      const normalizedRating = normalizeRating(rating);
      if (normalizedRating === null) {
        return res.status(400).json({ success: false, message: 'Rating must be between 0 and 5' });
      }

      review.rating = normalizedRating;
    }

    if (comment) review.comment = comment;

    product.rating = calculateAverageRating(product.reviews);
    await product.save();

    const updatedProduct = await Product.findById(req.params.id)
       .populate('seller', 'businessName firstName lastName')
       .populate('reviews.user', 'firstName lastName');

    res.status(200).json({ success: true, message: 'Review updated', data: updatedProduct });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete a product review
exports.deleteProductReview = async (req, res) => {
  try {
    if (!req.buyer || !req.buyer.id) {
       return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const review = product.reviews.id(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (review.user.toString() !== req.buyer.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this review' });
    }

    // Using mongoose remove/deleteOne for subdocument
    review.deleteOne();

    product.numOfReviews = product.reviews.length;
    product.rating = calculateAverageRating(product.reviews);

    await product.save();

    const updatedProduct = await Product.findById(req.params.id)
       .populate('seller', 'businessName firstName lastName')
       .populate('reviews.user', 'firstName lastName');

    res.status(200).json({ success: true, message: 'Review deleted', data: updatedProduct });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get products for logged-in seller
exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.seller.id }).sort('-createdAt');
    res.status(200).json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('Get seller products error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update product (Seller)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Ensure the seller owns the product
    // if (product.seller.toString() !== req.seller.id.toString()) {
    //   return res.status(403).json({ success: false, message: 'Not authorized to update this product' });
    // }

    const { title, description, price, stock } = req.body;

    // Validations
    if (title !== undefined && title.trim() === '') return res.status(400).json({ success: false, message: 'Title cannot be empty' });
    if (description !== undefined && description.trim() === '') return res.status(400).json({ success: false, message: 'Description cannot be empty' });
    if (price !== undefined && (isNaN(price) || price <= 0)) return res.status(400).json({ success: false, message: 'Valid price strictly greater than 0 is required' });
    if (stock !== undefined && (isNaN(stock) || stock < 0)) return res.status(400).json({ success: false, message: 'Valid stock number (0 or greater) is required' });

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete product (Seller)
exports.deleteProduct = async (req, res) => {
  console.log('Hitting delete product for ID:', req.params.id);
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      console.log('Product not found in DB!');
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    console.log('Product deleted successfully');
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
