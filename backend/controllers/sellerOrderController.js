import Order from '../models/order.js';
import Product from '../models/Product.js';

// @desc    Get all orders for seller's products
// @route   GET /api/seller/orders
export const getSellerOrders = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Find all orders where this seller owns any of the items
        const orders = await Order.find({ sellerId })
            .sort({ date: -1 })
            .populate('items._id');

        // Add order count stats
        const stats = {
            totalOrders: orders.length,
            pendingOrders: orders.filter(o => o.status === 'Pending').length,
            preparingOrders: orders.filter(o => o.status === 'Preparing').length,
            readyOrders: orders.filter(o => o.status === 'Ready').length,
            completedOrders: orders.filter(o => o.status === 'Completed').length
        };

        res.status(200).json({
            success: true,
            stats,
            count: orders.length,
            data: orders
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get seller's order by ID
// @route   GET /api/seller/orders/:orderId
export const getSellerOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId).populate('items._id');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Verify seller owns this order
        if (order.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to access this order"
            });
        }

        res.status(200).json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update seller's order status
// @route   PUT /api/seller/orders/:orderId/status
export const updateSellerOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: Pending, Preparing, Ready, Completed, Cancelled'
            });
        }

        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Verify seller owns this order
        if (order.sellerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this order"
            });
        }

        order.status = status;
        await order.save();

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get seller's order statistics
// @route   GET /api/seller/orders/stats/summary
export const getSellerOrderStats = async (req, res) => {
    try {
        const sellerId = req.user._id;

        const orders = await Order.find({ sellerId });

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const stats = {
            totalOrders: orders.length,
            totalRevenue,
            averageOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
            statusBreakdown: {
                pending: orders.filter(o => o.status === 'Pending').length,
                preparing: orders.filter(o => o.status === 'Preparing').length,
                ready: orders.filter(o => o.status === 'Ready').length,
                completed: orders.filter(o => o.status === 'Completed').length,
                cancelled: orders.filter(o => o.status === 'Cancelled').length
            },
            recentOrders: orders.slice(0, 5)
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
