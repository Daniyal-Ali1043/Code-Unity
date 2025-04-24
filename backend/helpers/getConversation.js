const Conversation = require("../models/ConversationModel");

exports.getConversations = async (req, res) => {
    try {
        // ✅ Ensure the authenticated user ID is available
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized. User ID not found." });
        }

        console.log("📥 Fetching conversations for user:", req.user.id);

        // ✅ Find conversations where the user is either the sender or receiver
        const conversations = await Conversation.find({
            $or: [{ sender: req.user.id }, { receiver: req.user.id }],
        }).populate("sender receiver", "username alias");

        res.status(200).json(conversations);
    } catch (error) {
        console.error("❌ Error fetching conversations:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
