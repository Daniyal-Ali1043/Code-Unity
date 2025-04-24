const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const protect = async (req, res, next) => {
  let token;

  // ✅ Check if Authorization header exists
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // ✅ Verify Token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Attach User to Request Object
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found, authorization denied" });
      }

      console.log("✅ Authenticated User:", req.user); // Debugging line

      next();
    } catch (error) {
      console.error("🚨 Authorization error:", error);
      return res.status(401).json({ message: "Invalid token, authorization denied" });
    }
  }

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }
};

module.exports = protect;
