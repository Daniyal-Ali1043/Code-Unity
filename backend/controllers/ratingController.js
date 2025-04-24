const Rating = require('../models/RatingModel.js')


const rateDeveloper = async (req, res) => {
    const { developerId } = req.params;
    const { rating } = req.body;
    try {
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                status: 400,
                message: "Invalid rating. Please provide a rating between 1 and 5.",
            });
        }

        const developerRating = await Rating.create({
            developer: developerId,
            rating,
            user: req.user._id,
        });

        return res.status(201).json({
            status: 201,
            data: developerRating,
            message: "Rating submitted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            message: "Internal server error",
        });
    }
};


module.exports = {
    rateDeveloper,
};
