import Product from '../models/Product.js';

// Validation function
const validateProductData = (data) => {
    const errors = {};

    // Name validation
    if (!data.name || data.name.trim() === "") {
        errors.name = "Food name is required";
    } else if (data.name.trim().length < 2) {
        errors.name = "Food name must be at least 2 characters";
    } else if (data.name.trim().length > 50) {
        errors.name = "Food name must not exceed 50 characters";
    }

    // Description validation
    if (!data.description || data.description.trim() === "") {
        errors.description = "Description is required";
    } else if (data.description.trim().length < 10) {
        errors.description = "Description must be at least 10 characters";
    } else if (data.description.trim().length > 500) {
        errors.description = "Description must not exceed 500 characters";
    }

    // Price validation
    if (data.price === undefined || data.price === null || data.price === "") {
        errors.price = "Price is required";
    } else if (Number(data.price) <= 0) {
        errors.price = "Price must be greater than 0";
    } else if (isNaN(Number(data.price))) {
        errors.price = "Price must be a valid number";
    }

    // Category validation
    if (!data.category || data.category.trim() === "") {
        errors.category = "Category is required";
    } else {
        const validCategories = ['Breakfast', 'Lunch', 'Beverages', 'Snacks', 'Desserts'];
        if (!validCategories.includes(data.category)) {
            errors.category = "Invalid category selected";
        }
    }

    // Prep time validation
    if (data.prepTime !== undefined && data.prepTime !== null) {
        if (Number(data.prepTime) < 0) {
            errors.prepTime = "Prep time cannot be negative";
        } else if (!Number.isInteger(Number(data.prepTime))) {
            errors.prepTime = "Prep time must be a whole number";
        }
    }

    // Quantity validation
    if (data.quantity !== undefined && data.quantity !== null) {
        if (Number(data.quantity) < 0) {
            errors.quantity = "Quantity cannot be negative";
        } else if (!Number.isInteger(Number(data.quantity))) {
            errors.quantity = "Quantity must be a whole number";
        }
    }

    return errors;
};

// @desc    Get seller's products only
// @route   GET /api/seller/products
export const getSellerProducts = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const products = await Product.find({ sellerId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get seller's product by ID
// @route   GET /api/seller/products/:id
export const getSellerProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Verify seller owns this product
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to access this product"
            });
        }

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create product (seller-owned)
// @route   POST /api/seller/products
export const createSellerProduct = async (req, res) => {
    try {
        // Validate request data
        const validationErrors = validateProductData(req.body);

        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Add seller ID and seller name to product
        const productData = {
            ...req.body,
            sellerId: req.user._id,
            sellerName: req.user.businessName || req.user.firstName + ' ' + req.user.lastName
        };

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update seller's product
// @route   PUT /api/seller/products/:id
export const updateSellerProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Verify seller owns this product
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this product"
            });
        }

        // Validate request data (only if provided)
        if (req.body.name || req.body.description || req.body.price || req.body.category) {
            const validationErrors = validateProductData({
                name: req.body.name || product.name,
                description: req.body.description || product.description,
                price: req.body.price !== undefined ? req.body.price : product.price,
                category: req.body.category || product.category,
                prepTime: req.body.prepTime !== undefined ? req.body.prepTime : product.prepTime,
                quantity: req.body.quantity !== undefined ? req.body.quantity : product.quantity
            });

            if (Object.keys(validationErrors).length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: validationErrors
                });
            }
        }

        // Prevent modification of sellerId
        if (req.body.sellerId || req.body.sellerName) {
            return res.status(400).json({
                success: false,
                message: "Cannot modify seller information"
            });
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete seller's product
// @route   DELETE /api/seller/products/:id
export const deleteSellerProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Verify seller owns this product
        if (product.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this product"
            });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product deleted successfully"
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};
