const express = require("express");
const {
  getUserCount,
  getUserTypeDistribution,
  getTotalRevenue,
  getMonthlyRevenue,
  getTotalOrdersCount,
  getCompletedOrdersCount,
  getPendingDevelopers,
  acceptDeveloperApplication,
  rejectDeveloperApplication,
  getAllUsers,
  getDeveloperDetails,
  searchUsers,
  getUserDetails
} = require("../controllers/adminController");
const protect = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const router = express.Router();

// Apply both authentication and admin role middleware to all routes
router.use(protect, adminMiddleware);

// Dashboard metrics routes
router.get("/users/count", getUserCount);
router.get("/users/types", getUserTypeDistribution);
router.get("/revenue/total", getTotalRevenue);
router.get("/revenue/monthly", getMonthlyRevenue);
router.get("/orders/total", getTotalOrdersCount);
router.get("/orders/completed", getCompletedOrdersCount);

// User search and details routes
router.get("/users/search", searchUsers);
router.get("/users/:userId/details", getUserDetails);

// Developer application management routes
router.get("/developers/pending", getPendingDevelopers);
router.get("/developers/:developerId/details", getDeveloperDetails);
router.put("/developers/:developerId/accept", acceptDeveloperApplication);
router.delete("/developers/:developerId/reject", rejectDeveloperApplication);

// User management routes
router.get("/users", getAllUsers);

module.exports = router;