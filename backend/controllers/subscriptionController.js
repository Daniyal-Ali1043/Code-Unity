const Student = require("../models/StudentModel");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session for CodeUnity Pro
exports.createCheckoutSession = async (req, res) => {
  try {
    console.log("✅ Creating Stripe Checkout Session for CodeUnity Pro");
    
    // Get user email
    const userEmail = req.user.email;
    console.log("User email:", userEmail);
    
    // Find the student document
    const student = await Student.findOne({ email: userEmail });
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Check if user already has an active subscription
    if (student.subscription && student.subscription.isPro && student.subscription.status === "active") {
      return res.status(400).json({ message: "You already have an active subscription" });
    }
    
    // Define frontend URL with fallback to ensure valid URLs
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5174";
    console.log("Frontend URL for redirect:", frontendURL);
    
    // Create success and cancel URLs
    const successUrl = `${frontendURL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendURL}/subscription/cancel`;
    console.log("Success URL:", successUrl);
    console.log("Cancel URL:", cancelUrl);
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "pkr",
            product: "prod_S8c5goEgIrvrwd", // Use the product ID passed
            unit_amount: 2000, // 20 PKR in lowest denomination
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: userEmail,
      metadata: {
        studentId: student._id.toString(),
      },
    });
    
    console.log("Stripe session created successfully:", session.id);
    console.log("Checkout URL:", session.url);
    
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Error creating checkout session:", error);
    res.status(500).json({ message: "Error creating checkout session", error: error.message });
  }
};

// Handle Stripe webhook events
exports.handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`❌ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
};

// Handler for checkout.session.completed event
async function handleCheckoutSessionCompleted(session) {
  try {
    const studentId = session.metadata.studentId;
    const subscriptionId = session.subscription;
    const customerId = session.customer;
    
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Update student with subscription info
    const student = await Student.findById(studentId);
    if (student) {
      student.subscription = {
        isPro: true,
        subscriptionId,
        customerId,
        startDate: new Date(subscription.current_period_start * 1000),
        endDate: new Date(subscription.current_period_end * 1000),
        status: subscription.status,
        lastPaymentDate: new Date()
      };
      
      await student.save();
      console.log(`✅ Student ${studentId} subscription updated to Pro`);
    }
  } catch (error) {
    console.error("❌ Error handling checkout.session.completed:", error);
  }
}

// Handler for customer.subscription.updated event
async function handleSubscriptionUpdated(subscription) {
  try {
    // Find student by subscription ID
    const student = await Student.findOne({ "subscription.subscriptionId": subscription.id });
    if (student) {
      student.subscription.status = subscription.status;
      student.subscription.startDate = new Date(subscription.current_period_start * 1000);
      student.subscription.endDate = new Date(subscription.current_period_end * 1000);
      
      await student.save();
      console.log(`✅ Student subscription updated: ${subscription.id}`);
    }
  } catch (error) {
    console.error("❌ Error handling subscription.updated:", error);
  }
}

// Handler for customer.subscription.deleted event
async function handleSubscriptionDeleted(subscription) {
  try {
    // Find student by subscription ID
    const student = await Student.findOne({ "subscription.subscriptionId": subscription.id });
    if (student) {
      student.subscription.isPro = false;
      student.subscription.status = "canceled";
      
      await student.save();
      console.log(`✅ Student subscription canceled: ${subscription.id}`);
    }
  } catch (error) {
    console.error("❌ Error handling subscription.deleted:", error);
  }
}

// Get subscription status
exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find student
    const student = await Student.findOne({ email: userEmail });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Return subscription status
    res.status(200).json({ 
      isPro: student.subscription ? student.subscription.isPro : false,
      status: student.subscription ? student.subscription.status : null,
      endDate: student.subscription ? student.subscription.endDate : null
    });
  } catch (error) {
    console.error("❌ Error getting subscription status:", error);
    res.status(500).json({ message: "Error getting subscription status", error: error.message });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userEmail = req.user.email;
    
    // Find student
    const student = await Student.findOne({ email: userEmail });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Check if student has an active subscription
    if (!student.subscription || !student.subscription.subscriptionId) {
      return res.status(400).json({ message: "No active subscription found" });
    }
    
    // Cancel subscription in Stripe
    const subscription = await stripe.subscriptions.update(
      student.subscription.subscriptionId,
      { cancel_at_period_end: true }
    );
    
    // Update student status
    student.subscription.status = subscription.status;
    await student.save();
    
    res.status(200).json({ 
      message: "Subscription will be canceled at the end of the billing period",
      cancelDate: new Date(subscription.cancel_at * 1000)
    });
  } catch (error) {
    console.error("❌ Error canceling subscription:", error);
    res.status(500).json({ message: "Error canceling subscription", error: error.message });
  }
};

// DEBUG: Manual update of subscription status - temporary route for debugging
exports.debugSetProStatus = async (req, res) => {
  try {
    const userEmail = req.user.email;
    console.log(`🔧 DEBUG: Manually updating Pro status for ${userEmail}`);
    
    // Find student
    const student = await Student.findOne({ email: userEmail });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    
    // Initialize subscription if it doesn't exist
    if (!student.subscription) {
      student.subscription = {
        isPro: true,
        subscriptionId: 'manual-debug-id',
        customerId: 'manual-debug-customer',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'active',
        lastPaymentDate: new Date()
      };
    } else {
      // Update existing subscription
      student.subscription.isPro = true;
      student.subscription.status = 'active';
      student.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    
    await student.save();
    console.log(`✅ DEBUG: Student ${userEmail} subscription manually updated to Pro`);
    
    res.status(200).json({ 
      message: "Pro status manually updated",
      subscription: student.subscription
    });
  } catch (error) {
    console.error("❌ Error in debug route:", error);
    res.status(500).json({ message: "Error updating Pro status", error: error.message });
  }
}; 