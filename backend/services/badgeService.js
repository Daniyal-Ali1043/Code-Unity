const { developerBadges, studentBadges, Badge } = require('../models/BadgeSystem');
const Developer = require('../models/DeveloperModel');
const Student = require('../models/StudentModel');

/**
 * Checks and assigns badges to a developer based on their achievements
 * @param {string} developerId - The developer's MongoDB ID
 */
const checkAndAssignDeveloperBadges = async (developerId) => {
  try {
    // First try to find by direct ID
    let developer = await Developer.findById(developerId);
    
    // If not found, try to find by user reference
    if (!developer) {
      developer = await Developer.findOne({ user: developerId });
      
      if (!developer) {
        return {
          success: false,
          error: 'Developer profile not found. Please complete your profile first.'
        };
      }
    }
    
    // Initialize badges field if it doesn't exist
    if (!developer.badges) {
      developer.badges = {
        earned: [],
        activeBadgeId: null
      };
    }
    
    if (!developer.badges.earned) {
      developer.badges.earned = [];
    }

    const earnedBadgeIds = developer.badges.earned.map(badge => badge.badgeId) || [];
    const newBadges = [];

    // Add a helper function to verify badge exists before adding it
    const verifyBadgeExists = async (badgeId) => {
      try {
        const badge = await Badge.findOne({ id: badgeId });
        return !!badge; // Returns true if badge exists, false otherwise
      } catch (error) {
        console.error(`Error verifying badge ${badgeId}:`, error);
        return false;
      }
    };

    // Check for NEW_TALENT badge (automatic when they become a developer)
    if (!earnedBadgeIds.includes(developerBadges.NEW_TALENT.id)) {
      const badgeExists = await verifyBadgeExists(developerBadges.NEW_TALENT.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: developerBadges.NEW_TALENT.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${developerBadges.NEW_TALENT.id} not found in database`);
      }
    }

    // Check for RISING_STAR badge (5 completed projects)
    const completedProjects = developer.orders?.filter(order => 
      order.status === 'completed'
    ).length || 0;

    if (completedProjects >= 5 && !earnedBadgeIds.includes(developerBadges.RISING_STAR.id)) {
      const badgeExists = await verifyBadgeExists(developerBadges.RISING_STAR.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: developerBadges.RISING_STAR.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${developerBadges.RISING_STAR.id} not found in database`);
      }
    }

    // Check for CODE_MAVEN badge (20 completed projects)
    if (completedProjects >= 20 && !earnedBadgeIds.includes(developerBadges.CODE_MAVEN.id)) {
      const badgeExists = await verifyBadgeExists(developerBadges.CODE_MAVEN.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: developerBadges.CODE_MAVEN.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${developerBadges.CODE_MAVEN.id} not found in database`);
      }
    }

    // Check for WELL_RATED badge (average rating 4+)
    if (developer.ratings?.average >= 4 && !earnedBadgeIds.includes(developerBadges.WELL_RATED.id)) {
      const badgeExists = await verifyBadgeExists(developerBadges.WELL_RATED.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: developerBadges.WELL_RATED.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${developerBadges.WELL_RATED.id} not found in database`);
      }
    }

    // Check for TOP_PERFORMER badge (average rating 4.5+ with at least 10 reviews)
    if (developer.ratings?.average >= 4.5 && developer.ratings?.count >= 10 && 
        !earnedBadgeIds.includes(developerBadges.TOP_PERFORMER.id)) {
      const badgeExists = await verifyBadgeExists(developerBadges.TOP_PERFORMER.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: developerBadges.TOP_PERFORMER.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${developerBadges.TOP_PERFORMER.id} not found in database`);
      }
    }

    // Add ON_TIME_DELIVERY badge logic
    const onTimeDeliveries = developer.orders?.filter(order => {
      // Simple check: if the order is completed and has a completion date
      return order.status === 'completed' && order.completionDate;
    }).length || 0;

    if (onTimeDeliveries >= 10 && !earnedBadgeIds.includes(developerBadges.ON_TIME_DELIVERY.id)) {
      const badgeExists = await verifyBadgeExists(developerBadges.ON_TIME_DELIVERY.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: developerBadges.ON_TIME_DELIVERY.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${developerBadges.ON_TIME_DELIVERY.id} not found in database`);
      }
    }

    // If new badges were earned, update the developer
    if (newBadges.length > 0) {
      // Prepare the update (use $addToSet to avoid duplicates)
      const update = {
        $push: { 'badges.earned': { $each: newBadges } }
      };

      // If no active badge is set, set the first earned badge as active
      if (!developer.badges.activeBadgeId && newBadges.length > 0) {
        update.$set = { 'badges.activeBadgeId': newBadges[0].badgeId };
      }

      // Update the developer with new badges
      await Developer.findByIdAndUpdate(developer._id, update);
      
      return {
        success: true,
        newBadges: newBadges.map(b => b.badgeId)
      };
    }

    return {
      success: true,
      newBadges: []
    };
  } catch (error) {
    console.error('Error assigning developer badges:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Checks and assigns badges to a student based on their achievements
 * @param {string} studentId - The student's MongoDB ID
 */
const checkAndAssignStudentBadges = async (studentId) => {
  try {
    // First try to find by direct ID
    let student = await Student.findById(studentId);
    
    // If not found, try to find by user reference
    if (!student) {
      student = await Student.findOne({ user: studentId });
      
      if (!student) {
        return {
          success: false,
          error: 'Student profile not found. Please complete your profile first.'
        };
      }
    }
    
    // Initialize badges field if it doesn't exist
    if (!student.badges) {
      student.badges = {
        earned: [],
        activeBadgeId: null
      };
    }
    
    if (!student.badges.earned) {
      student.badges.earned = [];
    }

    const earnedBadgeIds = student.badges.earned.map(badge => badge.badgeId) || [];
    const newBadges = [];

    // Add a helper function to verify badge exists before adding it
    const verifyBadgeExists = async (badgeId) => {
      try {
        const badge = await Badge.findOne({ id: badgeId });
        return !!badge; // Returns true if badge exists, false otherwise
      } catch (error) {
        console.error(`Error verifying badge ${badgeId}:`, error);
        return false;
      }
    };

    // Check for NEWCOMER badge (automatic when they become a student)
    if (!earnedBadgeIds.includes(studentBadges.NEWCOMER.id)) {
      const badgeExists = await verifyBadgeExists(studentBadges.NEWCOMER.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: studentBadges.NEWCOMER.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${studentBadges.NEWCOMER.id} not found in database`);
      }
    }

    // Check total orders placed
    const totalOrders = student.orders?.length || 0;

    // Check for FIRST_PROJECT badge
    if (totalOrders >= 1 && !earnedBadgeIds.includes(studentBadges.FIRST_PROJECT.id)) {
      const badgeExists = await verifyBadgeExists(studentBadges.FIRST_PROJECT.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: studentBadges.FIRST_PROJECT.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${studentBadges.FIRST_PROJECT.id} not found in database`);
      }
    }

    // Check for REGULAR badge (5 orders placed)
    if (totalOrders >= 5 && !earnedBadgeIds.includes(studentBadges.REGULAR.id)) {
      const badgeExists = await verifyBadgeExists(studentBadges.REGULAR.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: studentBadges.REGULAR.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${studentBadges.REGULAR.id} not found in database`);
      }
    }

    // Check for DEDICATED_LEARNER badge (20 orders placed)
    if (totalOrders >= 20 && !earnedBadgeIds.includes(studentBadges.DEDICATED_LEARNER.id)) {
      const badgeExists = await verifyBadgeExists(studentBadges.DEDICATED_LEARNER.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: studentBadges.DEDICATED_LEARNER.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${studentBadges.DEDICATED_LEARNER.id} not found in database`);
      }
    }

    // Count positive feedback from developers
    const positiveFeedbacks = student.orders?.filter(order => 
      order.studentFeedback && order.studentFeedback.rating >= 4
    ).length || 0;

    // Check for TOP_CLIENT badge (10+ positive ratings)
    if (positiveFeedbacks >= 10 && !earnedBadgeIds.includes(studentBadges.TOP_CLIENT.id)) {
      const badgeExists = await verifyBadgeExists(studentBadges.TOP_CLIENT.id);
      if (badgeExists) {
        newBadges.push({
          badgeId: studentBadges.TOP_CLIENT.id,
          dateEarned: new Date()
        });
      } else {
        console.error(`Badge ${studentBadges.TOP_CLIENT.id} not found in database`);
      }
    }

    // If new badges were earned, update the student
    if (newBadges.length > 0) {
      // Prepare the update
      const update = {
        $push: { 'badges.earned': { $each: newBadges } }
      };

      // If no active badge is set, set the first earned badge as active
      if (!student.badges.activeBadgeId && newBadges.length > 0) {
        update.$set = { 'badges.activeBadgeId': newBadges[0].badgeId };
      }

      // Update the student with new badges
      await Student.findByIdAndUpdate(student._id, update);
      
      return {
        success: true,
        newBadges: newBadges.map(b => b.badgeId)
      };
    }

    return {
      success: true,
      newBadges: []
    };
  } catch (error) {
    console.error('Error assigning student badges:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sets the active badge for a user
 * @param {string} userId - The user's MongoDB ID
 * @param {string} badgeId - The badge ID to set as active
 * @param {string} role - The user role ('developer' or 'student')
 */
const setActiveBadge = async (userId, badgeId, role) => {
  try {
    // Determine the correct model based on role
    const Model = role === 'developer' ? Developer : Student;
    
    // Find the user record
    let user = await Model.findById(userId);
    
    // If user record not found by direct ID, try finding by user reference
    if (!user) {
      user = await Model.findOne({ user: userId });
      
      if (!user) {
        return {
          success: false,
          error: `No ${role} profile found. Please complete your profile first.`
        };
      }
    }
    
    // Check if the user has any badges
    if (!user.badges || !user.badges.earned || user.badges.earned.length === 0) {
      return {
        success: false,
        error: 'User has not earned any badges yet'
      };
    }
    
    // Verify the user has earned this badge
    const hasBadge = user.badges.earned.some(badge => badge.badgeId === badgeId);
    if (!hasBadge) {
      return {
        success: false,
        error: 'User does not have this badge'
      };
    }
    
    // Update the active badge
    await Model.findByIdAndUpdate(user._id, {
      'badges.activeBadgeId': badgeId
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error(`Error setting active badge for ${role}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Gets the details for a specific badge
 * @param {string} badgeId - The badge ID to fetch details for
 */
const getBadgeDetails = async (badgeId) => {
  try {
    const badge = await Badge.findOne({ id: badgeId });
    if (!badge) {
      console.warn(`Badge with ID ${badgeId} not found in database`);
      return {
        success: false,
        error: 'Badge not found'
      };
    }
    
    return {
      success: true,
      badge
    };
  } catch (error) {
    console.error('Error fetching badge details:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Gets all earned badges for a user
 * @param {string} userId - The user's MongoDB ID
 * @param {string} role - The user's role ('developer' or 'student')
 */
const getUserBadges = async (userId, role) => {
  try {
    // Determine the correct model based on role
    const Model = role === 'developer' ? Developer : Student;
    
    // Find the user and get their badges
    const user = await Model.findById(userId);
    
    // If user is not found, check if they exist but with a different ID structure
    if (!user) {
      // Check if the user exists by user reference
      const userByRef = await Model.findOne({ user: userId });
      
      if (userByRef) {
        // If found with user reference, use this record instead
        if (!userByRef.badges) {
          return {
            success: true,
            badges: [],
            activeBadgeId: null
          };
        }
        
        // Get badge details for all earned badges
        const badgePromises = userByRef.badges.earned?.map(async (badge) => {
          try {
            const badgeDetails = await Badge.findOne({ id: badge.badgeId });
            if (!badgeDetails) {
              console.warn(`Badge with ID ${badge.badgeId} not found in database`);
              return null;
            }
            return {
              ...badgeDetails.toObject(),
              dateEarned: badge.dateEarned,
              isDisplayed: badge.isDisplayed
            };
          } catch (error) {
            console.error(`Error fetching badge details for ${badge.badgeId}:`, error);
            return null;
          }
        }) || [];
        
        const badges = (await Promise.all(badgePromises)).filter(badge => badge !== null);
        
        return {
          success: true,
          badges,
          activeBadgeId: userByRef.badges.activeBadgeId
        };
      }
      
      // If user doesn't exist at all, return empty badges instead of error
      console.log(`User with ID ${userId} not found in ${role} model, returning empty badges`);
      return {
        success: true,
        badges: [],
        activeBadgeId: null
      };
    }
    
    // If user has no badges yet, initialize the field
    if (!user.badges) {
      return {
        success: true,
        badges: [],
        activeBadgeId: null
      };
    }
    
    // Get badge details for all earned badges
    const badgePromises = user.badges.earned?.map(async (badge) => {
      try {
        const badgeDetails = await Badge.findOne({ id: badge.badgeId });
        if (!badgeDetails) {
          console.warn(`Badge with ID ${badge.badgeId} not found in database`);
          return null;
        }
        return {
          ...badgeDetails.toObject(),
          dateEarned: badge.dateEarned,
          isDisplayed: badge.isDisplayed
        };
      } catch (error) {
        console.error(`Error fetching badge details for ${badge.badgeId}:`, error);
        return null;
      }
    }) || [];
    
    const badges = (await Promise.all(badgePromises)).filter(badge => badge !== null);
    
    return {
      success: true,
      badges,
      activeBadgeId: user.badges.activeBadgeId
    };
  } catch (error) {
    console.error(`Error fetching badges for ${role}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  checkAndAssignDeveloperBadges,
  checkAndAssignStudentBadges,
  setActiveBadge,
  getBadgeDetails,
  getUserBadges
}; 