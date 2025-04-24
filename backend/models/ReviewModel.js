const mongoose = require("mongoose");

// Define the schema for the Review model
const reviewSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
    },
    developer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Developer",
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Create the Review model
const Review = mongoose.model("Review", reviewSchema);

// Export the model
module.exports = Review;
