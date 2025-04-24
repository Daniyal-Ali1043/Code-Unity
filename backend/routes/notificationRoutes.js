const express = require("express");
const {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationsForDeveloper,
} = require("../controllers/notificationController");

const router = express.Router();

// ✅ Get all notifications for a user
router.get("/:userId", getNotificationsForUser);
router.get("/developer/:developerId", getNotificationsForDeveloper);

// ✅ Mark a single notification as read
router.put("/mark-read/:id", markNotificationAsRead);

// ✅ Mark all notifications as read for a user
router.put("/mark-all-read/:userId", markAllNotificationsAsRead);

// ✅ Delete a single notification
router.delete("/:id", deleteNotification);

// ✅ Clear all notifications for a user
router.delete("/clear/:userId", clearAllNotifications);

module.exports = router;
