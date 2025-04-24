const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const auth = require('../middleware/authMiddleware');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/complaints');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept images, documents, and common attachment types
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx|xls/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and document files are allowed!'));
    }
  }
});

// Create email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "codeunityfyp@gmail.com",
    pass: "isro mtim sjsl lqrs",
  },
});

// Submit a complaint
router.post('/submit', auth, upload.array('files', 5), async (req, res) => {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      phone,
      contactPreference,
      complaintType, 
      comments, 
      orderId, 
      userId, 
      userRole 
    } = req.body;
    
    const files = req.files;
    
    // Validate required fields
    if (!firstName || !lastName || !complaintType || !comments || !contactPreference) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Validate contact information based on preference
    if (contactPreference === 'email' && !email) {
      return res.status(400).json({ message: 'Email is required based on your contact preference' });
    }
    
    if (contactPreference === 'phone' && !phone) {
      return res.status(400).json({ message: 'Phone number is required based on your contact preference' });
    }
    
    // Prepare email content
    let emailContent = `
      <h2>New Complaint Submission</h2>
      <p><strong>From:</strong> ${firstName} ${lastName}</p>
      <p><strong>User Role:</strong> ${userRole || 'Not specified'}</p>
      <p><strong>User ID:</strong> ${userId || 'Not specified'}</p>
      <p><strong>Contact Information:</strong></p>
      <ul>
        <li><strong>Email:</strong> ${email || 'Not provided'}</li>
        <li><strong>Phone:</strong> ${phone || 'Not provided'}</li>
        <li><strong>Preferred Contact Method:</strong> ${contactPreference}</li>
      </ul>
      <p><strong>Complaint Type:</strong> ${complaintType}</p>
      ${orderId ? `<p><strong>Order ID:</strong> ${orderId}</p>` : ''}
      <h3>Comments:</h3>
      <p>${comments}</p>
    `;
    
    // Add attachments info if any
    if (files && files.length > 0) {
      emailContent += `<h3>Attachments:</h3><ul>`;
      files.forEach(file => {
        emailContent += `<li>${file.originalname} (${file.size} bytes)</li>`;
      });
      emailContent += `</ul>`;
    }
    
    // Configure email options
    const mailOptions = {
      from: "codeunityfyp@gmail.com",
      to: "ialiha1der7011@gmail.com",
      subject: `CodeUnity Complaint: ${complaintType}`,
      html: emailContent,
      attachments: files ? files.map(file => ({
        filename: file.originalname,
        path: file.path
      })) : []
    };
    
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending complaint email:", error);
        return res.status(500).json({ message: 'Failed to send complaint email' });
      }
      
      console.log("Complaint email sent:", info.response);
      res.status(200).json({ 
        message: 'Complaint submitted successfully',
        emailInfo: info.response
      });
    });
    
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

module.exports = router; 