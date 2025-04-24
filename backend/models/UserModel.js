const mongoose = require("mongoose");

const generateRandomAlias = (username) => {
  // Extract first name from username (first word before space)
  const firstName = username.split(" ")[0].toLowerCase();

  // Generate 8-character alphanumeric random string
  const randomString = Math.random().toString(36).substring(2, 10);

  return `${firstName}${randomString}`;
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true }, // Stores full name
  alias: { type: String, unique: true }, // Stores randomly generated alias
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: function () {
      return !this.googleId && !this.linkedInId && !this.githubId;
    },
  },
  role: {
    type: String,
    enum: ["student", "developer", "admin"],
    default: "student",
  },
  otp: { type: String },
  otpExpiry: { type: Date },
  googleId: { type: String, unique: true, sparse: true },
  linkedInId: { type: String, unique: true, sparse: true },
  githubId: { type: String, unique: true, sparse: true },
  profilePicture: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Ensure password is required when no social ID is present
userSchema.path("password").required(function () {
  return !this.googleId && !this.linkedInId && !this.githubId;
});

// Middleware to generate alias before saving the user
userSchema.pre("save", async function (next) {
  if (!this.alias) {
    let newAlias;
    let isUnique = false;

    while (!isUnique) {
      newAlias = generateRandomAlias(this.username);

      // Check if alias is unique
      const existingUser = await mongoose.models.User.findOne({ alias: newAlias });
      if (!existingUser) {
        isUnique = true;
      }
    }

    this.alias = newAlias;
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
