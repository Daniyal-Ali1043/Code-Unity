const mongoose = require("mongoose");

// Define the schema for the Rating model
const ratingSchema = new mongoose.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
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

// Create the Rating model
const Rating = mongoose.model("Rating", ratingSchema);

// Export the model
module.exports = Rating;
