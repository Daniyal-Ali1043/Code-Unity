const mongoose = require("mongoose");

// Define the Order Schema (Sub-document)
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  offerId: {
    type: String,
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "in-progress", "delivered", "completed", "cancelled"],
    default: "pending"
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date
  },
  paymentId: {
    type: String,
    required: true
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    tags: {
      type: [String]
    }
  },
  studentFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    tags: {
      type: [String]
    }
  }
});

// Define the Invoice Schema (Sub-document)
const invoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true,
    // Remove the unique constraint at the schema level
  },
  orderId: {
    type: String,
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["paid", "pending", "cancelled"],
    default: "pending"
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  paidDate: {
    type: Date
  },
  pdfLink: {
    type: String
  }
});

// Define the Developer Schema
const developerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  degree: {
    type: String,
    required: true
  },
  discipline: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true
  },
  bio: {
    type: String
  },
  programmingLanguages: {
    type: [String],
    required: true,
    validate: [arrayLimit, '{PATH} exceeds the limit of 3'] // Ensures no more than 3 languages
  },
  previousExperiences: {
    type: [String],
    required: true
  },
  projectsLink: {
    type: String,
    required: true
  },
  yearOfCompletion: {
    type: String,
    required: true
  },
  resumeUrl: {
    type: String,
    required: true
  },
  developerType: {
    type: String,
    enum: ['junior', 'senior'],
    default: 'junior'
  },
  accepted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  submitted: {
    type: Boolean,
    default: false // Field to track if developer profile has been submitted
  },
  rate: {
    type: Number,
    default: 0
  },
  // New fields for revenue and orders
  revenue: {
    total: {
      type: Number,
      default: 0
    },
    monthly: {
      type: Map,
      of: Number,
      default: () => new Map()
    },
    yearly: {
      type: Map,
      of: Number,
      default: () => new Map()
    }
  },
  // Badges and gamification
  badges: {
    earned: [
      {
        badgeId: {
          type: String,
          required: true
        },
        dateEarned: {
          type: Date,
          default: Date.now
        },
        isDisplayed: {
          type: Boolean,
          default: true
        }
      }
    ],
    activeBadgeId: {
      type: String,
      default: null
    }
  },
  // Experience points for gamification
  experiencePoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  orders: {
    type: [orderSchema],
    default: [] // Changed from undefined to empty array
  },
  invoices: {
    type: [invoiceSchema],
    default: [] // Changed from undefined to empty array
  },
  // Ratings and reviews from students
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    },
    details: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student"
        },
        rating: {
          type: Number,
          min: 1,
          max: 5
        },
        comment: {
          type: String
        },
        tags: {
          type: [String]
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ]
  }
});

// Helper function to limit array size
function arrayLimit(val) {
  return val.length <= 3;
}

// Method to update revenue when a new order is completed
developerSchema.methods.updateRevenue = async function(amount) {
  // Update total revenue
  this.revenue.total += amount;
  
  // Update monthly revenue
  const date = new Date();
  const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
  const monthValue = this.revenue.monthly.get(monthKey) || 0;
  this.revenue.monthly.set(monthKey, monthValue + amount);
  
  // Update yearly revenue
  const yearKey = `${date.getFullYear()}`;
  const yearValue = this.revenue.yearly.get(yearKey) || 0;
  this.revenue.yearly.set(yearKey, yearValue + amount);
  
  return this.save();
};

// Instead of creating an index at the schema level, we'll ensure uniqueness at the application level
// This helps prevent the duplicate key error for NULL values

// Create the Developer model
const Developer = mongoose.model("Developer", developerSchema);

// Export the model
module.exports = Developer;