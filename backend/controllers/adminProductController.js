import Product from '../models/Product.js';
import Seller from '../models/Seller.js';

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

// @desc    Get all products (admin view - all sellers)
// @route   GET /api/admin/products
export const getAdminProducts = async (req, res) => {
    try {
        const { sellerId, category, status } = req.query;
        let query = {};

        if (sellerId) query.sellerId = sellerId;
        if (category) query.category = category;
        if (status === 'available') query.isAvailable = true;
        if (status === 'unavailable') query.isAvailable = false;

        const products = await Product.find(query)
            .populate('sellerId', 'businessName firstName lastName email')
            .sort({ createdAt: -1 });

        // Add seller info inline
        const productsWithSeller = products.map(p => ({
            ...p.toObject(),
            sellerInfo: p.sellerId
        }));

        res.status(200).json({
            success: true,
            count: products.length,
            data: productsWithSeller
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get product by ID (admin view)
// @route   GET /api/admin/products/:id
export const getAdminProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('sellerId', 'businessName firstName lastName email');

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, data: product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Create product as admin
// @route   POST /api/admin/products
export const createAdminProduct = async (req, res) => {
    try {
        const { sellerId } = req.body;

        // Validate seller ID is provided
        if (!sellerId) {
            return res.status(400).json({
                success: false,
                message: "Seller ID is required"
            });
        }

        // Verify seller exists
        const seller = await Seller.findById(sellerId);
        if (!seller) {
            return res.status(404).json({
                success: false,
                message: "Seller not found"
            });
        }

        // Validate product data
        const validationErrors = validateProductData(req.body);
        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: validationErrors
            });
        }

        // Create product
        const productData = {
            ...req.body,
            sellerId,
            sellerName: seller.businessName || `${seller.firstName} ${seller.lastName}`
        };

        const product = await Product.create(productData);

        res.status(201).json({
            success: true,
            message: "Product created by admin",
            data: product
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Update any product (admin)
// @route   PUT /api/admin/products/:id
export const updateAdminProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Validate product data (if provided)
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

        // Prevent changing seller unless seller exists
        if (req.body.sellerId && req.body.sellerId !== product.sellerId.toString()) {
            const newSeller = await Seller.findById(req.body.sellerId);
            if (!newSeller) {
                return res.status(404).json({
                    success: false,
                    message: "New seller not found"
                });
            }
            req.body.sellerName = newSeller.businessName || `${newSeller.firstName} ${newSeller.lastName}`;
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('sellerId', 'businessName firstName lastName email');

        res.status(200).json({
            success: true,
            message: "Product updated by admin",
            data: updatedProduct
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete any product (admin)
// @route   DELETE /api/admin/products/:id
export const deleteAdminProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        await Product.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Product deleted by admin"
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get product statistics by seller
// @route   GET /api/admin/products/stats/by-seller
export const getProductStatsBySeller = async (req, res) => {
    try {
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: '$sellerId',
                    sellerName: { $first: '$sellerName' },
                    totalProducts: { $sum: 1 },
                    averagePrice: { $avg: '$price' },
                    totalStock: { $sum: '$quantity' },
                    availableProducts: { $sum: { $cond: ['$isAvailable', 1, 0] } }
                }
            },
            { $sort: { totalProducts: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
