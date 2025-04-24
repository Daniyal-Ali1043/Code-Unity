const express = require("express");
const router = express.Router();
const { getStudentProfile,getStudentDashboardData,addPaymentMethod ,deletePaymentMethod } = require("../controllers/studentController");
const protect = require("../middleware/authMiddleware");
const Student = require("../models/StudentModel"); // Adjust the path as needed

// Student Profile Route
router.get("/profile", protect, getStudentProfile);
// PUT route to update a student profile by ID (without auth middleware)
router.put("/profile/:id", async (req, res) => {
    const { id } = req.params; // Get the _id from the URL
    const updateData = req.body; // Get the update data from the request body
  
    try {
      // Find the student by _id and update their profile
      const updatedStudent = await Student.findByIdAndUpdate(id, updateData, {
        new: true, // Return the updated document
        runValidators: true, // Validate the update data
      });
  
      if (!updatedStudent) {
        return res.status(404).json({ status: "fail", message: "Student not found" });
      }
  
      res.status(200).json({ status: "success", data: updatedStudent });
    } catch (err) {
      res.status(400).json({ status: "fail", message: err.message });
    }
  });
  
router.get("/dashboarddata", protect, getStudentDashboardData);
router.post("/add-payment-method", protect, addPaymentMethod);
router.delete("/delete-payment-method/:paymentMethodId", protect,deletePaymentMethod);


module.exports = router;
