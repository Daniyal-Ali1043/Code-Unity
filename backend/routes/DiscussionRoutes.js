const express = require("express");
const router = express.Router();
const {
  getAllQuestions,
  addQuestion,
  getMyQuestions,
  answerQuestion,
  upvoteQuestion,
  downvoteQuestion,
  findQuestionsByTopic,
  getAllUsers,
  getTrendingTags,
  searchQuestions,
  getQuestionById // Add this import
} = require("../controllers/discussionController");
const protect = require("../middleware/authMiddleware"); // Ensure user authentication

// Questions Routes
router.get("/questions", protect, getAllQuestions);
router.get("/questions/:id", protect, getQuestionById); // Add this new route
router.post("/ask-question", protect, addQuestion);
router.get("/my-questions", protect, getMyQuestions);
router.get("/find/:topic", findQuestionsByTopic);

// Trending Tags Route
router.get("/trending-tags", protect, getTrendingTags);

// Answers Routes
router.post("/questions/:id/answers", protect, answerQuestion);

// Voting Routes
router.post("/upvote/:id", protect, upvoteQuestion);
router.post("/downvote/:id", protect, downvoteQuestion);

// User Routes
router.get("/allusers", getAllUsers);
router.get('/search', protect, searchQuestions);
// Get single question route
router.get("/questions/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Direct route - Attempting to find question with ID: ${id}`);
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid question ID format: ${id}`);
      return res.status(400).json({ message: "Invalid question ID format" });
    }
    
    // Try to find the question in the collection
    const question = await Question.findById(id)
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          model: 'User',
          select: 'username profilePicture'
        }
      })
      .populate('author', 'username profilePicture');
    
    if (!question) {
      console.log(`Question not found with ID: ${id}`);
      return res.status(404).json({ message: 'Question not found' });
    }
    
    console.log(`Successfully found question with ID: ${id}`);
    res.status(200).json(question);
  } catch (error) {
    console.error('Error fetching question by ID:', error);
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message
    });
  }
});
module.exports = router;