const Order = require('../models/Order');
const Product = require('../models/Product');
const Buyer = require('../models/Buyer');
const PointTransaction = require('../models/PointTransaction');

// Create a new order (Buyer)
exports.createOrder = async (req, res) => {
  try {
    const { orderItems, contactPhone, paymentMethod = 'card', pointsUsed = 0 } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items provided' });
    }

    if (!contactPhone || contactPhone.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid contact phone number (at least 10 digits).' });
    }

    // Validate products and calculate total
    let totalAmount = 0;
    let sellerId = null;

    for (let item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }

      // Check stock
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for product: ${product.title}` });
      }

      // Ensure all items are from same seller for simple MVP order logic
      if (!sellerId) {
        sellerId = product.seller;
      } else if (sellerId.toString() !== product.seller.toString()) {
        return res.status(400).json({ success: false, message: 'Cart contains items from multiple sellers. Please order separately.' });
      }

      totalAmount += product.price * item.quantity;

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    const buyer = await Buyer.findById(req.buyer.id);
    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Buyer not found' });
    }

    // --- POINTS LOGIC ---
    // 1. Calculate Earnings (Always 10% of total product price)
    const pointsEarned = Math.floor(totalAmount * 0.10);
    
    // 2. Validate Redemption (If using points)
    const currentPoints = buyer.purchaseStats?.loyaltyPoints || 0;
    if (pointsUsed > 0) {
      if (currentPoints < pointsUsed) {
        return res.status(400).json({ success: false, message: `Insufficient Star Points. You have ${currentPoints} pts but tried to use ${pointsUsed} pts.` });
      }
      if (pointsUsed > totalAmount) {
        return res.status(400).json({ success: false, message: `Cannot use more points (${pointsUsed}) than the order total (Rs ${totalAmount}).` });
      }
    }

    // 3. Determine final Payment Method string for history
    let finalPaymentMethod = paymentMethod;
    if (pointsUsed > 0 && pointsUsed < totalAmount) {
      finalPaymentMethod = 'split';
    } else if (pointsUsed >= totalAmount) {
      finalPaymentMethod = 'points';
    }

    // 4. Update Buyer Balance & Stats
    const newPointsBalance = Math.max(0, currentPoints - pointsUsed + pointsEarned);
    const newTotalOrders = (buyer.purchaseStats?.totalOrders || 0) + 1;
    const newTotalSpent = (buyer.purchaseStats?.totalSpent || 0) + totalAmount;

    await Buyer.findByIdAndUpdate(
      req.buyer.id,
      { 
        $set: { 
          'purchaseStats.loyaltyPoints': newPointsBalance,
          'purchaseStats.totalOrders': newTotalOrders,
          'purchaseStats.totalSpent': newTotalSpent,
          'purchaseStats.lastOrderDate': new Date()
        } 
      },
      { new: true }
    );

    // 5. Create Order Record
    const order = new Order({
      buyer: req.buyer.id,
      seller: sellerId,
      orderItems,
      totalAmount,
      contactPhone,
      paymentMethod: finalPaymentMethod,
      pointsEarned,
      pointsUsed,
      deliveryMethod: 'pickup'
    });

    await order.save();

    // 6. RECORD TRANSACTIONS IN LEDGER (Atomic for consistency)
    // Spend Transaction
    if (pointsUsed > 0) {
        await PointTransaction.create({
            buyer: buyer._id,
            amount: -pointsUsed,
            type: 'redeem',
            description: `Used for Order #${order._id.toString().substring(0,8)}`,
            order: order._id
        });
    }
    // Earn Transaction
    if (pointsEarned > 0) {
        await PointTransaction.create({
            buyer: buyer._id,
            amount: pointsEarned,
            type: 'earn',
            description: `Earned from Order #${order._id.toString().substring(0,8)} (10% Rate)`,
            order: order._id
        });
    }

    console.log(`[Ledger] Order ${order._id}: Spent ${pointsUsed}, Earned ${pointsEarned}. New Balance: ${newPointsBalance}`);

    // Populate product details for response
    await order.populate('orderItems.product', 'title category images');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


// Get logged in buyer's orders (Buyer)
exports.getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.buyer.id })
      .populate('seller', 'businessName')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get orders related to a seller (Seller)
exports.getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.seller.id })
      .populate('buyer', 'firstName lastName email')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    console.error('Get seller orders error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update order status (Seller)
exports.updateOrderStatus = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.seller.toString() !== req.seller.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    const validStatuses = ['pending', 'cancelled', 'done'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    order.orderStatus = req.body.status;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete order (Seller)
exports.deleteOrderSeller = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, seller: req.seller.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete order seller error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete order (Buyer)
exports.deleteOrderBuyer = async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id, buyer: req.buyer.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    console.error('Delete order buyer error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update order status (Buyer)
exports.updateOrderStatusBuyer = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.buyer.toString() !== req.buyer.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    const validStatuses = ['pending', 'cancelled', 'done'];
    if (!validStatuses.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    order.orderStatus = req.body.status;
    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Update order status buyer error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update order details (Buyer) - Allows updating shipping address for pending orders
exports.updateOrderBuyer = async (req, res) => {
  try {
    let order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.buyer.toString() !== req.buyer.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this order' });
    }

    let modified = false;

    // Update contactPhone if provided
    if (req.body.contactPhone) {
      if (req.body.contactPhone.trim().length < 10) {
        return res.status(400).json({ success: false, message: 'Valid phone number is required (at least 10 digits)' });
      }
      order.contactPhone = req.body.contactPhone;
      modified = true;
    }

    // Update quantity if provided
    if (req.body.quantity !== undefined) {
      const newQuantity = parseInt(req.body.quantity);
      if (isNaN(newQuantity) || newQuantity < 1) {
        return res.status(400).json({ success: false, message: 'Valid quantity minimum is 1' });
      }

      if (order.orderItems && order.orderItems.length > 0) {
        const oldQuantity = order.orderItems[0].quantity;
        const difference = newQuantity - oldQuantity;

        if (difference !== 0) {
          const product = await Product.findById(order.orderItems[0].product);
          if (!product) {
            return res.status(404).json({ success: false, message: 'Original product not found' });
          }

          if (difference > 0 && product.stock < difference) {
            return res.status(400).json({ success: false, message: 'Insufficient stock to increase quantity' });
          }

          product.stock -= difference;
          await product.save();

          order.orderItems[0].quantity = newQuantity;
          order.totalAmount += difference * order.orderItems[0].price;
          modified = true;
        }
      }
    }

    if (modified) {
      await order.save();
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Update order details buyer error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
