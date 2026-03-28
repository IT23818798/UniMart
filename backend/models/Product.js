import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seller',
        required: [true, "Product must be associated with a seller"]
    },
    sellerName: {
        type: String,
        required: [true, "Seller name is required"]
    },
    name: {
        type: String,
        required: [true, "Please add a product item name"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Please add a description"]
    },
    price: {
        type: Number,
        required: [true, "Please add a price"]
    },
    category: {
        type: String,
        required: [true, "Please select a category"],
        enum: ['Breakfast', 'Lunch', 'Beverages', 'Snacks', 'Desserts']
    },
    image: {
        type: String,
        default: "no-photo.jpg"
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    prepTime: {
        type: Number,
        default: 15 // Estimated preparation time in minutes
    },
    quantity: {
        type: Number,
        default: 0 // Available quantity/stock
    }
}, { timestamps: true });

export default mongoose.model('Product', productSchema);