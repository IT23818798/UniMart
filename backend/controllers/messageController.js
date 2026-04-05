const Message = require('../models/Message');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Multer Config for Message Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/messages';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `msg-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Images only (jpeg, jpg, png, webp)'));
  }
}).single('image');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private (Buyer or Seller)
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, recipientType, content, productId, imageUrl, repliedTo } = req.body;
    
    // Identify sender from request (attached by middleware)
    const senderId = req.buyer?.id || req.seller?.id;
    const senderType = req.buyer ? 'Buyer' : 'Seller';

    if (!senderId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const message = await Message.create({
      sender: senderId,
      senderType,
      recipient: recipientId,
      recipientType,
      content,
      imageUrl: imageUrl || null,
      repliedTo: repliedTo || null,
      productId: productId || null
    });

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get all conversations for the current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const userId = req.buyer?.id || req.seller?.id;
    const userType = req.buyer ? 'Buyer' : 'Seller';

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    // Find all messages where the user is either sender or recipient and not deleted
    const messages = await Message.find({
      $or: [
        { sender: userId, senderType: userType, senderDeleted: false },
        { recipient: userId, recipientType: userType, recipientDeleted: false }
      ]
    }).populate('productId', 'title price images').sort({ createdAt: -1 });

    // Group by the "other" user
    const conversationsMap = new Map();

    for (const msg of messages) {
      const isSender = msg.sender.toString() === userId.toString();
      const otherId = isSender ? msg.recipient.toString() : msg.sender.toString();
      const otherType = isSender ? msg.recipientType : msg.senderType;
      
      const pId = msg.productId?._id?.toString() || msg.productId?.toString();
      const key = `${otherId}-${otherType}-${pId || 'general'}`;

      if (!conversationsMap.has(key)) {
        // Fetch other user details (basic info only)
        let otherUser = null;
        try {
          if (otherType === 'Buyer') {
            otherUser = await Buyer.findById(otherId).select('firstName lastName profileImage');
          } else {
            otherUser = await Seller.findById(otherId).select('businessName profileImage');
          }
        } catch (err) {
          console.error(`Error fetching user ${otherId}:`, err);
        }

        const name = otherType === 'Buyer' 
          ? (otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown Buyer')
          : (otherUser ? otherUser.businessName : 'Unknown Seller');

        conversationsMap.set(key, {
          otherUser: {
            id: otherId,
            type: otherType,
            name: name,
            profileImage: otherUser?.profileImage || null
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            senderType: msg.senderType,
            isRead: msg.isRead,
            product: msg.productId
          },
          unreadCount: 0,
          productId: msg.productId?._id || msg.productId
        });
      }

      // Count unread messages (where current user is recipient and isRead is false)
      if (!isSender && !msg.isRead) {
        const conv = conversationsMap.get(key);
        conv.unreadCount++;
      }
    }

    res.status(200).json({
      success: true,
      data: Array.from(conversationsMap.values())
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/messages/:otherId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const userId = req.buyer?.id || req.seller?.id;
    const userType = req.buyer ? 'Buyer' : 'Seller';
    const { otherId } = req.params;
    const { otherType } = req.query; // Need to know if other user is Buyer or Seller

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const { productId } = req.query;
    const query = {
      $and: [
        {
          $or: [
            { sender: userId, senderType: userType, recipient: otherId, recipientType: otherType, senderDeleted: false },
            { sender: otherId, senderType: otherType, recipient: userId, recipientType: userType, recipientDeleted: false }
          ]
        }
      ]
    };

    // STRICT PRODUCT ISOLATION
    // If productId is provided (hex id), filter strictly.
    // If not provided (or 'null'/'general'), only show non-product messages.
    if (productId && productId !== 'undefined' && productId !== 'null' && productId !== 'general' && productId !== '[object Object]') {
      query.productId = productId;
    } else {
      // Find only messages with NO product ID (General Chat)
      query.productId = { $eq: null };
    }

    const messages = await Message.find(query).populate('productId').populate('repliedTo').sort({ createdAt: 1 });

    // Fetch other user info
    let otherUser = null;
    let otherUserName = 'User';
    
    if (otherType === 'Buyer') {
      otherUser = await Buyer.findById(otherId).select('firstName lastName profileImage');
      if (otherUser) {
        otherUserName = `${otherUser.firstName} ${otherUser.lastName}`.trim() || 'Buyer';
      }
    } else {
      otherUser = await Seller.findById(otherId).select('businessName profileImage');
      if (otherUser) {
        otherUserName = otherUser.businessName || 'Seller';
      }
    }

    const otherUserInfo = {
      id: otherId,
      type: otherType,
      name: otherUserName,
      profileImage: otherUser?.profileImage
    };

    // Mark as read
    await Message.updateMany(
      { recipient: userId, recipientType: userType, sender: otherId, senderType: otherType, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      currentUserId: userId,
      currentUserType: userType,
      otherUser: otherUserInfo,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Upload message image
// @route   POST /api/messages/upload
// @access  Private
exports.uploadMessageImage = (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Check file size again just in case (Multer handles it but good to be sure)
    const stats = fs.statSync(req.file.path);
    const fileSizeInBytes = stats.size;
    if (fileSizeInBytes > 2 * 1024 * 1024) {
        // Multer should have caught this.
    }

    res.status(200).json({
      success: true,
      url: `${req.protocol}://${req.get('host')}/uploads/messages/${req.file.filename}`
    });
  });
};

// @desc    Delete a single message for user
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.buyer?.id || req.seller?.id;
    const { id } = req.params;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ success: false, message: 'Message not found' });

    const myId = String(userId);
    const senderId = String(message.sender);
    const recipientId = String(message.recipient);

    if (senderId === myId) {
      // Unsend for both sides (Sender is deleting their own message)
      message.isUnsent = true;
      message.content = '';
      message.imageUrl = null;
    } else if (recipientId === myId) {
      // Delete only for recipient (Recipient is hiding a message they received)
      message.recipientDeleted = true;
    } else {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await message.save();
    res.status(200).json({ success: true, message: message.isUnsent ? 'Message unsent' : 'Message deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Delete conversation for user
// @route   DELETE /api/messages/conversation/:otherId
// @access  Private
exports.deleteConversation = async (req, res) => {
  try {
    const userId = req.buyer?.id || req.seller?.id;
    const userType = req.buyer ? 'Buyer' : 'Seller';
    const { otherId } = req.params;
    const { otherType, productId } = req.query;

    const query = {
      $or: [
        { sender: userId, recipient: otherId },
        { sender: otherId, recipient: userId }
      ]
    };
    
    // Add product isolation if productId exists
    if (productId && productId !== 'undefined' && productId !== 'null') {
      query.productId = productId;
    }

    // Delete as sender
    await Message.updateMany(
      { ...query, sender: userId },
      { $set: { senderDeleted: true } }
    );

    // Delete as recipient
    await Message.updateMany(
      { ...query, recipient: userId },
      { $set: { recipientDeleted: true } }
    );

    res.status(200).json({ success: true, message: 'Conversation deleted from your side' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
