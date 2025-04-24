const User = require("../models/UserModel");
const Student = require("../models/StudentModel");

// Get Student Profile
exports.getStudentProfile = async (req, res) => {
  console.log(`✅ Student Profile Route Hit: User ID: ${req.user.id}`);
  try {
    // Fetch User data
    const user = await User.findById(req.user.id).select("email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch Student profile using the user's email as it's a unique field across models
    const studentProfile = await Student.findOne({ email: user.email });

    if (!studentProfile) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({
      firstName: studentProfile.firstName,
      lastName: studentProfile.lastName,
      email: studentProfile.email,
      dateOfBirth: studentProfile.dateOfBirth,
      degree: studentProfile.degree,
      discipline: studentProfile.discipline,
      degreeStartDate: studentProfile.degreeStartDate,
      degreeEndDate: studentProfile.degreeEndDate,
      profilePicture: studentProfile.profilePicture,
      role: studentProfile.role,
    });
  } catch (error) {
    console.error("❌ Error fetching student profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getStudentDashboardData = async (req, res) => {
  console.log("✅ Dashboard Data Route Hit");
  console.log("Request Headers:", req.headers);
  console.log("Authenticated User:", req.user);

  try {
    // Log the user's ID and email from the request
    console.log("User ID from Request:", req.user.id);
    console.log("User Email from Request:", req.user.email);

    // Fetch the user's email from the request (assuming it's available in req.user)
    const userEmail = req.user.email;

    // Find the student document using the email
    const student = await Student.findOne({ email: userEmail });

    // Log the student document found
    console.log("Student Document Found:", student);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Log the student ID
    console.log("Student ID:", student._id);

    // Process spending data from student.spending to create chart data
    const spendingData = processSpendingData(student.spending);

    res.status(200).json({
      projects: student.projects,
      invoices: student.invoices,
      spendingOverview: spendingData,
      paymentMethods: student.paymentMethods || [], // Include paymentMethods in the response
    });
  } catch (error) {
    console.error("❌ Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data", error });
  }
};

// Helper function to process spending data for chart
const processSpendingData = (spending) => {
  if (!spending || !spending.monthly) {
    // Return default empty chart data if no spending data exists
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [{
        label: 'Spending',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };
  }

  // Get current year
  const currentYear = new Date().getFullYear();
  
  // Create array for all months of the current year
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  // Initialize data array with zeros for all months
  const monthlyData = Array(12).fill(0);
  
  // Fill in data from the spending.monthly Map
  // The keys in the map are in format "YYYY-MM"
  if (spending.monthly instanceof Map) {
    // For native Map object
    for (const [key, value] of spending.monthly.entries()) {
      const [year, month] = key.split('-').map(Number);
      if (year === currentYear && month >= 1 && month <= 12) {
        monthlyData[month - 1] = value;
      }
    }
  } else if (typeof spending.monthly === 'object') {
    // For object representation of Map (as might be stored in MongoDB)
    Object.entries(spending.monthly).forEach(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      if (year === currentYear && month >= 1 && month <= 12) {
        monthlyData[month - 1] = value;
      }
    });
  }

  // Return formatted data for Chart.js
  return {
    labels: months,
    datasets: [{
      label: 'Monthly Spending',
      data: monthlyData,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1
    }]
  };
};

exports.addPaymentMethod = async (req, res) => {
  console.log("✅ Add Payment Method Route Hit");
  console.log("Request Body:", req.body);

  try {
    const { cardType, cardNumber, name } = req.body; // Include `name` in the destructured request body
    const userEmail = req.user.email; // Get the email from the authenticated user

    // Find the student document using the email
    const student = await Student.findOne({ email: userEmail });

    // Log the student document found
    console.log("Student Document Found:", student);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Log the student ID
    console.log("Student ID:", student._id);

    // Add the new payment method with the `name` field
    student.paymentMethods.push({ cardType, cardNumber, name });
    await student.save();

    res.status(200).json({ paymentMethods: student.paymentMethods });
  } catch (error) {
    console.error("❌ Error adding payment method:", error);
    res.status(500).json({ message: "Error adding payment method", error });
  }
};

// Delete Payment Method
exports.deletePaymentMethod = async (req, res) => {
  console.log("✅ Delete Payment Method Route Hit");
  console.log("Request Params:", req.params);

  try {
    const { paymentMethodId } = req.params; // Get the payment method ID from the request params
    const userEmail = req.user.email; // Get the email from the authenticated user

    // Find the student document using the email
    const student = await Student.findOne({ email: userEmail });

    // Log the student document found
    console.log("Student Document Found:", student);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Log the student ID
    console.log("Student ID:", student._id);

    // Find the index of the payment method to delete
    const paymentMethodIndex = student.paymentMethods.findIndex(
      (method) => method._id.toString() === paymentMethodId
    );

    // If the payment method is not found, return an error
    if (paymentMethodIndex === -1) {
      return res.status(404).json({ message: "Payment method not found" });
    }

    // Remove the payment method from the array
    student.paymentMethods.splice(paymentMethodIndex, 1);

    // Save the updated student document
    await student.save();

    res.status(200).json({ paymentMethods: student.paymentMethods });
  } catch (error) {
    console.error("❌ Error deleting payment method:", error);
    res.status(500).json({ message: "Error deleting payment method", error });
  }
};