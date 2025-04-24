const Discussion = require('../models/DiscussionModel');
const User = require('../models/UserModel');
const Question = require('../models/question'); 
const Reply = require('../models/reply');

exports.addQuestion = async (req, res) => {
  try {
      console.log("🔹 Inside addQuestion, Request User:", req.user); // Debugging line

      if (!req.user) {
          return res.status(401).json({ message: "Unauthorized: No user found in request" });
      }

      const { question, description, tags } = req.body;
      const user = await User.findById(req.user._id);

      if (!user) {
          return res.status(404).json({ message: "User not found" });
      }

      // Process the tags: if no tags provided, extract them from question and description
      let questionTags = tags || [];
      if (!tags || tags.length === 0) {
          questionTags = extractTags(question + " " + description);
      }

      const newQuestion = await Question.create({
          question,
          description,
          author: req.user._id, 
          tags: questionTags,
      });

      res.status(201).json(newQuestion);
  } catch (error) {
      console.error("🚨 Failed to add a new question:", error);
      res.status(500).json({ message: "Server Error", error });
  }
};

// Function to extract tech tags from text
function extractTags(text) {
    // Common tech keywords to look for
    const techKeywords = [
        'react', 'angular', 'vue', 'javascript', 'typescript', 'node.js', 'express',
        'mongodb', 'sql', 'postgresql', 'mysql', 'python', 'django', 'flask',
        'java', 'spring', 'c#', '.net', 'php', 'laravel', 'ruby', 'rails',
        'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'graphql', 'rest',
        'html', 'css', 'sass', 'tailwind', 'bootstrap', 'redux', 'swift',
        'kotlin', 'android', 'ios', 'flutter', 'react native', 'tensorflow',
        'pytorch', 'machine learning', 'ai'
        // Add more relevant tech keywords for your forum
    ];

    const content = text.toLowerCase();
    const extractedTags = [];

    techKeywords.forEach(keyword => {
        // Use regex with word boundaries to match whole words
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        if (regex.test(content) && !extractedTags.includes(keyword)) {
            extractedTags.push(keyword);
        }
    });

    return extractedTags;
}

exports.answerQuestion = async (req, res) => {
  try {
    const { reply } = req.body;
    const { id: questionId } = req.params;

    console.log("Received Reply:", reply);
    console.log("Question ID:", questionId);
    console.log("User Object:", req.user); // ✅ Debugging user object

    if (!req.user || !req.user._id) {
      console.error("❌ User not authenticated");
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if question exists
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Create and save reply
    const newReply = new Reply({
      reply,
      author: req.user._id, // ✅ Ensure user ID is set
    });

    await newReply.save();

    // Add reply to the question's replies array
    question.replies.push(newReply._id);
    await question.save();

    res.status(201).json({ message: "Reply added successfully", reply: newReply });
  } catch (error) {
    console.error("❌ Error adding answer:", error);
    res.status(500).json({ message: "Server Error", error });
  }
};

exports.getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find({})
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          model: 'User' // Adjust this according to your User model name if different
        }
      })
      .populate("author")
      .sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error); // Logging the error to the console for debugging
    res.status(500).json({ message: "Server Error", error: error.message }); // Sending the error message for debugging purposes
  }
};

exports.upvoteQuestion = async (req, res) => {
    try {
      const { id: questionId } = req.params;
      const userId = req.user._id; // Extracting user ID from authentication middleware
  
      const findQuestion = await Question.findById(questionId);
  
      if (findQuestion.upvote.includes(userId)) {
        return res.status(400).json({ message: "You have already upvoted" });
      }
  
      if (findQuestion.downvote.includes(userId)) {
        await Question.findByIdAndUpdate(questionId, {
          $pull: { downvote: userId },
        });
      }
  
      await Question.findByIdAndUpdate(questionId, {
        $push: { upvote: userId },
      });
  
      res.status(200).json({ message: "Upvote successful" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error });
    }
  };
  
exports.downvoteQuestion = async (req, res) => {
    try {
      const { id: questionId } = req.params;
      const userId = req.user._id; // Extracting user ID from authentication middleware
  
      const findQuestion = await Question.findById(questionId);
  
      if (findQuestion.downvote.includes(userId)) {
        return res.status(400).json({ message: "You have already downvoted" });
      }
  
      if (findQuestion.upvote.includes(userId)) {
        await Question.findByIdAndUpdate(questionId, {
          $pull: { upvote: userId },
        });
      }
  
      await Question.findByIdAndUpdate(questionId, {
        $push: { downvote: userId },
      });
  
      res.status(200).json({ message: "Downvote successful" });
    } catch (error) {
      res.status(500).json({ message: "Server Error", error });
    }
};
  
exports.findQuestionsByTopic = async (req, res) => {
    try {
        const { topic } = req.params;
        const questions = await Question.find({
            tags: { $in: [topic] }
        })
            .populate("replies")
            .populate("author")
            .sort({ createdAt: -1 });
        res.status(200).json(questions);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
};

exports.getMyQuestions = async (req, res) => {
    console.log("Fetching questions for user ID:", req.user._id); // Log the user ID for debugging
    try {
        const questions = await Question.find({ author: req.user._id })
            .populate("replies")
            .populate("author", "username profilePicture _id") // Specify fields to return in the populate method
            .sort({ createdAt: -1 });

        console.log("Questions fetched:", questions); // Log the fetched questions for debugging
        res.status(200).json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error); // Log errors more explicitly
        res.status(500).json({ message: "Server Error", error });
    }
};

// New function to get trending tags
exports.getTrendingTags = async (req, res) => {
    try {
        // Get trending tags using MongoDB aggregation
        const trendingTags = await Question.aggregate([
            // Unwind tags to have one document per tag
            { $unwind: "$tags" },
            
            // Group by tag and count occurrences
            { 
                $group: { 
                    _id: "$tags", 
                    count: { $sum: 1 },
                    lastUsed: { $max: "$createdAt" } // Keep track of most recent usage
                } 
            },
            
            // Sort by count (descending) and then by recency (descending)
            { $sort: { count: -1, lastUsed: -1 } },
            
            // Limit to top results
            { $limit: 10 },
            
            // Reshape for client
            { 
                $project: { 
                    _id: 1,
                    name: "$_id", 
                    count: 1
                } 
            }
        ]);
        
        res.status(200).json(trendingTags);
    } catch (error) {
        console.error("Error fetching trending tags:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * Search for questions based on query text
 * @route GET /api/discussion/search
 * @access Private
 */
exports.searchQuestions = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Create a regex for case-insensitive search
    const searchRegex = new RegExp(query, 'i');
    
    // Search in question title, description, and tags
    const questions = await Question.find({
      $or: [
        { question: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    })
    .populate({
      path: 'author',
      select: 'username profilePicture' // Select only necessary fields
    })
    .sort({ createdAt: -1 }) // Sort by newest first
    .limit(10); // Limit to 10 results for better performance
    
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error searching questions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

/**
 * Get a single question by ID
 * Works with your Discussion model schema
 * @route GET /api/discussion/questions/:id
 * @access Private
 */
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Attempting to find question with ID: ${id}`);
    
    // Check if ID is valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid question ID format: ${id}`);
      return res.status(400).json({ message: "Invalid question ID format" });
    }
      const questions = await Question.find({})
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          model: 'User' // Adjust this according to your User model name if different
        }
      })
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
};