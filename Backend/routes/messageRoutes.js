const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const messageController = require("../controllers/messageController");

// CREATE message
router.post("/", async (req, res) => {
    try {
        const message = new Message(req.body);
        await message.save();
        res.status(201).json(message);
    } catch (err) {
        res.status(500).json(err);
    }
});

// GET all messages
router.get("/", async (req, res) => {
    try {
        const messages = await Message.find();
        res.json(messages);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/:id", messageController.getMessageById);
router.put("/:id", messageController.updateMessage);   //  UPDATE
router.delete("/:id", messageController.deleteMessage);//delete
module.exports = router;