const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    itemId: { type: String, required: true },
    buyerId: { type: String, required: true },
    sellerId: { type: String, required: true },
    status: {
        type: String,
        enum: ["Pending", "Reserved", "Completed", "Cancelled"],
        default: "Pending"
    },
    paymentMethod: {
        type: String,
        enum: ["Cash", "Bank Transfer"]
    }
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);