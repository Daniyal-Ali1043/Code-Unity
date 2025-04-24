const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { Badge, initializeBadges } = require('../models/BadgeSystem');
const badgeService = require('../services/badgeService');

// Initialize badges (admin only)
router.post('/initialize', protect, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can initialize badges' 
      });
    }
    
    // Check if badges already exist
    const existingCount = await Badge.countDocuments();
    
    if (existingCount > 0) {
      return res.status(200).json({ 
        success: true, 
        message: `Badges already initialized (${existingCount} badges found)` 
      });
    }
    
    // Initialize badges
    await initializeBadges();
    
    // Verify initialization
    const newCount = await Badge.countDocuments();
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully initialized ${newCount} badges` 
    });
  } catch (error) {
    console.error('Error initializing badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all available badges
router.get('/all', protect, async (req, res) => {
  try {
    const badges = await Badge.find({});
    res.status(200).json({ success: true, badges });
  } catch (error) {
    console.error('Error fetching all badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get badges for specific role
router.get('/role/:role', protect, async (req, res) => {
  try {
    const { role } = req.params;
    if (role !== 'developer' && role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    
    const badges = await Badge.find({ forRole: role });
    res.status(200).json({ success: true, badges });
  } catch (error) {
    console.error(`Error fetching badges for role ${req.params.role}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get badge details by ID
router.get('/details/:badgeId', protect, async (req, res) => {
  try {
    const { badgeId } = req.params;
    const result = await badgeService.getBadgeDetails(badgeId);
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    
    res.status(200).json({ success: true, badge: result.badge });
  } catch (error) {
    console.error('Error fetching badge details:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get current user's badges
router.get('/user', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    
    if (role !== 'developer' && role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }
    
    const result = await badgeService.getUserBadges(userId, role);
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    
    res.status(200).json({ 
      success: true, 
      badges: result.badges,
      activeBadgeId: result.activeBadgeId
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get badges of a specific user
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.query;
    
    if (!role || (role !== 'developer' && role !== 'student')) {
      return res.status(400).json({ success: false, message: 'Invalid or missing role parameter' });
    }
    
    const result = await badgeService.getUserBadges(userId, role);
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: result.error });
    }
    
    res.status(200).json({ 
      success: true, 
      badges: result.badges,
      activeBadgeId: result.activeBadgeId
    });
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Set active badge
router.put('/active/:badgeId', protect, async (req, res) => {
  try {
    const { badgeId } = req.params;
    const userId = req.user._id;
    const role = req.user.role;
    
    if (role !== 'developer' && role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }
    
    const result = await badgeService.setActiveBadge(userId, badgeId, role);
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    
    res.status(200).json({ success: true, message: 'Active badge updated successfully' });
  } catch (error) {
    console.error('Error setting active badge:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check and assign badges for current user (for testing/debugging)
router.post('/check-badges', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;
    
    // Check if role is valid
    if (role !== 'developer' && role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid user role' });
    }
    
    // If the user has a valid role but no record exists yet, return empty badges
    const Model = role === 'developer' ? require('../models/DeveloperModel') : require('../models/StudentModel');
    const userExists = await Model.exists({ _id: userId }) || await Model.exists({ user: userId });
    
    if (!userExists) {
      return res.status(200).json({ 
        success: true, 
        message: 'No user record found for the role. Please complete your profile first.',
        newBadges: []
      });
    }
    
    // Proceed with badge assignment if user record exists
    let result;
    if (role === 'developer') {
      result = await badgeService.checkAndAssignDeveloperBadges(userId);
    } else if (role === 'student') {
      result = await badgeService.checkAndAssignStudentBadges(userId);
    }
    
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Badge check completed',
      newBadges: result.newBadges
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// For development purposes - initialize badges without requiring admin
router.get('/dev/initialize', async (req, res) => {
  try {
    // Check if badges already exist
    const existingCount = await Badge.countDocuments();
    
    if (existingCount > 0) {
      return res.status(200).json({ 
        success: true, 
        message: `Badges already initialized (${existingCount} badges found)` 
      });
    }
    
    // Initialize badges
    await initializeBadges();
    
    // Verify initialization
    const newCount = await Badge.countDocuments();
    
    res.status(200).json({ 
      success: true, 
      message: `Successfully initialized ${newCount} badges` 
    });
  } catch (error) {
    console.error('Error initializing badges:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router; 