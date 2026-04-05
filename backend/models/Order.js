import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
    orderID: {
        type: String,
        required: true,
        unique: true
    },

    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: true
    },

    items: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Product"
            },

            sellerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Seller',
                required: true
            },

            name: {
                type: String,
                required: true
            },

            description: {
                type: String,
                required: true
            },

            price: {
                type: Number,
                required: true
            },

            category: {
                type: String,
                enum: ['Breakfast', 'Lunch', 'Beverages', 'Snacks', 'Desserts'],
                required: true
            },

            image: {
                type: String,
                default: "no-photo.jpg"
            },

            prepTime: {
                type: Number,
                default: 15
            },

            // ✅ Quantity ordered (IMPORTANT)
            quantity: {
                type: Number,
                required: true
            }
        }
    ],

    customerName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    total: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: "Pending",
        enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"]
    },

    // // ✅ Pickup time slot added
    // pickupTime: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "TimeSlot",
    //     required: true

    // },

    date: {
        type: Date,
        default: Date.now
    }

},
{ timestamps: true }
);

export default mongoose.model("Order", orderSchema);