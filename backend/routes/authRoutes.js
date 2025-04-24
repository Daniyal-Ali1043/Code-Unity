const express = require("express");
const passport = require("passport");
const User = require("../models/UserModel"); // Import the User model
const multer = require("multer"); // Import multer for file uploads
const {
  signup,
  login,
  logout,
  twoFAlogin,
  verifyOtp,
  sendOtp,
  resendOtp,
  updateUserProfile,
  getUserProfile,
  uploadProfilePicture, // Import the new controller for profile picture upload
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Base URL for Frontend
const FRONTEND_BASE_URL = process.env.FRONTEND_BASE_URL || "http://localhost:5174";

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  }
});

const upload = multer({ storage: storage });

// Signup Route
router.post("/signup", signup);

// Login Route
router.post("/login", login);

// Two-Factor Authentication Routes
router.post("/twoFAlogin", twoFAlogin);
router.post("/sendOtp", sendOtp);
router.post("/verifyOtp", verifyOtp);
router.post("/resendOtp", resendOtp);

// Logout Route
router.post("/logout", logout);

// User Profile Routes (Protected)
router.get("/profile", protect, getUserProfile); // Get user profile
router.put("/profile", protect, updateUserProfile); // Update user profile

// Upload Profile Picture Route (Protected)
router.post("/upload-profile-picture", protect, upload.single("profilePicture"), uploadProfilePicture);

// OAuth Routes
const handleSocialAuthWithOTP = async (req, res) => {
  const { user } = req;

  try {
    if (!user || !user.email) {
      console.error("❌ User information is missing or incomplete.");
      return res.status(400).json({ message: "User information is missing" });
    }

    console.log(`✅ Social Login Successful for: ${user.email}`);

    const updatedUser = await User.findById(user._id);
    if (!updatedUser) {
      console.error("❌ User not found in the database.");
      return res.status(404).json({ message: "User not found during OTP setup" });
    }

    await sendOtp(updatedUser);
    res.redirect(`${FRONTEND_BASE_URL}/verify?userId=${updatedUser._id}`);
  } catch (error) {
    console.error("❌ Error during social login OTP:", error);
    res.status(500).json({ message: "Internal server error during OTP setup" });
  }
};

// Google OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  handleSocialAuthWithOTP
);

// LinkedIn OAuth Routes
router.get("/linkedin", passport.authenticate("linkedin"));
router.get(
  "/linkedin/callback",
  passport.authenticate("linkedin", { session: false }),
  handleSocialAuthWithOTP
);

// GitHub OAuth Routes
router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  handleSocialAuthWithOTP
);

module.exports = router;