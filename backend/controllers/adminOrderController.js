import Order from '../models/order.js';

// @desc    Get all orders (admin view)
// @route   GET /api/admin/orders
export const getAdminOrders = async (req, res) => {
    try {
        const { sellerId, status, startDate, endDate } = req.query;
        let query = {};

        if (sellerId) query.sellerId = sellerId;
        if (status) query.status = status;

        // Date range filtering
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const orders = await Order.find(query)
            .populate('sellerId', 'businessName firstName lastName email')
            .populate('items._id')
            .sort({ date: -1 });

        // Calculate summary stats
        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
            statusBreakdown: {
                pending: orders.filter(o => o.status === 'Pending').length,
                preparing: orders.filter(o => o.status === 'Preparing').length,
                ready: orders.filter(o => o.status === 'Ready').length,
                completed: orders.filter(o => o.status === 'Completed').length,
                cancelled: orders.filter(o => o.status === 'Cancelled').length
            }
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

// @desc    Get order by ID (admin view)
// @route   GET /api/admin/orders/:orderId
export const getAdminOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('sellerId', 'businessName firstName lastName email')
            .populate('items._id');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Update order status (admin)
// @route   PUT /api/admin/orders/:orderId/status
export const updateAdminOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: Pending, Preparing, Ready, Completed, Cancelled'
            });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status },
            { new: true, runValidators: true }
        ).populate('sellerId', 'businessName firstName lastName');

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            data: order
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Delete order (admin)
// @route   DELETE /api/admin/orders/:orderId
export const deleteAdminOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Note: In a real app, handle refunds and stock restoration
        // For now, just soft-delete or mark as cancelled
        order.status = 'Cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled and marked for deletion"
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// @desc    Get order statistics
// @route   GET /api/admin/orders/stats/summary
export const getOrderStats = async (req, res) => {
    try {
        const orders = await Order.find();

        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
            averageOrderValue: orders.length > 0
                ? (orders.reduce((sum, o) => sum + o.total, 0) / orders.length).toFixed(2)
                : 0,
            statusBreakdown: {
                pending: orders.filter(o => o.status === 'Pending').length,
                preparing: orders.filter(o => o.status === 'Preparing').length,
                ready: orders.filter(o => o.status === 'Ready').length,
                completed: orders.filter(o => o.status === 'Completed').length,
                cancelled: orders.filter(o => o.status === 'Cancelled').length
            },
            revenueByStatus: {
                completed: orders
                    .filter(o => o.status === 'Completed')
                    .reduce((sum, o) => sum + o.total, 0),
                pending: orders
                    .filter(o => o.status === 'Pending')
                    .reduce((sum, o) => sum + o.total, 0)
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Get revenue by seller
// @route   GET /api/admin/orders/stats/revenue-by-seller
export const getRevenueBySellerStats = async (req, res) => {
    try {
        const revenueData = await Order.aggregate([
            {
                $match: { status: 'Completed' }
            },
            {
                $group: {
                    _id: '$sellerId',
                    totalRevenue: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' }
                }
            },
            {
                $lookup: {
                    from: 'sellers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'sellerInfo'
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: revenueData
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
