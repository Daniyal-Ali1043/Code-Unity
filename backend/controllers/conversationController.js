const mongoose = require("mongoose");
const { ConversationModel, MessageModel } = require("../models/ConversationModel");
const Developer = require("../models/DeveloperModel");
const UserModel = require("../models/UserModel"); // ✅ Import UserModel
const NotificationModel = require("../models/notificationModel");

/**
 * ✅ Get all conversations where the user (student or developer) is involved.
 */
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // 🔍 Fetch conversations where user is either sender or receiver
    const conversations = await ConversationModel.find({
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username profilePicture") // ✅ Fetch sender details
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 }, // ✅ Fetch only last message
      })
      .lean();

    if (!conversations.length) {
      return res.status(404).json({ message: "No conversations found" });
    }

    // 🔍 Fetch receiver details (developer or student)
    for (let conv of conversations) {
      if (conv.receiver) {
        const receiverData = await Developer.findOne({ _id: conv.receiver })?.select("firstName lastName user");
        
        if (receiverData) {
          conv.receiver = { ...receiverData._doc };

          // 🔍 Fetch profile picture from `UserModel` using `user` reference in `Developer`
          if (receiverData.user) {
            const userData = await UserModel.findById(receiverData.user).select("profilePicture");
            conv.receiver.profilePicture = userData?.profilePicture || null;
          } else {
            conv.receiver.profilePicture = null;
          }
        } else {
          conv.receiver = null;
        }
      }
    }

    res.status(200).json(conversations);
  } catch (error) {
    console.error("❌ Error fetching user conversations:", error);
    res.status(500).json({ message: "Error retrieving conversations", error });
  }
};

exports.getConversationsForReceiver = async (req, res) => {
  try {
    const { receiverId } = req.params;

    // 🛑 Ensure receiverId is valid
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver ID format" });
    }

    console.log(`🔍 Fetching conversations where Developer (Receiver) ID: ${receiverId}`);

    // ✅ Fetch conversations where this developer is the receiver
    const conversations = await ConversationModel.find({ receiver: receiverId })
      .populate("sender", "username profilePicture email") // Fetch sender (student) details
      .populate({
        path: "messages",
        populate: {
          path: "msgByUserId",
          select: "username profilePicture",
        },
        options: { sort: { createdAt: -1 }, limit: 1 },
      })
      .lean();

    if (!conversations.length) {
      console.log("⚠️ No conversations found for this developer.");
      return res.status(200).json([]);
    }

    console.log(`✅ Successfully fetched ${conversations.length} conversations.`);
    res.status(200).json(conversations);

  } catch (error) {
    console.error("❌ Error fetching developer conversations:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};


/**
 * ✅ Get or create a conversation between a sender and receiver.
 */
exports.getConversation = async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;

    console.log(`🔍 Checking conversation between Sender: ${senderId} and Receiver: ${receiverId}`);

    // ✅ Find existing conversation
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    })
      .populate("messages")
      .populate("sender", "username profilePicture")
      .lean();

    if (!conversation) {
      console.log("⚠️ No conversation found. Creating a new conversation...");

      conversation = new ConversationModel({
        sender: senderId,
        receiver: receiverId,
        messages: [],
      });

      await conversation.save();
    }

    console.log(`✅ Found/Created Conversation: ${conversation._id}`);

    res.status(200).json(conversation);
  } catch (error) {
    console.error("❌ Error fetching conversation:", error);
    res.status(500).json({ message: "Error retrieving conversation", error });
  }
};

// Function to extract meeting link from HTML content
const extractMeetingLink = (htmlContent) => {
  if (!htmlContent) return null;
  
  // Try to extract from data attribute first
  const dataMatch = htmlContent.match(/data-meeting-link="([^"]+)"/);
  if (dataMatch && dataMatch[1]) {
    return dataMatch[1];
  }
  
  // Fallback to extracting from onclick or href attributes
  const onclickMatch = htmlContent.match(/onclick="window\.location\.href='([^']+)'"/);
  if (onclickMatch && onclickMatch[1]) {
    return onclickMatch[1];
  }
  
  const onclickMatch2 = htmlContent.match(/onclick="window\.open\('([^']+)', '_blank'\)"/);
  if (onclickMatch2 && onclickMatch2[1]) {
    return onclickMatch2[1];
  }
  
  const hrefMatch = htmlContent.match(/href="([^"]+)"/);
  if (hrefMatch && hrefMatch[1]) {
    return hrefMatch[1];
  }
  
  // Handle the format in the screenshot
  const joinCallMatch = htmlContent.match(/leJoinCall\("([^"]+)"\)/);
  if (joinCallMatch && joinCallMatch[1]) {
    return joinCallMatch[1];
  }
  
  return null;
};

/**
 * ✅ Send a new message.
 */
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    const isHTML = req.body.isHTML === 'true';
    
    let imageUrl = null, fileUrl = null;

    if (req.file) {
      const fileType = req.file.mimetype.split("/")[0];
      if (fileType === "image") imageUrl = `/uploads/${req.file.filename}`;
      else fileUrl = `/uploads/${req.file.filename}`;
    }

    // Validate sender and receiver IDs
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid sender or receiver ID" });
    }

    // Find or create conversation
    let conversation = await ConversationModel.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (!conversation) {
      conversation = new ConversationModel({ sender: senderId, receiver: receiverId, messages: [] });
    }

    // Create new message
    const newMessage = new MessageModel({
      text,
      imageUrl,
      fileUrl,
      msgByUserId: senderId,
      isHTML,
      isMeetingLink: text && text.includes('video-call-invitation'),
      meetingLink: text ? extractMeetingLink(text) : null
    });

    await newMessage.save();
    conversation.messages.push(newMessage._id);
    await conversation.save();

    // Determine if sender is a student or developer
    let senderDetails = null;
    
    // First try to find sender in Users collection
    senderDetails = await UserModel.findById(senderId).select('_id username firstName lastName profilePicture');
    
    // If not found, check if it's a developer
    if (!senderDetails) {
      const developerDetails = await Developer.findById(senderId).select('_id firstName lastName user');
      
      if (developerDetails) {
        // If it's a developer, use its details
        senderDetails = {
          _id: developerDetails._id,
          firstName: developerDetails.firstName,
          lastName: developerDetails.lastName,
          // For developers, get profile picture from linked user account
          profilePicture: null
        };
        
        // If developer has a linked user, get the profile picture
        if (developerDetails.user) {
          const userData = await UserModel.findById(developerDetails.user).select('profilePicture');
          if (userData) {
            senderDetails.profilePicture = userData.profilePicture;
          }
        }
      }
    }

    // Create a notification for the new message
    const newNotification = new NotificationModel({
      senderId,
      receiverId,
      messageId: newMessage._id,
      isRead: false,
    });

    await newNotification.save();
    
    // Format the notification data for Pusher
    const notificationData = {
      _id: newNotification._id,
      senderId: senderDetails || { _id: senderId }, // Ensure we always have at least the ID
      receiverId,
      messageId: {
        _id: newMessage._id,
        text: newMessage.text,
        fileUrl: newMessage.fileUrl,
        createdAt: newMessage.createdAt
      },
      isRead: false,
      createdAt: newNotification.createdAt
    };

    // Setup Pusher events for both conversation and notification
    const pusher = require('../config/pusher');
    
    // 1. Trigger message event for the conversation
    const ids = [senderId, receiverId].sort();
    const channelName = `private-conversation-${ids[0]}-${ids[1]}`;
    
    console.log(`🔔 Triggering Pusher event on channel: ${channelName}`);
    
    pusher.trigger(
      channelName,
      'new-message',
      newMessage
    ).then(() => {
      console.log('✅ Pusher event triggered successfully for conversation');
    }).catch(err => {
      console.error('❌ Error triggering Pusher event for conversation:', err);
    });

    // 2. Trigger notification event for the receiver
    const notificationChannel = `notifications-${receiverId}`;
    
    console.log(`🔔 Triggering notification event on channel: ${notificationChannel}`);
    console.log('Notification data being sent:', JSON.stringify(notificationData));
    
    pusher.trigger(
      notificationChannel,
      'new-notification',
      notificationData
    ).then(() => {
      console.log('✅ Pusher event triggered successfully for notification');
    }).catch(err => {
      console.error('❌ Error triggering Pusher event for notification:', err);
    });

    res.status(201).json({ 
      message: "Message sent successfully", 
      newMessage, 
      newNotification 
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    res.status(500).json({ message: "Error sending message", error });
  }
};
// Check if a conversation exists between two users
exports.checkConversationExists = async (req, res) => {
  const { senderId, receiverId } = req.params;

  try {
    const conversation = await ConversationModel.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    });

    if (conversation) {
      res.status(200).json({ conversationId: conversation._id });
    } else {
      res.status(404).json({ message: "No conversation found" });
    }
  } catch (error) {
    console.error("Error checking conversation:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

// Delete a conversation by ID
exports.deleteConversation = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await ConversationModel.findByIdAndDelete(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
};
// Add this function to handle requirements selection
const handleRequirementChange = (requirement) => {
  setOfferDetails(prev => {
    const requirements = [...prev.requirements];
    const index = requirements.indexOf(requirement);
    
    if (index === -1) {
      requirements.push(requirement);
    } else {
      requirements.splice(index, 1);
    }
    
    return { ...prev, requirements };
  });
};


// Export routes for socket.io replacement with Pusher
module.exports.setupPusherEvents = (app) => {
  // Add Pusher webhook endpoint for authentication if needed
  app.post('/pusher/auth', (req, res) => {
    const socketId = req.body.socket_id;
    const channel = req.body.channel_name;
    // Get user info from session or token
    const user = req.user || { id: 'anonymous' };
    
    // Generate auth signature
    const auth = pusher.authenticate(socketId, channel, {
      user_id: user.id,
      user_info: {
        name: user.username || 'Anonymous'
      }
    });
    
    res.send(auth);
  });
};