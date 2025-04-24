/**
 * Middleware to ensure the authenticated user has admin role
 */
const adminMiddleware = (req, res, next) => {
    // Check if user exists and has role
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Access denied. User role not defined."
      });
    }
  
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required."
      });
    }
  
    // If user is admin, proceed to the next middleware/controller
    next();
  };
  
  module.exports = adminMiddleware;