import Order from "../models/order.js";
import Product from "../models/Product.js";
export function isAdmin(req) {
    return req.user && (req.user.type === "admin" || req.user.role === "admin");
}

export function isCustomer(req) {
    return req.user && (req.user.type === "customer" || req.user.type === "buyer" || req.user.role === "customer" || req.user.role === "buyer");
}

// ================= CREATE ORDER =================
// Enhanced to split multi-seller orders
export async function createOrder(req, res) {

    console.log("BODY:", req.body);
    console.log("USER:", req.user);

    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized user"
            });
        }

        // ================= CUSTOMER DETAILS =================
        let customerName = req.body.customerName || (user.firstName + " " + user.lastName);
        let phone = req.body.phone || "Not Provided";

        const itemsInRequest = req.body.items;

        if (!itemsInRequest || !Array.isArray(itemsInRequest)) {
            return res.status(400).json({
                message: "Items should be an array"
            });
        }

        // ================= VALIDATE AND PREPARE ITEMS =================
        const itemsBySellerMap = new Map(); // Map to group items by sellerId
        let totalOverall = 0;

        for (let i = 0; i < itemsInRequest.length; i++) {
            const item = itemsInRequest[i];

            const productItem = await Product.findById(item._id);

            if (!productItem) {
                return res.status(400).json({
                    message: "Product item not found",
                    _id: item._id
                });
            }

            // ✅ Check stock
            if (productItem.quantity < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${productItem.name}`,
                    availableStock: productItem.quantity
                });
            }

            // Get seller ID from product
            const sellerId = productItem.sellerId.toString();

            // Prepare item data (includes sellerId now)
            const itemData = {
                _id: productItem._id,
                sellerId: productItem.sellerId,
                name: productItem.name,
                description: productItem.description,
                price: productItem.price,
                category: productItem.category,
                image: productItem.image,
                prepTime: productItem.prepTime,
                quantity: item.quantity
            };

            // Group items by seller
            if (!itemsBySellerMap.has(sellerId)) {
                itemsBySellerMap.set(sellerId, {
                    items: [],
                    total: 0,
                    sellerId: productItem.sellerId
                });
            }

            const sellerGroup = itemsBySellerMap.get(sellerId);
            sellerGroup.items.push(itemData);
            sellerGroup.total += productItem.price * item.quantity;
            totalOverall += productItem.price * item.quantity;
        }

        // ================= CREATE SEPARATE ORDERS FOR EACH SELLER =================
        const createdOrders = [];

        for (const [sellerId, sellerGroup] of itemsBySellerMap) {
            // Generate unique order ID for each seller order
            const orderList = await Order.find().sort({ date: -1 }).limit(1);

            let newOrderID = "ODR0000001";

            if (orderList.length !== 0) {
                let lastOrderID = orderList[0].orderID;
                let lastNumber = parseInt(lastOrderID.replace("ODR", ""));
                let newNumber = lastNumber + 1;

                newOrderID = "ODR" + newNumber.toString().padStart(7, "0");
            }

            // Create order for this seller
            const newOrder = new Order({
                orderID: newOrderID,
                sellerId: sellerGroup.sellerId,
                items: sellerGroup.items,
                customerName,
                email: user.email,
                phone,
                address: req.body.address,
                total: sellerGroup.total
            });

            const savedOrder = await newOrder.save();
            createdOrders.push(savedOrder);

            // ================= REDUCE STOCK FOR SELLER'S ITEMS =================
            for (let i = 0; i < sellerGroup.items.length; i++) {
                const item = sellerGroup.items[i];

                await Product.findByIdAndUpdate(
                    item._id,
                    { $inc: { quantity: -item.quantity } }
                );
            }
        }

        res.status(201).json({
            message: createdOrders.length === 1
                ? "Order Created Successfully"
                : `Orders Created Successfully (${createdOrders.length} orders from different sellers)`,
            orders: createdOrders,
            totalValue: totalOverall,
            orderCount: createdOrders.length
        });

    } catch (err) {
        console.error("ORDER ERROR:", err.message);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

// ================= GET ORDERS =================
export async function getOrders(req, res) {

    try {
        if (isAdmin(req)) {

            const orders = await Order
                .find()
                .populate("items._id")
                .sort({ date: -1 });

            return res.json(orders);

        } else if (isCustomer(req)) {

            const user = req.user;

            const orders = await Order
                .find({ email: user.email })
                .populate("items._id")
                .sort({ date: -1 });

            return res.json(orders);

        } else {
            return res.status(403).json({
                message: "You are not authorized to view orders"
            });
        }

    } catch (err) {
        res.status(500).json({
            message: "Error fetching orders"
        });
    }
}

// ================= UPDATE ORDER STATUS =================
export async function updateOrderStatus(req, res) {

    if (!isAdmin(req)) {
        return res.status(403).json({
            message: "You are not authorized to update order status"
        });
    }

    try {
        const { orderID } = req.params;
        const { status } = req.body;

        await Order.updateOne(
            { orderID: orderID },
            { status: status }
        );

        res.json({
            message: "Order status updated successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Failed to update order status"
        });
    }
}