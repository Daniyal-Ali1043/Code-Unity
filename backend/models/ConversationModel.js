const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String, // Store image URLs (cloud storage/local)
      default: null,
    },
    videoUrl: {
      type: String, // Store video URLs (cloud storage/local)
      default: null,
    },
    fileUrl: {
      type: String, // New field for file attachments (PDFs, Word, etc.)
      default: null,
    },
    meetingLink: {
      type: String, // New field for Zoom meeting links
      default: null,
    },
    isMeetingLink: {
      type: Boolean, // To differentiate between regular messages and meeting links
      default: false,
    },
    isHTML: {
      type: Boolean, // New field to identify HTML content for rendering
      default: false,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    msgByUserId: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
  },
  {
    timestamps: true, // Automatically manages createdAt & updatedAt
  }
);

const conversationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    receiver: {
      type: mongoose.Schema.ObjectId,
      required: true,
      ref: "User",
    },
    messages: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Message",
      },
    ],
  },
  {
    timestamps: true, // Automatically manages createdAt & updatedAt
  }
);

const MessageModel = mongoose.model("Message", messageSchema);
const ConversationModel = mongoose.model("Conversation", conversationSchema);

module.exports = {
  MessageModel,
  ConversationModel,
};