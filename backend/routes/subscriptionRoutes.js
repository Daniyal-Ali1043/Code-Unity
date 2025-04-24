const express = require("express");
const router = express.Router();
const { 
  createCheckoutSession,
  handleWebhook,
  getSubscriptionStatus,
  cancelSubscription,
  debugSetProStatus 
} = require("../controllers/subscriptionController");
const protect = require("../middleware/authMiddleware");

// Create Checkout Session for subscription
router.post("/create-checkout-session", protect, createCheckoutSession);

// Get subscription status
router.get("/status", protect, getSubscriptionStatus);

// Cancel subscription
router.post("/cancel", protect, cancelSubscription);

// DEBUG route to manually set Pro status
router.post("/debug-set-pro", protect, debugSetProStatus);

// Stripe webhook - no auth middleware as it's called by Stripe
router.post("/webhook", express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router; 