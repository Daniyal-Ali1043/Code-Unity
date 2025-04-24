const Review = require('../models/ReviewModel.js')




const getAllReviews = async (req, res) => {
    const { developerId } = req.params;
    try {
        const allReviews = await Review.find({ developer: developerId });

        if (!allReviews) {
            return res.status(404).json({
                status: 404,
                message: "No reviews found",
            });
        }

        return res.status(200).json({
            status: 200,
            data: { allReviews },
            message: "Successfully fetched reviews",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};

const addReview = async (req, res) => {
    const { developerId } = req.params;
    const { message } = req.body;
    try {
        if (!message || message === "") {
            return res.status(400).json({
                status: 400,
                message: "Message cannot be empty",
            });
        }

        const review = await Review.create({
            message,
            developer: developerId,
            user: req.user._id,
        });

        return res.status(201).json({
            status: 201,
            data: review,
            message: "Review added successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};


const deleteReview = async (req, res) => {
    const { reviewId } = req.params;
    try {
        const review = await Review.findOneAndDelete({ _id: reviewId, user: req.user._id });

        if (!review) {
            return res.status(404).json({
                status: 404,
                message: "Review not found or you are not authorized to delete it",
            });
        }

        return res.status(200).json({
            status: 200,
            message: "Review deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};




module.exports = {
    getAllReviews,
    addReview,
    deleteReview,
};
