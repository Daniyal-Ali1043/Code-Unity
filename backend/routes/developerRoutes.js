const express = require("express");
const protect = require("../middleware/authMiddleware");
const developer = require("../middleware/developerMiddleware");
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer storage for resume uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create a unique filename with timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        cb(null, 'resume-' + uniqueSuffix + fileExt);
    }
});

// File filter to only accept PDF, DOC, and DOCX files
const fileFilter = (req, file, cb) => {
    const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'), false);
    }
};

// Configure multer upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

const { 
    applyForDeveloper,
    checkApplication,
    getApplicationStatus,
    getDevelopers,
    getDeveloperProfile
} = require("../controllers/developerController");

const router = express.Router();

// Changed from upload.array('files') to upload.single('resume')
router.post('/apply', protect, upload.single('resume'), applyForDeveloper);
router.get('/check-application', protect, checkApplication);
router.get('/application-status', protect, getApplicationStatus);
router.get("/profile", protect, getDeveloperProfile);
router.get('/', protect, getDevelopers); // Route to fetch all developers

module.exports = router;