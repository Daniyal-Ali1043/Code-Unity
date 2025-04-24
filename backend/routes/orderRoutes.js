const express = require("express");
const {
  createOrder,
  getStudentOrders,
  getDeveloperOrders,
  updateOrderStatus,
  addOrderFeedback,
  getDeveloperDashboard,
  getStudentDashboard,
  getStudentInvoices,
  getDeveloperInvoices,
  generateInvoicePDF,
  createOrderAfterPayment,
  getStudentOrder,         // New controller method
  getDeveloperOrder,
  addDeveloperFeedback      // New controller method
} = require("../controllers/orderController");

const protect = require("../middleware/authMiddleware");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Create a new order (Student places an order to a Developer)
router.post("/", protect, createOrder);

// Create order after successful payment
router.post("/create", protect, createOrderAfterPayment);

// Get all orders for the authenticated student
router.get("/student", protect, getStudentOrders);

// Get a specific order for the authenticated student
router.get("/student/:orderId", protect, getStudentOrder);

// Get all orders for the authenticated developer
router.get("/developer", protect, getDeveloperOrders);

// Get a specific order for the authenticated developer
router.get("/developer/:orderId", protect, getDeveloperOrder);

// Update an order's status (typically by a developer)
router.put("/status", protect, updateOrderStatus);

// Update an order's status by ID (can be used for payment confirmation)
router.put("/:orderId/status", protect, (req, res) => {
  req.body = { ...req.body, orderId: req.params.orderId };
  updateOrderStatus(req, res);
});

// Add feedback and rating to a completed order
router.post("/feedback", protect, addOrderFeedback);

// Get dashboard data for the authenticated developer
router.get("/dashboard/developer", protect, getDeveloperDashboard);

// Get dashboard data for the authenticated student
router.get("/dashboard/student", protect, getStudentDashboard);

// Get all invoices for the authenticated student
router.get("/invoices/student", protect, getStudentInvoices);

// Get all invoices for the authenticated developer
router.get("/invoices/developer", protect, getDeveloperInvoices);

// Generate PDF for an invoice
router.get("/invoices/:invoiceId/pdf", protect, generateInvoicePDF);
// Add developer feedback to a completed order
router.post("/developer-feedback", protect, addDeveloperFeedback);
// Create a payment checkout session
// Update for the create-checkout-session route in orderRoutes.js
router.post("/payment/create-checkout-session", protect, async (req, res) => {
  try {
    console.log("Creating checkout session with data:", req.body);
    
    const { 
      amount, 
      description, 
      successUrl, 
      cancelUrl, 
      orderId, 
      offerId,
      developerId,
      hours
    } = req.body;
    
    if (!amount || !description || !orderId || !offerId || !developerId) {
      return res.status(400).json({ 
        success: false,
        message: "Amount, description, orderId, offerId, and developerId are required" 
      });
    }

    // Get user ID for metadata
    const userId = req.user._id.toString();

    // Create Stripe checkout session with complete metadata
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: {
            name: description,
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/success?orderId=${orderId}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/cancel?orderId=${orderId}`,
      metadata: {
        orderId,
        offerId,
        developerId,
        description,
        amount: amount.toString(),
        hours: hours?.toString() || "1",
        userId
      },
      client_reference_id: orderId
    });

    console.log("Stripe session created:", session.id);

    res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id,
      message: "Checkout session created successfully"
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create checkout session",
      error: error.message 
    });
  }
});
// Get Stripe session details
router.get("/payment/session/:sessionId", protect, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.status(200).json({
      success: true,
      session: {
        id: session.id,
        amount: session.amount_total / 100,
        description: session.metadata?.description,
        status: session.status,
        payment_status: session.payment_status
      }
    });
  } catch (error) {
    console.error("Error retrieving session:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve session",
      error: error.message 
    });
  }
});

module.exports = router;