// Controller/chatController.js
const Chat = require('../Models/Chat');
const User = require('../Models/Users');

const mongoose = require('mongoose');

// Get all chat participants for the current user (only patients who have chatted with doctor)
exports.getDoctorChatParticipants = async (req, res) => {
  try {
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    // Find all unique users who have chatted with the current user
    const chatParticipants = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', new mongoose.Types.ObjectId(currentUserId)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessageTime: { $max: '$createdAt' }
        }
      },
      { $sort: { lastMessageTime: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $lookup: {
          from: 'chats',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$sender', '$$userId'] },
                    { $eq: ['$receiver', new mongoose.Types.ObjectId(currentUserId)] },
                    { $eq: ['$read', false] }
                  ]
                }
              }
            },
            { $count: 'unreadCount' }
          ],
          as: 'unreadInfo'
        }
      },
      {
        $project: {
          _id: 1,
          name: '$userInfo.name',
          role: '$userInfo.role',
          email: '$userInfo.email',
          lastMessageTime: 1,
          unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadInfo.unreadCount', 0] }, 0] }
        }
      }
    ]);

    res.status(200).json({
      participants: chatParticipants,
      count: chatParticipants.length
    });
  } catch (err) {
    console.error('❌ Error fetching chat participants:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get chat history between current user and another user
exports.getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const otherUserId = req.params.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    if (!otherUserId) {
      return res.status(400).json({ message: 'Other user ID is required' });
    }

    // Verify both users exist
    const [currentUser, otherUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(otherUserId)
    ]);

    if (!currentUser || !otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get decrypted messages
    const messages = await Chat.getDecryptedMessages(currentUserId, otherUserId);

    res.status(200).json({
      messages,
      participants: {
        currentUser: { id: currentUser._id, name: currentUser.name, role: currentUser.role },
        otherUser: { id: otherUser._id, name: otherUser.name, role: otherUser.role }
      }
    });
  } catch (err) {
    console.error('❌ Error fetching chat history:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user?.id;
    const { receiverId, message, messageType = 'text' } = req.body;

    if (!senderId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    if (!receiverId || !message) {
      return res.status(400).json({ message: 'Receiver ID and message are required' });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    // Verify both users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create new chat message
    const newMessage = new Chat({
      sender: senderId,
      receiver: receiverId,
      message: message.trim(),
      messageType
    });

    await newMessage.save();

    // Populate sender info for response
    await newMessage.populate('sender', 'name role');
    await newMessage.populate('receiver', 'name role');

    // Return decrypted message
    const responseMessage = {
      ...newMessage.toObject(),
      message: newMessage.decryptMessage()
    };

    res.status(201).json({
      message: 'Message sent successfully',
      chatMessage: responseMessage
    });
  } catch (err) {
    console.error('❌ Error sending message:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const senderId = req.params.userId;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID' });
    }

    // Mark all messages from senderId to currentUserId as read
    const result = await Chat.updateMany(
      {
        sender: senderId,
        receiver: currentUserId,
        read: false
      },
      { read: true }
    );

    res.status(200).json({
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('❌ Error marking messages as read:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};