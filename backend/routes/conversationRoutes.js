const express = require("express");
const multer = require("multer");
const {
  getConversation,
  sendMessage,
  getUserConversations,
  getConversationsForReceiver,
  checkConversationExists,
  deleteConversation,
} = require("../controllers/conversationController");

const router = express.Router();
router.get('/check/:senderId/:receiverId', checkConversationExists);

router.get("/receiver/:receiverId", getConversationsForReceiver);

// ✅ Get all conversations of a user (⚠ FIXED: Added "/user" prefix to prevent conflicts)
router.get("/user/:userId", getUserConversations);

// ✅ Get conversation between two users
router.get("/:senderId/:receiverId", getConversation);

router.delete("/:conversationId", deleteConversation);

// ✅ Send a message
// 📂 Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// 📩 Send Message with Optional File
router.post("/send", upload.single("file"), sendMessage);

module.exports = router;
