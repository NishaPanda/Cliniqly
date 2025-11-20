// models/Chat.js
const mongoose = require("mongoose");
const CryptoJS = require("crypto-js");

// Encryption key (in production, this should be in environment variables)
const ENCRYPTION_KEY = process.env.CHAT_ENCRYPTION_KEY || "default-chat-key-2024";

const chatSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isEncrypted: { type: Boolean, default: true },
    read: { type: Boolean, default: false },
    messageType: { type: String, enum: ["text", "system"], default: "text" }
  },
  { timestamps: true }
);

// Encrypt message before saving
chatSchema.pre('save', function(next) {
  if (this.isEncrypted && this.message) {
    try {
      this.message = CryptoJS.AES.encrypt(this.message, ENCRYPTION_KEY).toString();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Decrypt message when retrieving
chatSchema.methods.decryptMessage = function() {
  if (this.isEncrypted && this.message) {
    try {
      const bytes = CryptoJS.AES.decrypt(this.message, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted message]';
    }
  }
  return this.message;
};

// Static method to get decrypted messages between two users
chatSchema.statics.getDecryptedMessages = async function(user1Id, user2Id, limit = 50) {
  const messages = await this.find({
    $or: [
      { sender: user1Id, receiver: user2Id },
      { sender: user2Id, receiver: user1Id }
    ]
  })
  .sort({ createdAt: 1 })
  .limit(limit)
  .populate('sender', 'name role')
  .populate('receiver', 'name role');

  return messages.map(msg => ({
    ...msg.toObject(),
    message: msg.decryptMessage()
  }));
};

const Chat = mongoose.model("Chat", chatSchema);
module.exports = Chat;