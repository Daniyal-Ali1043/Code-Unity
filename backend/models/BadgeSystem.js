const mongoose = require('mongoose');

// Define badge types and their requirements
const developerBadges = {
  // Experience-based badges
  NEW_TALENT: {
    id: 'new_talent',
    name: 'New Talent',
    description: 'Joined as a developer',
    icon: 'new-talent-icon.png',
    category: 'experience',
    tier: 1
  },
  RISING_STAR: {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Completed 5 projects',
    icon: 'rising-star-icon.png',
    category: 'experience',
    tier: 2
  },
  CODE_MAVEN: {
    id: 'code_maven',
    name: 'Code Maven',
    description: 'Completed 20 projects',
    icon: 'code-maven-icon.png',
    category: 'experience',
    tier: 3
  },
  
  // Rating-based badges
  WELL_RATED: {
    id: 'well_rated',
    name: 'Well Rated',
    description: 'Achieved an average rating of 4+',
    icon: 'well-rated-icon.png',
    category: 'rating',
    tier: 1
  },
  TOP_PERFORMER: {
    id: 'top_performer',
    name: 'Top Performer',
    description: 'Achieved an average rating of 4.5+ with at least 10 reviews',
    icon: 'top-performer-icon.png',
    category: 'rating',
    tier: 2
  },

  // Specialty badges
  QUICK_RESPONDER: {
    id: 'quick_responder',
    name: 'Quick Responder',
    description: 'Responds to project inquiries within 24 hours',
    icon: 'quick-responder-icon.png',
    category: 'specialty',
    tier: 1
  },
  ON_TIME_DELIVERY: {
    id: 'on_time_delivery',
    name: 'On-Time Delivery',
    description: 'Delivered 10+ projects on time',
    icon: 'on-time-delivery-icon.png',
    category: 'specialty',
    tier: 2
  }
};

const studentBadges = {
  // Experience-based badges
  NEWCOMER: {
    id: 'newcomer',
    name: 'Newcomer',
    description: 'Created an account',
    icon: 'newcomer-icon.png',
    category: 'experience',
    tier: 1
  },
  REGULAR: {
    id: 'regular',
    name: 'Regular',
    description: 'Placed 5 orders',
    icon: 'regular-icon.png',
    category: 'experience',
    tier: 2
  },
  DEDICATED_LEARNER: {
    id: 'dedicated_learner',
    name: 'Dedicated Learner',
    description: 'Placed 20 orders',
    icon: 'dedicated-learner-icon.png',
    category: 'experience',
    tier: 3
  },
  
  // Feedback-based badges
  GOOD_COMMUNICATOR: {
    id: 'good_communicator',
    name: 'Good Communicator',
    description: 'Received positive feedback on communication',
    icon: 'good-communicator-icon.png',
    category: 'feedback',
    tier: 1
  },
  TOP_CLIENT: {
    id: 'top_client',
    name: 'Top Client',
    description: 'Received 10+ positive ratings from developers',
    icon: 'top-client-icon.png',
    category: 'feedback',
    tier: 2
  },
  
  // Specialty badges
  FIRST_PROJECT: {
    id: 'first_project',
    name: 'First Project',
    description: 'Completed first project',
    icon: 'first-project-icon.png',
    category: 'specialty',
    tier: 1
  },
  COMMUNITY_CONTRIBUTOR: {
    id: 'community_contributor',
    name: 'Community Contributor',
    description: 'Participated in the discussion forum with 5+ posts',
    icon: 'community-contributor-icon.png',
    category: 'specialty',
    tier: 2
  }
};

// Create a mongoose schema for Badge
const badgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['experience', 'rating', 'feedback', 'specialty']
  },
  tier: {
    type: Number,
    required: true,
    min: 1,
    max: 3
  },
  forRole: {
    type: String,
    required: true,
    enum: ['developer', 'student']
  }
});

// Badge model
const Badge = mongoose.model('Badge', badgeSchema);

// Function to initialize all badges in the database
const initializeBadges = async () => {
  try {
    // Check if badges already exist
    const existingCount = await Badge.countDocuments();
    if (existingCount > 0) {
      console.log('Badges already initialized, skipping...');
      return;
    }
    
    // Initialize developer badges
    const devBadgesToInsert = Object.values(developerBadges).map(badge => ({
      ...badge,
      forRole: 'developer'
    }));
    
    // Initialize student badges
    const studentBadgesToInsert = Object.values(studentBadges).map(badge => ({
      ...badge,
      forRole: 'student'
    }));
    
    // Combine all badges
    const allBadges = [...devBadgesToInsert, ...studentBadgesToInsert];
    
    // Insert all badges
    await Badge.insertMany(allBadges);
    console.log('All badges initialized successfully');
  } catch (error) {
    console.error('Error initializing badges:', error);
  }
};

module.exports = {
  Badge,
  initializeBadges,
  developerBadges,
  studentBadges
}; 