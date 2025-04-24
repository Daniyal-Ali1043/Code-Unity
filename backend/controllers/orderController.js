const Developer = require('../models/DeveloperModel');
const Student = require('../models/StudentModel');
const User = require('../models/UserModel');
const { v4: uuidv4 } = require('uuid');

// Create a new order (Student places order to a Developer)
exports.createOrder = async (req, res) => {
    console.log("✅ Create Order Route Hit");
    
    try {
        const { 
            developerId, 
            title, 
            description, 
            amount, 
            paymentMethodId 
        } = req.body;

        // Validate required fields
        if (!developerId || !title || !description || !amount || !paymentMethodId) {
            return res.status(400).json({ 
                message: "Missing required fields: developerId, title, description, amount, and paymentMethodId are required" 
            });
        }

        // Get the authenticated student user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the student profile
        const student = await Student.findOne({ email: user.email });
        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        // Find the developer
        const developer = await Developer.findById(developerId);
        if (!developer) {
            return res.status(404).json({ message: "Developer not found" });
        }
        
        // Check if developer is accepted
        if (!developer.accepted) {
            return res.status(400).json({ message: "Developer is not currently accepting orders" });
        }

        // Verify payment method exists
        const paymentMethod = student.paymentMethods.id(paymentMethodId);
        if (!paymentMethod) {
            return res.status(404).json({ message: "Payment method not found" });
        }

        // Generate unique IDs for order and invoice
        const orderId = `ORD-${uuidv4().substring(0, 8)}`;
        const invoiceId = `INV-${uuidv4().substring(0, 8)}`;
        const paymentId = `PAY-${uuidv4().substring(0, 8)}`;

        // Check if student has Pro subscription and apply 20% discount if applicable
        let discountedAmount = amount;
        let discountApplied = false;
        
        if (student.subscription && 
            student.subscription.isPro && 
            student.subscription.status === 'active') {
            // Apply 20% discount for Pro subscribers
            discountedAmount = Math.round(amount * 0.8); // 20% off
            discountApplied = true;
            console.log(`✅ Pro discount applied: Original: ${amount}, Discounted: ${discountedAmount}`);
        }

        // Create the new order object
        const newOrder = {
            orderId,
            title,
            description,
            amount: discountedAmount, // Use discounted amount
            status: "pending",
            startDate: new Date(),
            paymentId,
            proDiscountApplied: discountApplied // Flag to indicate if Pro discount was applied
        };

        // Create the new invoice object
        const newInvoice = {
            invoiceId,
            orderId,
            amount: discountedAmount, // Use discounted amount
            status: "pending",
            issueDate: new Date()
        };

        // Create the new project object
        const newProject = {
            name: title,
            budget: discountedAmount, // Use discounted amount
            status: "Working",
            completion: 0,
            orderId,
            developer: developer._id
        };

        // Add order and invoice to student with developer reference
        newOrder.developer = developer._id;
        newInvoice.developer = developer._id;
        student.orders.push(newOrder);
        student.invoices.push(newInvoice);
        student.projects.push(newProject);

        // Add order and invoice to developer with student reference
        const developerOrder = {...newOrder, student: student._id};
        const developerInvoice = {...newInvoice, student: student._id};
        developer.orders.push(developerOrder);
        developer.invoices.push(developerInvoice);

        // Update student's spending
        await student.updateSpending(discountedAmount);

        // Save both documents
        await Promise.all([student.save(), developer.save()]);

        console.log(`✅ Order created successfully: ${orderId}`);
        
        res.status(201).json({
            message: "Order placed successfully",
            orderId,
            invoiceId,
            order: newOrder,
            proDiscountApplied: discountApplied,
            originalAmount: discountApplied ? amount : null
        });

    } catch (error) {
        console.error("❌ Error creating order:", error);
        res.status(500).json({ message: "Failed to create order", error: error.message });
    }
};

// Get all orders for a student
exports.getStudentOrders = async (req, res) => {
    console.log("✅ Get Student Orders Route Hit");

    try {
        // Get student profile from authenticated user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const student = await Student.findOne({ email: user.email })
            .populate({
                path: 'orders.developer',
                select: 'firstName lastName rate'
            });

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        res.status(200).json({
            orders: student.orders.map(order => ({
                orderId: order.orderId,
                title: order.title,
                description: order.description,
                amount: order.amount,
                status: order.status,
                startDate: order.startDate,
                completionDate: order.completionDate,
                developer: order.developer ? 
                    `${order.developer.firstName} ${order.developer.lastName}` : 
                    "Unknown Developer",
                feedback: order.feedback
            }))
        });

    } catch (error) {
        console.error("❌ Error fetching student orders:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};

// Get all orders for a developer
exports.getDeveloperOrders = async (req, res) => {
    console.log("✅ Get Developer Orders Route Hit");

    try {
        // Get developer profile from authenticated user
        const developer = await Developer.findOne({ user: req.user.id })
            .populate({
                path: 'orders.student',
                select: 'firstName lastName email'
            });

        if (!developer) {
            return res.status(404).json({ message: "Developer profile not found" });
        }

        res.status(200).json({
            orders: developer.orders.map(order => ({
                orderId: order.orderId,
                title: order.title,
                description: order.description,
                amount: order.amount,
                status: order.status,
                startDate: order.startDate,
                completionDate: order.completionDate,
                student: order.student ? 
                    `${order.student.firstName} ${order.student.lastName}` : 
                    "Unknown Student",
                studentEmail: order.student ? order.student.email : null,
                feedback: order.feedback
            }))
        });

    } catch (error) {
        console.error("❌ Error fetching developer orders:", error);
        res.status(500).json({ message: "Failed to fetch orders", error: error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    console.log("✅ Update Order Status Route Hit");

    try {
        const { orderId, status } = req.body;
        
        if (!orderId || !status) {
            return res.status(400).json({ message: "Order ID and status are required" });
        }

        // Validate status value
        const validStatuses = ["pending", "in-progress", "delivered", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: "Invalid status. Must be one of: pending, in-progress, delivered, completed, cancelled" 
            });
        }

        // Get the authenticated user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let developer, student, orderIndex, studentId;

        // Check if the request is from a developer
        if (user.role === 'developer') {
            developer = await Developer.findOne({ 
                user: req.user.id,
                "orders.orderId": orderId
            });

            if (!developer) {
                return res.status(404).json({ message: "Order not found for this developer" });
            }

            // Get the specific order
            orderIndex = developer.orders.findIndex(order => order.orderId === orderId);
            if (orderIndex === -1) {
                return res.status(404).json({ message: "Order not found" });
            }

            studentId = developer.orders[orderIndex].student;
            
            // Update developer's order status
            developer.orders[orderIndex].status = status;

            // If the order is marked as completed, set completionDate
            if (status === "completed") {
                developer.orders[orderIndex].completionDate = new Date();
                
                // Update developer's revenue
                await developer.updateRevenue(developer.orders[orderIndex].amount);
                
                // Update invoice status too
                const invoiceIndex = developer.invoices.findIndex(inv => inv.orderId === orderId);
                if (invoiceIndex !== -1) {
                    developer.invoices[invoiceIndex].status = "paid";
                    developer.invoices[invoiceIndex].paidDate = new Date();
                }
            }

            await developer.save();
        }
        // Check if the request is from a student
        else if (user.role === 'student') {
            student = await Student.findOne({ 
                email: user.email,
                "orders.orderId": orderId
            });

            if (!student) {
                return res.status(404).json({ message: "Order not found for this student" });
            }

            // Get the specific order
            orderIndex = student.orders.findIndex(order => order.orderId === orderId);
            if (orderIndex === -1) {
                return res.status(404).json({ message: "Order not found" });
            }

            const developerId = student.orders[orderIndex].developer;
            
            // Update student's order status
            student.orders[orderIndex].status = status;

            // If the order is marked as completed, set completionDate
            if (status === "completed") {
                student.orders[orderIndex].completionDate = new Date();
                
                // Update project status
                const projectIndex = student.projects.findIndex(project => project.orderId === orderId);
                if (projectIndex !== -1) {
                    student.projects[projectIndex].status = "Done";
                    student.projects[projectIndex].completion = 100;
                }
                
                // Update invoice status
                const invoiceIndex = student.invoices.findIndex(inv => inv.orderId === orderId);
                if (invoiceIndex !== -1) {
                    student.invoices[invoiceIndex].status = "paid";
                    student.invoices[invoiceIndex].paidDate = new Date();
                }
            }

            await student.save();

            // Find the developer to update their order too
            developer = await Developer.findById(developerId);
        } else {
            return res.status(403).json({ message: "Unauthorized. Only students and developers can update order status" });
        }

        // If we found a developer from either path, update the developer's order
        if (developer && user.role === 'student') {
            // Find and update the order in the developer's records
            const devOrderIndex = developer.orders.findIndex(order => order.orderId === orderId);
            if (devOrderIndex !== -1) {
                developer.orders[devOrderIndex].status = status;
                
                // If the order is marked as completed, set completionDate
                if (status === "completed") {
                    developer.orders[devOrderIndex].completionDate = new Date();
                    
                    // Update developer's revenue
                    await developer.updateRevenue(developer.orders[devOrderIndex].amount);
                    
                    // Update invoice status too
                    const invoiceIndex = developer.invoices.findIndex(inv => inv.orderId === orderId);
                    if (invoiceIndex !== -1) {
                        developer.invoices[invoiceIndex].status = "paid";
                        developer.invoices[invoiceIndex].paidDate = new Date();
                    }
                }
                
                await developer.save();
            }
        }

        // If we found a student from the developer path, update the student's order
        if (studentId && user.role === 'developer') {
            student = await Student.findById(studentId);
            
            if (student) {
                // Update student's order status
                const studentOrderIndex = student.orders.findIndex(order => order.orderId === orderId);
                if (studentOrderIndex !== -1) {
                    student.orders[studentOrderIndex].status = status;
                    
                    if (status === "completed") {
                        student.orders[studentOrderIndex].completionDate = new Date();
                        
                        // Update project status
                        const projectIndex = student.projects.findIndex(project => project.orderId === orderId);
                        if (projectIndex !== -1) {
                            student.projects[projectIndex].status = "Done";
                            student.projects[projectIndex].completion = 100;
                        }
                        
                        // Update invoice status
                        const invoiceIndex = student.invoices.findIndex(inv => inv.orderId === orderId);
                        if (invoiceIndex !== -1) {
                            student.invoices[invoiceIndex].status = "paid";
                            student.invoices[invoiceIndex].paidDate = new Date();
                        }
                    }
                    
                    await student.save();
                }
            }
        }

        console.log(`✅ Order ${orderId} status updated to ${status} successfully`);
        res.status(200).json({ 
            message: "Order status updated successfully", 
            status 
        });

    } catch (error) {
        console.error("❌ Error updating order status:", error);
        res.status(500).json({ message: "Failed to update order status", error: error.message });
    }
};

// Add feedback and rating to an order (for students)
exports.addOrderFeedback = async (req, res) => {
    console.log("✅ Add Order Feedback Route Hit");

    try {
        const { orderId, rating, comment } = req.body;
        
        if (!orderId || !rating) {
            return res.status(400).json({ message: "Order ID and rating are required" });
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Get student profile from authenticated user
        const user = await User.findById(req.user.id);
        const student = await Student.findOne({ email: user.email });

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        // Find the order
        const orderIndex = student.orders.findIndex(order => order.orderId === orderId);
        if (orderIndex === -1) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if order is completed
        if (student.orders[orderIndex].status !== "completed") {
            return res.status(400).json({ message: "Can only add feedback to completed orders" });
        }

        // Add feedback to the order
        student.orders[orderIndex].feedback = { rating, comment };
        await student.save();

        // Also update the developer's order and ratings
        const developerId = student.orders[orderIndex].developer;
        const developer = await Developer.findById(developerId);

        if (developer) {
            // Update the order feedback
            const devOrderIndex = developer.orders.findIndex(order => order.orderId === orderId);
            if (devOrderIndex !== -1) {
                developer.orders[devOrderIndex].feedback = { rating, comment };
            }

            // Add to developer's ratings
            developer.ratings.details.push({
                student: student._id,
                rating,
                comment,
                date: new Date()
            });

            // Recalculate average rating
            const totalRatings = developer.ratings.details.reduce((sum, item) => sum + item.rating, 0);
            developer.ratings.count = developer.ratings.details.length;
            developer.ratings.average = totalRatings / developer.ratings.count;

            await developer.save();
        }

        res.status(200).json({ 
            message: "Feedback added successfully",
            feedback: { rating, comment }
        });

    } catch (error) {
        console.error("❌ Error adding feedback:", error);
        res.status(500).json({ message: "Failed to add feedback", error: error.message });
    }
};

// Get dashboard data for developers
exports.getDeveloperDashboard = async (req, res) => {
    console.log("✅ Developer Dashboard Data Route Hit");

    try {
        const developer = await Developer.findOne({ user: req.user.id });
        
        if (!developer) {
            return res.status(404).json({ message: "Developer profile not found" });
        }

        // Count orders by status - no hardcoded values
        const pendingOrders = developer.orders.filter(order => order.status === "pending").length;
        const inProgressOrders = developer.orders.filter(order => order.status === "in-progress").length;
        const completedOrders = developer.orders.filter(order => order.status === "completed").length;
        const cancelledOrders = developer.orders.filter(order => order.status === "cancelled").length;

        // Get recent orders
        const recentOrders = developer.orders
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, 5)
            .map(order => ({
                orderId: order.orderId,
                title: order.title,
                amount: order.amount,
                status: order.status,
                startDate: order.startDate
            }));

        // Calculate revenue data from actual orders, not hardcoded values
        let monthlyRevenueData = Array(12).fill(0);
        
        // Populate monthly revenue data based on completed orders
        const currentYear = new Date().getFullYear();
        developer.orders
            .filter(order => order.status === "completed" && new Date(order.completionDate).getFullYear() === currentYear)
            .forEach(order => {
                const month = new Date(order.completionDate).getMonth();
                monthlyRevenueData[month] += order.amount;
            });
            
        // Calculate actual rating from feedback
        const ratingsData = developer.ratings || { average: 0, count: 0 };
        
        // Return dashboard data with dynamically calculated values
        res.status(200).json({
            totalRevenue: developer.revenue.total || 0,
            orderStats: {
                pending: pendingOrders,
                inProgress: inProgressOrders,
                completed: completedOrders,
                cancelled: cancelledOrders,
                total: developer.orders.length
            },
            revenueOverview: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [{
                    label: "Revenue Overview",
                    data: monthlyRevenueData,
                    backgroundColor: "rgba(75, 192, 192, 0.2)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 2,
                    fill: true
                }]
            },
            ratings: ratingsData,
            recentOrders
        });

    } catch (error) {
        console.error("❌ Error fetching developer dashboard:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
};

// Get dashboard data for students
exports.getStudentDashboard = async (req, res) => {
    console.log("✅ Student Dashboard Data Route Hit");

    try {
        // Get student profile from authenticated user
        const user = await User.findById(req.user.id);
        const student = await Student.findOne({ email: user.email });

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        // Count projects by status - no hardcoded values
        const workingProjects = student.projects.filter(project => project.status === "Working").length;
        const completedProjects = student.projects.filter(project => project.status === "Done").length;
        const cancelledProjects = student.projects.filter(project => project.status === "Canceled").length;

        // Get recent orders
        const recentOrders = student.orders
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, 5)
            .map(order => ({
                orderId: order.orderId,
                title: order.title,
                amount: order.amount,
                status: order.status,
                startDate: order.startDate
            }));
            
        // Calculate monthly spending data based on actual orders
        let monthlySpendingData = Array(12).fill(0);
        
        // Populate monthly spending data based on actual orders
        const currentYear = new Date().getFullYear();
        student.orders
            .filter(order => new Date(order.startDate).getFullYear() === currentYear)
            .forEach(order => {
                const month = new Date(order.startDate).getMonth();
                monthlySpendingData[month] += order.amount;
            });

        // Return dashboard data with dynamically calculated values
        res.status(200).json({
            totalSpending: student.spending.total || 0,
            projectStats: {
                working: workingProjects,
                completed: completedProjects,
                cancelled: cancelledProjects,
                total: student.projects.length
            },
            spendingOverview: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                datasets: [{
                    label: "Spending Overview",
                    data: monthlySpendingData,
                    backgroundColor: "rgba(54, 162, 235, 0.2)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 2,
                    fill: true
                }]
            },
            paymentMethods: student.paymentMethods || [],
            recentOrders,
            projects: student.projects.map(project => ({
                name: project.name,
                budget: project.budget,
                status: project.status,
                completion: project.completion,
                developer: project.developer // Will be populated if needed
            }))
        });

    } catch (error) {
        console.error("❌ Error fetching student dashboard:", error);
        res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
};

// Get invoices for a student
exports.getStudentInvoices = async (req, res) => {
    console.log("✅ Get Student Invoices Route Hit");

    try {
        // Get student profile from authenticated user
        const user = await User.findById(req.user.id);
        const student = await Student.findOne({ email: user.email })
            .populate({
                path: 'invoices.developer',
                select: 'firstName lastName'
            });

        if (!student) {
            return res.status(404).json({ message: "Student profile not found" });
        }

        const invoices = student.invoices.map(invoice => ({
            invoiceId: invoice.invoiceId,
            orderId: invoice.orderId,
            amount: invoice.amount,
            status: invoice.status,
            issueDate: invoice.issueDate,
            paidDate: invoice.paidDate,
            developer: invoice.developer ? 
                `${invoice.developer.firstName} ${invoice.developer.lastName}` : 
                "Unknown Developer",
            pdfLink: invoice.pdfLink || null
        }));

        res.status(200).json({ invoices });

    } catch (error) {
        console.error("❌ Error fetching student invoices:", error);
        res.status(500).json({ message: "Failed to fetch invoices", error: error.message });
    }
};

// Get invoices for a developer
exports.getDeveloperInvoices = async (req, res) => {
    console.log("✅ Get Developer Invoices Route Hit");

    try {
        // Get developer profile from authenticated user
        const developer = await Developer.findOne({ user: req.user.id })
            .populate({
                path: 'invoices.student',
                select: 'firstName lastName email'
            });

        if (!developer) {
            return res.status(404).json({ message: "Developer profile not found" });
        }

        const invoices = developer.invoices.map(invoice => ({
            invoiceId: invoice.invoiceId,
            orderId: invoice.orderId,
            amount: invoice.amount,
            status: invoice.status,
            issueDate: invoice.issueDate,
            paidDate: invoice.paidDate,
            student: invoice.student ? 
                `${invoice.student.firstName} ${invoice.student.lastName}` : 
                "Unknown Student",
            studentEmail: invoice.student ? invoice.student.email : null,
            pdfLink: invoice.pdfLink || null
        }));

        res.status(200).json({ invoices });

    } catch (error) {
        console.error("❌ Error fetching developer invoices:", error);
        res.status(500).json({ message: "Failed to fetch invoices", error: error.message });
    }
};

// Generate PDF invoice and update pdfLink
exports.generateInvoicePDF = async (req, res) => {
    console.log("✅ Generate Invoice PDF Route Hit");

    try {
        const { invoiceId } = req.params;

        if (!invoiceId) {
            return res.status(400).json({ message: "Invoice ID is required" });
        }

        // Find the invoice in both student and developer models
        let invoice = null;
        let student = null;
        let developer = null;

        // Check if request is from a student
        if (req.user.role === 'student') {
            const user = await User.findById(req.user.id);
            student = await Student.findOne({ 
                email: user.email,
                "invoices.invoiceId": invoiceId
            });

            if (student) {
                invoice = student.invoices.find(inv => inv.invoiceId === invoiceId);
                developer = await Developer.findById(invoice.developer);
            }
        } else {
            // Check if request is from a developer
            developer = await Developer.findOne({ 
                user: req.user.id,
                "invoices.invoiceId": invoiceId
            });

            if (developer) {
                invoice = developer.invoices.find(inv => inv.invoiceId === invoiceId);
                student = await Student.findById(invoice.student);
            }
        }

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // In a real-world application, generate a PDF here
        // For now, we'll simulate it by updating the pdfLink
        const pdfLink = `/invoices/${invoiceId}.pdf`;

        // Update the pdfLink in both student and developer models
        if (student) {
            const invoiceIndex = student.invoices.findIndex(inv => inv.invoiceId === invoiceId);
            if (invoiceIndex !== -1) {
                student.invoices[invoiceIndex].pdfLink = pdfLink;
                await student.save();
            }
        }

        if (developer) {
            const invoiceIndex = developer.invoices.findIndex(inv => inv.invoiceId === invoiceId);
            if (invoiceIndex !== -1) {
                developer.invoices[invoiceIndex].pdfLink = pdfLink;
                await developer.save();
            }
        }

        res.status(200).json({ 
            message: "Invoice PDF generated successfully", 
            pdfLink
        });

    } catch (error) {
        console.error("❌ Error generating invoice PDF:", error);
        res.status(500).json({ message: "Failed to generate invoice PDF", error: error.message });
    }
};

// Only the createOrderAfterPayment function needs to be updated
// This is the part that needs to be added to your existing orderController.js file

exports.createOrderAfterPayment = async (req, res) => {
    console.log("✅ Create Order After Payment Route Hit");
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.log("🔐 User info:", req.user ? req.user.id : 'No user ID');
    
    try {
        const { 
            orderId, 
            offerId, 
            developerId, 
            title, 
            description, 
            amount,
            hours = 1,
            deliveryTime = 1,
            revisions = 0,
            meetingIncluded = false
        } = req.body;

        // Validate required fields
        if (!orderId) {
            console.log("❌ Missing orderId in request");
            return res.status(400).json({ 
                success: false,
                message: "Order ID is required" 
            });
        }

        if (!offerId) {
            console.log("❌ Missing offerId in request");
            return res.status(400).json({ 
                success: false,
                message: "Offer ID is required" 
            });
        }

        if (!developerId) {
            console.log("❌ Missing developerId in request");
            return res.status(400).json({ 
                success: false,
                message: "Developer ID is required" 
            });
        }

        // Check if this order already exists (to prevent duplicates)
        console.log("🔍 Checking if order already exists:", orderId);
        const User = require('../models/UserModel');
        const Student = require('../models/StudentModel');
        
        const user = await User.findById(req.user.id);
        if (!user) {
            console.log("❌ User not found with ID:", req.user.id);
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        const student = await Student.findOne({ email: user.email });
        if (!student) {
            console.log("❌ Student profile not found for email:", user.email);
            return res.status(404).json({ 
                success: false,
                message: "Student profile not found" 
            });
        }

        // Check if the order already exists for this student
        const existingOrder = student.orders && student.orders.find(order => order.orderId === orderId);
        if (existingOrder) {
            console.log("✅ Order already exists, not creating duplicate:", orderId);
            return res.status(200).json({
                success: true,
                message: "Order already exists",
                order: existingOrder
            });
        }

        // Find the developer
        console.log("🔍 Looking up developer with ID:", developerId);
        const Developer = require('../models/DeveloperModel');
        const developer = await Developer.findById(developerId);
        if (!developer) {
            console.log("❌ Developer not found with ID:", developerId);
            return res.status(404).json({ 
                success: false,
                message: "Developer not found" 
            });
        }
        console.log("✅ Found developer:", developer.firstName, developer.lastName);

        // Initialize orders and invoices arrays if they don't exist (defensive coding)
        if (!developer.orders) {
            console.log("⚠️ Developer orders array is undefined, initializing it");
            developer.orders = [];
        }

        if (!developer.invoices) {
            console.log("⚠️ Developer invoices array is undefined, initializing it");
            developer.invoices = [];
        }

        // Similarly for student:
        if (!student.orders) {
            console.log("⚠️ Student orders array is undefined, initializing it");
            student.orders = [];
        }

        if (!student.invoices) {
            console.log("⚠️ Student invoices array is undefined, initializing it");
            student.invoices = [];
        }

        if (!student.projects) {
            console.log("⚠️ Student projects array is undefined, initializing it");
            student.projects = [];
        }

        // Generate unique IDs for invoice and payment
        const { v4: uuidv4 } = require('uuid');
        const paymentId = `PAY-${uuidv4().substring(0, 8)}`;
        const invoiceId = `INV-${uuidv4().substring(0, 8)}`;
        console.log("🔑 Generated IDs:", { paymentId, invoiceId, orderId });

        // Parse amount to ensure it's a number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
            console.log("❌ Invalid amount:", amount);
            return res.status(400).json({
                success: false,
                message: "Amount must be a valid number"
            });
        }
        console.log("💰 Parsed amount:", parsedAmount);

        // Create the new order object
        const newOrder = {
            orderId,
            offerId,
            title: title || `Development service`,
            description: description || `${hours} hour${hours > 1 ? 's' : ''} of development work`,
            amount: parsedAmount,
            status: "in-progress",
            startDate: new Date(),
            paymentId,
            developer: developer._id,
            deliveryTime: deliveryTime || 1,
            revisions: revisions || 0,
            meetingIncluded: meetingIncluded || false,
            hours: hours || 1
        };

        // Create the new invoice object
        const newInvoice = {
            invoiceId,
            orderId,
            amount: parsedAmount,
            status: "paid",
            issueDate: new Date(),
            paidDate: new Date(),
            developer: developer._id
        };

        // Create the new project object
        const newProject = {
            name: title || `Development service`,
            budget: parsedAmount,
            status: "Working",
            completion: 0,
            orderId,
            developer: developer._id
        };

        console.log("📋 Adding order to student:", newOrder.orderId);
        // Add order and invoice to student
        student.orders.push(newOrder);
        student.invoices.push(newInvoice);
        student.projects.push(newProject);

        // Update student's spending
        try {
            // Initialize spending if not present
            if (!student.spending) {
                student.spending = {
                    total: 0,
                    monthly: {},
                    yearly: {}
                };
            }
            
            // Update total spending
            student.spending.total = (student.spending.total || 0) + parsedAmount;
            
            // Update monthly spending
            const date = new Date();
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            // Handle different ways monthly spending might be stored
            if (!student.spending.monthly) {
                student.spending.monthly = {};
            }
            
            if (typeof student.spending.monthly === 'object' && !Array.isArray(student.spending.monthly)) {
                if (student.spending.monthly instanceof Map) {
                    // If it's a Map
                    student.spending.monthly.set(monthKey, (student.spending.monthly.get(monthKey) || 0) + parsedAmount);
                } else {
                    // If it's a plain object
                    student.spending.monthly[monthKey] = (student.spending.monthly[monthKey] || 0) + parsedAmount;
                }
            }
            
            // Update yearly spending - similar approach
            const yearKey = `${date.getFullYear()}`;
            
            if (!student.spending.yearly) {
                student.spending.yearly = {};
            }
            
            if (typeof student.spending.yearly === 'object' && !Array.isArray(student.spending.yearly)) {
                if (student.spending.yearly instanceof Map) {
                    // If it's a Map
                    student.spending.yearly.set(yearKey, (student.spending.yearly.get(yearKey) || 0) + parsedAmount);
                } else {
                    // If it's a plain object
                    student.spending.yearly[yearKey] = (student.spending.yearly[yearKey] || 0) + parsedAmount;
                }
            }
            
            console.log("✅ Student spending updated successfully");
        } catch (spendingError) {
            console.error("❌ Error updating student spending:", spendingError);
            // Continue with order creation even if spending update fails
        }

        // Add order and invoice to developer
        console.log("📋 Adding order to developer:", newOrder.orderId);
        const developerOrder = {
            ...newOrder,
            student: student._id
        };
        const developerInvoice = {
            ...newInvoice,
            student: student._id
        };
        
        // Add items to developer's arrays
        developer.orders.push(developerOrder);
        developer.invoices.push(developerInvoice);
        
        // Update developer's revenue
        try {
            // Initialize revenue if not present
            if (!developer.revenue) {
                developer.revenue = {
                    total: 0,
                    monthly: {},
                    yearly: {}
                };
            }
            
            // Update total revenue
            developer.revenue.total = (developer.revenue.total || 0) + parsedAmount;
            
            // Update monthly revenue
            const date = new Date();
            const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
            
            // Handle different ways monthly revenue might be stored
            if (!developer.revenue.monthly) {
                developer.revenue.monthly = {};
            }
            
            if (typeof developer.revenue.monthly === 'object' && !Array.isArray(developer.revenue.monthly)) {
                if (developer.revenue.monthly instanceof Map) {
                    // If it's a Map
                    developer.revenue.monthly.set(monthKey, (developer.revenue.monthly.get(monthKey) || 0) + parsedAmount);
                } else {
                    // If it's a plain object
                    developer.revenue.monthly[monthKey] = (developer.revenue.monthly[monthKey] || 0) + parsedAmount;
                }
            }
            
            // Update yearly revenue - similar approach
            const yearKey = `${date.getFullYear()}`;
            
            if (!developer.revenue.yearly) {
                developer.revenue.yearly = {};
            }
            
            if (typeof developer.revenue.yearly === 'object' && !Array.isArray(developer.revenue.yearly)) {
                if (developer.revenue.yearly instanceof Map) {
                    // If it's a Map
                    developer.revenue.yearly.set(yearKey, (developer.revenue.yearly.get(yearKey) || 0) + parsedAmount);
                } else {
                    // If it's a plain object
                    developer.revenue.yearly[yearKey] = (developer.revenue.yearly[yearKey] || 0) + parsedAmount;
                }
            }
            
            console.log("✅ Developer revenue updated successfully");
        } catch (revenueError) {
            console.error("❌ Error updating developer revenue:", revenueError);
            // Continue with order creation even if revenue update fails
        }

        // Save both documents
        await Promise.all([
            student.save(),
            developer.save()
        ]);

        console.log(`✅ Order created successfully after payment: ${orderId}`);
        
        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order: newOrder,
            invoice: newInvoice
        });

    } catch (error) {
        console.error("❌ Error creating order after payment:", error);
        
        // Detailed error logging
        if (error.name) console.error("Error name:", error.name);
        if (error.code) console.error("Error code:", error.code);
        if (error.keyPattern) console.error("Error key pattern:", error.keyPattern);
        if (error.keyValue) console.error("Error key value:", error.keyValue);
        
        // Log the full error stack
        console.error("Error stack:", error.stack);
        
        res.status(500).json({ 
            success: false,
            message: "Failed to create order", 
            error: error.message 
        });
    }
};

exports.getStudentOrder = async (req, res) => {
  console.log("✅ Get Single Student Order Route Hit");
  const { orderId } = req.params;

  try {
    // Get the authenticated user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Find the student profile
    const student = await Student.findOne({ email: user.email });
    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: "Student profile not found" 
      });
    }

    // Find the specific order
    const order = student.orders.find(order => order.orderId === orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Get developer info
    let developerName = "Unknown Developer";
    if (order.developer) {
      const developer = await Developer.findById(order.developer);
      if (developer) {
        developerName = `${developer.firstName} ${developer.lastName}`;
      }
    }

    // Return the order details
    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        developerName
      }
    });

  } catch (error) {
    console.error("❌ Error fetching student order:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch order details", 
      error: error.message 
    });
  }
};

// Get a single order for a developer
exports.getDeveloperOrder = async (req, res) => {
  console.log("✅ Get Single Developer Order Route Hit");
  const { orderId } = req.params;

  try {
    // Get the developer profile
    const developer = await Developer.findOne({ user: req.user.id });
    if (!developer) {
      return res.status(404).json({ 
        success: false,
        message: "Developer profile not found" 
      });
    }

    // Find the specific order
    const order = developer.orders.find(order => order.orderId === orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: "Order not found" 
      });
    }

    // Get student info
    let studentName = "Unknown Student";
    if (order.student) {
      const student = await Student.findById(order.student);
      if (student) {
        studentName = `${student.firstName} ${student.lastName}`;
      }
    }

    // Return the order details
    res.status(200).json({
      success: true,
      order: {
        ...order.toObject(),
        studentName
      }
    });

  } catch (error) {
    console.error("❌ Error fetching developer order:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch order details", 
      error: error.message 
    });
  }
};

// Add feedback and rating from developer to student
exports.addDeveloperFeedback = async (req, res) => {
    console.log("✅ Add Developer Feedback Route Hit");

    try {
        const { orderId, rating, comment, tags } = req.body;
        
        if (!orderId || !rating) {
            return res.status(400).json({ message: "Order ID and rating are required" });
        }

        // Validate rating value
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Get developer profile from authenticated user
        const developer = await Developer.findOne({ user: req.user.id });

        if (!developer) {
            return res.status(404).json({ message: "Developer profile not found" });
        }

        // Find the order
        const orderIndex = developer.orders.findIndex(order => order.orderId === orderId);
        if (orderIndex === -1) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Check if order is completed
        if (developer.orders[orderIndex].status !== "completed") {
            return res.status(400).json({ message: "Can only add feedback to completed orders" });
        }

        // Add feedback to the order
        developer.orders[orderIndex].studentFeedback = { rating, comment, tags };
        await developer.save();

        // Also update the student's order with developer's feedback
        const studentId = developer.orders[orderIndex].student;
        const student = await Student.findById(studentId);

        if (student) {
            // Update the order feedback
            const studentOrderIndex = student.orders.findIndex(order => order.orderId === orderId);
            if (studentOrderIndex !== -1) {
                student.orders[studentOrderIndex].studentFeedback = { rating, comment, tags };
                await student.save();
            }
        }

        res.status(200).json({ 
            message: "Developer feedback added successfully",
            feedback: { rating, comment, tags }
        });

    } catch (error) {
        console.error("❌ Error adding developer feedback:", error);
        res.status(500).json({ message: "Failed to add feedback", error: error.message });
    }
};

module.exports = exports;