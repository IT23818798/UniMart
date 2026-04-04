const Message = require('../models/Message');
const Buyer = require('../models/Buyer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private (Buyer or Seller)
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, recipientType, content, productId } = req.body;
    
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

    // Find all messages where the user is either sender or recipient
    const messages = await Message.find({
      $or: [
        { sender: userId, senderType: userType },
        { recipient: userId, recipientType: userType }
      ]
    }).populate('productId', 'title price images').sort({ createdAt: -1 });

    // Group by the "other" user
    const conversationsMap = new Map();

    for (const msg of messages) {
      const isSender = msg.sender.toString() === userId.toString();
      const otherId = isSender ? msg.recipient.toString() : msg.sender.toString();
      const otherType = isSender ? msg.recipientType : msg.senderType;
      
      const key = `${otherId}-${otherType}`;

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
          unreadCount: 0 
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

    const messages = await Message.find({
      $or: [
        { sender: userId, senderType: userType, recipient: otherId, recipientType: otherType },
        { sender: otherId, senderType: otherType, recipient: userId, recipientType: userType }
      ]
    }).populate('productId').sort({ createdAt: 1 });

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
