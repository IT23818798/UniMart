const Message = require("../models/Message");
const mongoose = require("mongoose");
// CREATE message
exports.createMessage = async (req, res) => {
    try {
        console.log("Request Body:", req.body); 
        
        const message = new Message(req.body);
        await message.save();
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json(err);
    }
};

// GET all messages
exports.getAllMessages = async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
};

// GET message by ID
exports.getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id)
            .select("itemId senderId message createdAt"); 
            // 👆 meka use karala display karanna oni fields witharai ganna puluwan

        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        res.json(message);
    } catch (err) {
        res.status(500).json(err);
    }
};

// UPDATE
exports.updateMessage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Message ID" });
        }

        const updatedMessage = await Message.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!updatedMessage) {
            return res.status(404).json({ message: "Message not found" });
        }

        res.json(updatedMessage);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE message
exports.deleteMessage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid Message ID" });
        }

        const deletedMessage = await Message.findByIdAndDelete(req.params.id);

        if (!deletedMessage) {
            return res.status(404).json({ message: "Message not found" });
        }

        res.json({ message: "Message deleted successfully" });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};