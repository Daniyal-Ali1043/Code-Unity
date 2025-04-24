const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Student = require("../models/StudentModel");
const { generateOtp } = require("../utils/generateOtp");
const { sendEmail } = require("../config/nodeMailerConfig");

const generateToken = (user) => {
  return jwt.sign(
      { 
          id: user._id, 
          username: user.username, 
          email: user.email, 
          role: user.role,  // ✅ Added role to token
          alias: user.alias // ✅ Alias added for Weavy
      },
      process.env.JWT_SECRET || "defaultSecret", 
      { expiresIn: "7d" }
  );
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("📥 Login Request Body:", req.body);

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    // ✅ Generate JWT Token with role included
    const token = generateToken(user);

    console.log("✅ User Logged In:", user.username, "| Role:", user.role);

    // ✅ Send OTP automatically after successful login
    await sendOtp(user);

    // ✅ Send Token and User ID in Response
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id, // Include user ID
        username: user.username,
        role: user.role,
        alias: user.alias,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Function to send OTP
const sendOtp = async (user) => {
  const { email } = user;

  // Fetch user from the database to ensure it's a Mongoose document
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new Error("User not found during OTP setup.");
  }

  const otp = generateOtp();
  existingUser.otp = otp;
  existingUser.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
  await existingUser.save();

  await sendEmail(existingUser.email, "Your OTP Code", `Your OTP is ${otp}`);
};

// Signup Controller
const signup = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  console.log("📥 Signup Request Body:", req.body);

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: "student", // Default role
    });

    await newUser.save();
    console.log(`✅ User Registered: ${email}`);

    const token = generateToken(newUser);
    newUser.token = token;
    await newUser.save();

    res.status(201).json({ message: "Signup successful!", token });
  } catch (error) {
    console.error("❌ Error during signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const socialAuthCallback = async (req, res) => {
  const { email, googleId, linkedInId, githubId } = req.user; // Extract user details

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // ✅ Create new user if not found
      user = new User({
        username: email.split("@")[0],
        email: email,
        googleId: googleId,
        linkedInId: linkedInId,
        githubId: githubId,
        role: "student",
      });
    } else {
      // ✅ Update user with social login IDs if they don't exist
      user.googleId = user.googleId || googleId;
      user.linkedInId = user.linkedInId || linkedInId;
      user.githubId = user.githubId || githubId;
    }

    await user.save();

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    console.log("✅ Social Login Successful:", user.username);

    // ✅ Redirect back to frontend with user details
    res.redirect(`${process.env.FRONTEND_BASE_URL}/social-auth?token=${token}&userId=${user._id}&username=${user.username}`);
  } catch (error) {
    console.error("❌ Error during social login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const resendOtp = async (req, res) => {
  try {
    // Fetch userId from session instead of request body
    const userId = req.user ? req.user.id : req.body.userId;
    
    console.log("🔄 Resending OTP for:", userId); // Debugging

    if (!userId) {
      return res.status(400).json({ message: "User ID is missing." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await sendOtp(user);
    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("❌ Error during OTP resend:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const verifyOtp = async (req, res) => {
  // Use URL parameter to get the userId
  const { userId, otp } = req.body;

  console.log("Received userId for OTP verification:", userId);


  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.otp || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.otp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    // Clear OTP fields
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Generate JWT token
    const token = generateToken(user);
    console.log(`✅ Token generated for user ${user.email}: ${token}`); // Debug log

    // Send response with token and role
    res.status(200).json({
      message: "OTP verified successfully",
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("❌ Error verifying OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};



// Two-Factor Authentication Login
const twoFAlogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    await sendOtp(user);
    res.status(200).json({ message: "OTP sent to your email", userId: user._id });
  } catch (error) {
    console.error("❌ Error during twoFAlogin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// OAuth Callbacks
const googleOAuthCallback = socialAuthCallback;
const linkedInOAuthCallback = socialAuthCallback;
const githubOAuthCallback = socialAuthCallback;

const logout = (req, res) => {
  res.json({ message: "Logged out successfully" });
};
// Get User Profile (combined with Student profile)
const getUserProfile = async (req, res) => {
  console.log(`✅ Profile Route Hit: User ID: ${req.user.id}`);
  try {
    // Fetch User data
    const user = await User.findById(req.user.id).select('-password');  // Select excludes password but includes other fields

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch Student profile if it exists
    let studentProfile = await Student.findOne({ email: user.email });

    if (!studentProfile) {
      // Initialize Student profile if it doesn't exist
      const [firstName, ...lastNameParts] = user.username.trim().split(" ");
      studentProfile = await Student.create({
        _id: user._id,
        firstName: firstName || "",
        lastName: lastNameParts.join(" ") || null,
        email: user.email,
        profilePicture: user.profilePicture || null,
        role: user.role || "student", // Fetch role from User model
      });
    }

    res.status(200).json({
      _id: user._id, // Explicitly include the _id field
      firstName: studentProfile.firstName,
      lastName: studentProfile.lastName,
      email: studentProfile.email,
      dateOfBirth: studentProfile.dateOfBirth || "",
      degree: studentProfile.degree || "",
      discipline: studentProfile.discipline || "",
      degreeStartDate: studentProfile.degreeStartDate || "",
      degreeEndDate: studentProfile.degreeEndDate || "",
      profilePicture: studentProfile.profilePicture || "",
      role: studentProfile.role || user.role, // Include role explicitly

    });
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update User Profile
const updateUserProfile = async (req, res) => {
  console.log(`✅ Update Profile Route Hit: User ID: ${req.user.id}`);
  const {
    firstName,
    lastName,
    dateOfBirth,
    degree,
    discipline,
    degreeStartDate, // Match frontend naming
    degreeEndDate,   // Match frontend naming
  } = req.body;

  try {
    // Fetch student profile
    let studentProfile = await Student.findOne({ _id: req.user.id });

    if (!studentProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Ensure first name is not empty
    if (!firstName || firstName.trim() === "") {
      return res.status(400).json({ message: "First name cannot be empty" });
    }

    // Helper function to set empty strings to null
    const setNullIfEmpty = (value) => (value === "" ? null : value);

    // Update fields
    studentProfile.firstName = firstName.trim();
    studentProfile.lastName = setNullIfEmpty(lastName);
    studentProfile.dateOfBirth = setNullIfEmpty(dateOfBirth);
    studentProfile.degree = setNullIfEmpty(degree);
    studentProfile.discipline = setNullIfEmpty(discipline);
    studentProfile.degreeStartDate = setNullIfEmpty(degreeStartDate);
    studentProfile.degreeEndDate = setNullIfEmpty(degreeEndDate);

    await studentProfile.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const uploadProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Construct the full URL for the uploaded image
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

    // Update the profile picture in the User model
    user.profilePicture = imageUrl;
    await user.save();

    // If the user's role is "student", update the Student model as well
    if (user.role === "student") {
      const student = await Student.findOne({ email: user.email }); // Find student by email
      if (student) {
        student.profilePicture = imageUrl;
        await student.save();
      }
    }

    res.status(200).json({ profilePicture: user.profilePicture });
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ message: "Failed to upload profile picture" });
  }
};

module.exports = {
  signup,
  login,
  uploadProfilePicture,
  googleOAuthCallback,
  linkedInOAuthCallback,
  githubOAuthCallback,
  logout,
  twoFAlogin,
  verifyOtp,
  sendOtp,
  getUserProfile,
  updateUserProfile,
  resendOtp,
};
