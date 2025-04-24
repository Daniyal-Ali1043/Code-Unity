const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const Pusher = require("pusher");
const jwt = require("jsonwebtoken");
require("dotenv").config();
require("./config/passportConfig");
const { initializeBadges } = require('./models/BadgeSystem');

const authRoutes = require("./routes/authRoutes");
const discussionRoutes = require("./routes/DiscussionRoutes");
const studentRoutes = require("./routes/studentRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const developerRoutes = require("./routes/developerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./paymentRoutes");
const adminRoutes = require("./routes/adminRoutes"); // Import the admin routes
const pusher = require("./config/pusher"); // Import Pusher instance directly
const complaintRoutes = require("./routes/complaintRoutes"); // Add this line
const badgeRoutes = require("./routes/badgeRoutes"); // Import badge routes
const subscriptionRoutes = require("./routes/subscriptionRoutes"); // Import subscription routes

const app = express();

// Make pusher available in requests
app.use((req, res, next) => {
  req.pusher = pusher; // Attach pusher to the request object
  next();
});

// Add CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5174",
  credentials: true
}));

// Special middleware for Stripe webhooks (must be before express.json())
app.use("/api/subscription/webhook", express.raw({ type: 'application/json' }));

// Middleware for JSON, URL-encoded data, and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Session Middleware
app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "E9F9C4A62A8D73C30D4F8A5B16F9E16E2F21F0D83DB8C41A9F1D91B02F83C3EF",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Debugging Middleware
app.use((req, res, next) => {
  console.log(`📥 Incoming Request: ${req.method} ${req.url}`);
  if (Object.keys(req.body).length > 0) {
    console.log(`📦 Request Body:`, req.body);
  }
  if (req.cookies) {
    console.log(`🍪 Cookies:`, req.cookies);
  }
  next();
});

// Routes
app.use("/api/users", authRoutes);
app.use("/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/developers", developerRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/discussion", discussionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", adminRoutes); // Add the admin routes
app.use("/api/complaints", complaintRoutes); // Add the complaint routes
app.use("/api/badges", badgeRoutes); // Add the badge routes
app.use("/api/subscription", subscriptionRoutes); // Add the subscription routes

// Add Pusher authentication route
app.post('/pusher/auth', (req, res) => {
  const socketId = req.body.socket_id;
  const channel = req.body.channel_name;
  
  // Get user info from token
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = decoded;
    
    // Generate auth signature
    const auth = pusher.authenticate(socketId, channel, {
      user_id: user.id,
      user_info: {
        name: user.username || 'Anonymous'
      }
    });
    
    res.send(auth);
  } catch (error) {
    console.error('Pusher auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message || err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

// Fallback Route for Undefined Endpoints
app.use((req, res) => {
  console.warn(`⚠️ Undefined Route Accessed: ${req.method} ${req.url}`);
  res.status(404).json({ error: "Endpoint not found" });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize badges on server startup
  try {
    await initializeBadges();
    console.log('✅ Badge system initialized');
  } catch (error) {
    console.error('❌ Error initializing badge system:', error);
  }
});