const mongoose = require("mongoose");
const User = require("./UserModel"); // Import User model for data reference

// Define the Order Schema (Sub-document)
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  offerId: {
    type: String,
    required: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Developer",
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
  proDiscountApplied: {
    type: Boolean,
    default: false
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
    unique: true
  },
  orderId: {
    type: String,
    required: true
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Developer",
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

// Define the Project Schema (Sub-document)
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Working", "Canceled", "Done"],
    default: "Working"
  },
  completion: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  orderId: {
    type: String,
    ref: "orders.orderId"
  },
  developer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Developer"
  }
});

// Student schema
const studentSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    default: null
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  degree: {
    type: String,
    enum: ["Bachelor's", "Master's", "PhD"],
    default: "Bachelor's"
  },
  discipline: {
    type: String
  },
  degreeStartDate: {
    type: Date
  },
  degreeEndDate: {
    type: Date
  },
  role: {
    type: String,
    enum: ["student"],
    default: "student"
  },
  // Subscription data
  subscription: {
    isPro: {
      type: Boolean,
      default: false
    },
    subscriptionId: {
      type: String,
      default: null
    },
    customerId: {
      type: String,
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "canceled", "incomplete", "past_due", "trialing", "unpaid", null],
      default: null
    },
    lastPaymentDate: {
      type: Date,
      default: null
    }
  },
  // Payment Methods Data
  paymentMethods: [
    {
      cardType: {
        type: String,
        enum: ["MasterCard", "Visa"],
        required: true
      },
      cardNumber: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      default: {
        type: Boolean,
        default: false
      }
    }
  ],
  // Updated Orders and Invoices
  orders: {
    type: [orderSchema],
    default: [] // Changed from undefined or missing default to empty array
  },
  invoices: {
    type: [invoiceSchema],
    default: [] // Changed from undefined or missing default to empty array
  },
  // Projects Data (now linked to orders)
  projects: {
    type: [projectSchema],
    default: [] // Changed from undefined or missing default to empty array
  },
  // Spending statistics
  spending: {
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
  }
});

// Pre-save middleware to populate fields from User model
studentSchema.pre("save", async function (next) {
  if (!this.isNew) return next();

  try {
    const user = await User.findById(this._id); // Fetch user details using _id
    if (!user) throw new Error("User not found");

    // Split the username into first and last name
    const [firstName, ...lastNameParts] = user.username.trim().split(" ");
    this.firstName = firstName;
    this.lastName = lastNameParts.length > 0 ? lastNameParts.join(" ") : null;

    // Assign email, role, and profile picture
    this.email = user.email;
    this.role = user.role || "student";
    this.profilePicture = user.profilePicture || null;

    next();
  } catch (error) {
    next(error);
  }
});

// Method to update spending when a new order is placed
studentSchema.methods.updateSpending = async function(amount) {
  try {
    // Update total spending
    if (!this.spending) {
      this.spending = {
        total: 0,
        monthly: new Map(),
        yearly: new Map()
      };
    }
    
    this.spending.total = (this.spending.total || 0) + amount;
    
    // Update monthly spending
    const date = new Date();
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const monthValue = this.spending.monthly.get(monthKey) || 0;
    this.spending.monthly.set(monthKey, monthValue + amount);
    
    // Update yearly spending
    const yearKey = `${date.getFullYear()}`;
    const yearValue = this.spending.yearly.get(yearKey) || 0;
    this.spending.yearly.set(yearKey, yearValue + amount);
    
    return await this.save();
  } catch (error) {
    console.error("Error updating spending:", error);
    throw error;
  }
};

// Export the Student model
const Student = mongoose.model("Student", studentSchema);

module.exports = Student;