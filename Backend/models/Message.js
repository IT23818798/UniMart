const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    itemId: { type: String, required: true },//data type & validate
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    message: { type: String },
    fileUrl: { type: String },
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);//file name & funtion name