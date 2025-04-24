const User = require("../models/UserModel");
const Developer = require("../models/DeveloperModel");
const Student = require("../models/StudentModel");

// Get total user count
exports.getUserCount = async (req, res) => {
  try {
    // Count all users in the User model
    const userCount = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: userCount
    });
  } catch (error) {
    console.error("❌ Error fetching user count:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch user count", 
      error: error.message 
    });
  }
};

// Get distribution of user types (developers vs students)
exports.getUserTypeDistribution = async (req, res) => {
  try {
    // Count all developers with accepted=true
    const developerCount = await Developer.countDocuments({ accepted: true });
    
    // Count all students
    const studentCount = await Student.countDocuments();
    
    res.status(200).json({
      success: true,
      developerCount,
      studentCount
    });
  } catch (error) {
    console.error("❌ Error fetching user type distribution:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch user type distribution", 
      error: error.message 
    });
  }
};

// Get total revenue (sum of all developers' revenue)
exports.getTotalRevenue = async (req, res) => {
  try {
    // Get all developers
    const developers = await Developer.find({ accepted: true });
    
    // Calculate total revenue
    let totalRevenue = 0;
    developers.forEach(developer => {
      if (developer.revenue && developer.revenue.total) {
        totalRevenue += developer.revenue.total;
      }
    });
    
    res.status(200).json({
      success: true,
      totalRevenue
    });
  } catch (error) {
    console.error("❌ Error calculating total revenue:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to calculate total revenue", 
      error: error.message 
    });
  }
};

// Get monthly revenue data
exports.getMonthlyRevenue = async (req, res) => {
  try {
    // Initialize arrays for monthly income and expense
    const income = Array(12).fill(0);
    const expense = Array(12).fill(0);
    
    // Get the current year
    const currentYear = new Date().getFullYear();
    
    // Get all developers
    const developers = await Developer.find({ accepted: true });
    
    // Aggregate monthly revenue for each developer
    developers.forEach(developer => {
      if (developer.revenue && developer.revenue.monthly) {
        // Convert the Map to entries that we can iterate through
        const monthlyEntries = developer.revenue.monthly instanceof Map 
          ? Array.from(developer.revenue.monthly.entries())
          : Object.entries(developer.revenue.monthly);
        
        monthlyEntries.forEach(([key, value]) => {
          // Check if this entry is for the current year
          if (key.startsWith(currentYear.toString())) {
            // Extract month from key (format: 'YYYY-MM')
            const month = parseInt(key.split('-')[1]) - 1; // 0-indexed
            if (month >= 0 && month < 12) {
              income[month] += value;
            }
          }
        });
      }
    });
    
    // Get all students to calculate expense
    const students = await Student.find();
    
    // Aggregate monthly spending for each student
    students.forEach(student => {
      if (student.spending && student.spending.monthly) {
        // Convert the Map to entries that we can iterate through
        const monthlyEntries = student.spending.monthly instanceof Map 
          ? Array.from(student.spending.monthly.entries())
          : Object.entries(student.spending.monthly);
        
        monthlyEntries.forEach(([key, value]) => {
          // Check if this entry is for the current year
          if (key.startsWith(currentYear.toString())) {
            // Extract month from key (format: 'YYYY-MM')
            const month = parseInt(key.split('-')[1]) - 1; // 0-indexed
            if (month >= 0 && month < 12) {
              expense[month] += value;
            }
          }
        });
      }
    });
    
    res.status(200).json({
      success: true,
      income,
      expense
    });
  } catch (error) {
    console.error("❌ Error fetching monthly revenue:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch monthly revenue", 
      error: error.message 
    });
  }
};

// Get total orders/invoices count
exports.getTotalOrdersCount = async (req, res) => {
  try {
    // Get all developers
    const developers = await Developer.find();
    
    // Count all orders
    let totalOrders = 0;
    developers.forEach(developer => {
      totalOrders += developer.orders ? developer.orders.length : 0;
    });
    
    res.status(200).json({
      success: true,
      totalOrders
    });
  } catch (error) {
    console.error("❌ Error counting total orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to count total orders", 
      error: error.message 
    });
  }
};

// Get completed orders/projects count
exports.getCompletedOrdersCount = async (req, res) => {
  try {
    // Get all developers
    const developers = await Developer.find();
    
    // Count completed orders
    let completedOrders = 0;
    developers.forEach(developer => {
      if (developer.orders && developer.orders.length > 0) {
        developer.orders.forEach(order => {
          if (order.status === "completed") {
            completedOrders++;
          }
        });
      }
    });
    
    res.status(200).json({
      success: true,
      completedOrders
    });
  } catch (error) {
    console.error("❌ Error counting completed orders:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to count completed orders", 
      error: error.message 
    });
  }
};

// Get list of all developers with pending applications
exports.getPendingDevelopers = async (req, res) => {
  try {
    // Find all developers with accepted=false and submitted=true
    const pendingDevelopers = await Developer.find({ 
      accepted: false, 
      submitted: true 
    }).populate('user', 'email _id');
    
    const formattedDevelopers = pendingDevelopers.map(dev => {
      return {
        _id: dev._id,
        userId: dev.user ? dev.user._id : null,
        name: `${dev.firstName} ${dev.lastName}`,
        email: dev.user ? dev.user.email : 'No email available',
        programmingLanguages: dev.programmingLanguages || [],
        previousExperiences: dev.previousExperiences || [],
        projectsLink: dev.projectsLink || 'No projects link',
        degree: dev.degree || 'Not specified',
        discipline: dev.discipline || 'Not specified',
        yearOfCompletion: dev.yearOfCompletion || 'Not specified',
        submittedDate: dev._id.getTimestamp() // Get submission date from ObjectId
      };
    });
    
    res.status(200).json({
      success: true,
      pendingDevelopers: formattedDevelopers
    });
  } catch (error) {
    console.error("❌ Error fetching pending developers:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch pending developers", 
      error: error.message 
    });
  }
};

// Accept a developer application
// Accept a developer application
exports.acceptDeveloperApplication = async (req, res) => {
    try {
      const { developerId } = req.params;
      
      // Find and update the developer
      const developer = await Developer.findByIdAndUpdate(
        developerId,
        { accepted: true },
        { new: true }
      );
      
      if (!developer) {
        return res.status(404).json({
          success: false,
          message: "Developer application not found"
        });
      }
      
      // Find and update the user's role
      const user = await User.findByIdAndUpdate(
        developer.user,
        { role: "developer" },
        { new: true }
      );
      
      // Also update the student model's role if exists
      if (user) {
        await Student.findOneAndUpdate(
          { email: user.email },
          { role: "developer" },
          { new: true }
        );
      }
      
      res.status(200).json({
        success: true,
        message: "Developer application accepted successfully",
        developer
      });
    } catch (error) {
      console.error("❌ Error accepting developer application:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to accept developer application", 
        error: error.message 
      });
    }
  };

// Reject a developer application
exports.rejectDeveloperApplication = async (req, res) => {
  try {
    const { developerId } = req.params;
    
    // Find and delete the developer application
    const developer = await Developer.findByIdAndDelete(developerId);
    
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer application not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Developer application rejected successfully"
    });
  } catch (error) {
    console.error("❌ Error rejecting developer application:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to reject developer application", 
      error: error.message 
    });
  }
};

// Get all users with pagination
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get all users with pagination
    const users = await User.find()
      .select('username email role profilePicture')
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments();
    
    // Format user data
    const formattedUsers = await Promise.all(users.map(async user => {
      let userDetails = {
        _id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        status: "Active" // Default status
      };
      
      // Get phone number and additional details based on role
      if (user.role === 'developer') {
        const developer = await Developer.findOne({ user: user._id });
        if (developer) {
          userDetails.type = "Developer";
          userDetails.phone = developer.phone || "Not provided";
          userDetails.firstName = developer.firstName || "";
          userDetails.lastName = developer.lastName || "";
        }
      } else if (user.role === 'student') {
        const student = await Student.findOne({ email: user.email });
        if (student) {
          userDetails.type = "Student";
          userDetails.phone = student.phone || "Not provided";
          userDetails.firstName = student.firstName || "";
          userDetails.lastName = student.lastName || "";
        }
      }
      
      return userDetails;
    }));
    
    res.status(200).json({
      success: true,
      users: formattedUsers,
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error("❌ Error fetching all users:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch users", 
      error: error.message 
    });
  }
};

// Get developer details
exports.getDeveloperDetails = async (req, res) => {
  try {
    const { developerId } = req.params;
    
    // Find the developer application with all details
    const developer = await Developer.findById(developerId).populate('user', 'email _id');
    
    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer application not found"
      });
    }
    
    // Format detailed developer information including resume
    const developerDetails = {
      _id: developer._id,
      userId: developer.user ? developer.user._id : null,
      firstName: developer.firstName,
      lastName: developer.lastName,
      name: `${developer.firstName} ${developer.lastName}`,
      email: developer.user ? developer.user.email : 'No email available',
      programmingLanguages: developer.programmingLanguages || [],
      previousExperiences: developer.previousExperiences || [],
      projectsLink: developer.projectsLink || 'No projects link',
      degree: developer.degree || 'Not specified',
      discipline: developer.discipline || 'Not specified',
      yearOfCompletion: developer.yearOfCompletion || 'Not specified',
      dateOfBirth: developer.dateOfBirth,
      bio: developer.bio || 'No bio available',
      submittedDate: developer._id.getTimestamp(), // Get submission date from ObjectId
      resumeUrl: developer.resumeUrl || null // Include resume URL
    };
    
    res.status(200).json(developerDetails);
  } catch (error) {
    console.error("❌ Error fetching developer details:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch developer details", 
      error: error.message 
    });
  }
};

// Search users by name or email
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    // Create a case-insensitive regex for the search
    const searchRegex = new RegExp(query, 'i');
    
    // Search users by username or email
    const users = await User.find({
      $or: [
        { username: searchRegex },
        { email: searchRegex }
      ]
    }).select('username email role profilePicture').limit(10);
    
    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        users: []
      });
    }
    
    // Format user data
    const formattedUsers = await Promise.all(users.map(async user => {
      let userDetails = {
        _id: user._id,
        name: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || null,
        status: "Active" // Default status
      };
      
      // Get additional details based on role
      if (user.role === 'developer') {
        const developer = await Developer.findOne({ user: user._id });
        if (developer) {
          userDetails.type = "Developer";
          userDetails.accepted = developer.accepted;
        }
      } else if (user.role === 'student') {
        const student = await Student.findOne({ email: user.email });
        if (student) {
          userDetails.type = "Student";
        }
      }
      
      return userDetails;
    }));
    
    res.status(200).json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    console.error("❌ Error searching users:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to search users", 
      error: error.message 
    });
  }
};

// Get detailed user information for admin view
exports.getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId).select('username email role profilePicture createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Prepare user details object
    let userDetails = {
      _id: user._id,
      name: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || null,
      status: "Active", // Default status
      createdAt: user.createdAt
    };
    
    // Get role-specific details
    if (user.role === 'developer') {
      const developer = await Developer.findOne({ user: user._id });
      
      if (developer) {
        userDetails = {
          ...userDetails,
          firstName: developer.firstName || "",
          lastName: developer.lastName || "",
          bio: developer.bio || "No bio available",
          developerType: developer.developerType || "junior",
          programmingLanguages: developer.programmingLanguages || [],
          previousExperiences: developer.previousExperiences || [],
          projectsLink: developer.projectsLink || null,
          degree: developer.degree || "Not specified",
          discipline: developer.discipline || "Not specified",
          yearOfCompletion: developer.yearOfCompletion || null,
          dateOfBirth: developer.dateOfBirth || null,
          revenue: developer.revenue || { total: 0, monthly: {} },
          orders: developer.orders || []
        };
      }
    } else if (user.role === 'student') {
      const student = await Student.findOne({ email: user.email });
      
      if (student) {
        userDetails = {
          ...userDetails,
          firstName: student.firstName || "",
          lastName: student.lastName || "",
          dateOfBirth: student.dateOfBirth || null,
          degree: student.degree || "Not specified",
          discipline: student.discipline || "Not specified",
          degreeStartDate: student.degreeStartDate || null,
          degreeEndDate: student.degreeEndDate || null,
          spendingOverview: student.spendingOverview || { totalSpent: 0 },
          projects: student.projects || [],
          invoices: student.invoices || [],
          paymentMethods: student.paymentMethods || []
        };
      }
    }
    
    res.status(200).json(userDetails);
  } catch (error) {
    console.error("❌ Error fetching user details:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch user details", 
      error: error.message 
    });
  }
};

module.exports = exports;