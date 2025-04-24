const NotificationModel = require("../models/notificationModel");
const UserModel = require("../models/UserModel");
const DeveloperModel = require("../models/DeveloperModel");
const pusher = require('../config/pusher');

/**
 * ✅ Create a notification when a message is sent
 * @param {string} senderId - ID of the user who sent the message
 * @param {string} receiverId - ID of the user receiving the message
 * @param {string} messageId - ID of the message associated with the notification
 */
exports.createNotification = async (senderId, receiverId, messageId) => {
  try {
    console.log(`🔔 Creating notification from Sender: ${senderId} to Receiver: ${receiverId}`);

    // Get sender details
    const sender = await UserModel.findById(senderId).select('username firstName lastName');
    if (!sender) {
      console.log(`⚠️ Sender not found, skipping notification.`);
      return;
    }

    // Create notification
    const newNotification = new NotificationModel({
      senderId,
      receiverId,
      messageId,
      isRead: false,
    });

    await newNotification.save();
    console.log("✅ Notification Created:", newNotification);

    // Prepare notification data for Pusher
    const notificationData = {
      _id: newNotification._id,
      senderId: {
        _id: sender._id,
        username: sender.username,
        firstName: sender.firstName,
        lastName: sender.lastName
      },
      receiverId,
      type: 'message',
      content: 'New message received',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // Trigger notification event to receiver's notification channel
    const notificationChannel = `private-notifications-${receiverId}`;
    pusher.trigger(
      notificationChannel,
      'new-notification',
      notificationData
    );

    // Also trigger to role-specific channel
    const roleChannel = `private-student-notifications-${receiverId}`;
    pusher.trigger(
      roleChannel,
      'new-message',
      notificationData
    );

    return newNotification;
  } catch (error) {
    console.error("❌ Error creating notification:", error);
  }
};

/**
 * ✅ Get all notifications for a user (student)
 * @route GET /api/notifications/:userId
 */
exports.getNotificationsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📥 Fetching notifications for User ID: ${userId}`);

    const notifications = await NotificationModel.find({ receiverId: userId })
      .populate({
        path: "senderId",
        model: DeveloperModel, // Use the DeveloperModel for population
        select: "firstName lastName", // Select the fields you need
      })
      .populate("messageId", "text fileUrl createdAt")
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${notifications.length} notifications.`);
    res.json(notifications);
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error });
  }
};

exports.getNotificationsForDeveloper = async (req, res) => {
  try {
    const { developerId } = req.params;
    console.log(`📥 Fetching notifications for Developer User ID: ${developerId}`);

    // Step 1: Find the developer's _id using the userId stored in the DeveloperModel
    const developer = await DeveloperModel.findOne({ user: developerId });
    if (!developer) {
      return res.status(404).json({ message: "Developer not found" });
    }

    const developerMongoId = developer._id; // This is the _id of the developer in the DeveloperModel

    // Step 2: Fetch notifications where the receiverId matches the developer's _id
    const notifications = await NotificationModel.find({ receiverId: developerMongoId })
      .populate({
        path: "senderId",
        model: UserModel, // Use the UserModel for population (sender is always a student)
        select: "username", // Select the username field (contains the student's name)
      })
      .populate("messageId", "text fileUrl createdAt")
      .sort({ createdAt: -1 });

    console.log(`✅ Fetched ${notifications.length} notifications for developer.`);
    res.json(notifications);
  } catch (error) {
    console.error("❌ Error fetching notifications for developer:", error);
    res.status(500).json({ message: "Error fetching notifications for developer", error });
  }
};
/**
 * ✅ Mark a notification as read
 * @route PUT /api/notifications/mark-read/:id
 */
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 Marking notification ${id} as read`);

    const notification = await NotificationModel.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ message: "Error marking notification as read", error });
  }
};

/**
 * ✅ Mark all notifications as read for a user
 * @route PUT /api/notifications/mark-all-read/:userId
 */
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`📌 Marking all notifications as read for User ID: ${userId}`);

    await NotificationModel.updateMany({ receiverId: userId }, { isRead: true });

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    res.status(500).json({ message: "Error marking notifications as read", error });
  }
};

/**
 * ✅ Delete a notification
 * @route DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting notification: ${id}`);

    const notification = await NotificationModel.findByIdAndDelete(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification", error });
  }
};

/**
 * ✅ Delete all notifications for a user
 * @route DELETE /api/notifications/clear/:userId
 */
exports.clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🗑️ Clearing all notifications for User ID: ${userId}`);

    await NotificationModel.deleteMany({ receiverId: userId });

    res.json({ message: "All notifications cleared" });
  } catch (error) {
    console.error("❌ Error clearing notifications:", error);
    res.status(500).json({ message: "Error clearing notifications", error });
  }
};