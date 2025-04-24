const Developer = require('../models/DeveloperModel.js')
const User = require("../models/UserModel");
const Student = require("../models/StudentModel");

exports.getDeveloperProfile = async (req, res) => {
    console.log(`✅ Developer Profile Route Hit: User ID: ${req.user.id}`);

    try {
        // Fetch User data
        const user = await User.findById(req.user.id).select("email username profilePicture");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ✅ Fetch Developer Profile using `user._id`
        const developerProfile = await Developer.findOne({ user: req.user.id, accepted: true });

        if (!developerProfile) {
            return res.status(404).json({ message: "Developer profile not found" });
        }

        return res.status(200).json({
            _id: developerProfile._id, // ✅ Return Developer `_id`
            firstName: developerProfile.firstName,
            lastName: developerProfile.lastName,
            email: user.email,
            profilePicture: user.profilePicture || null,
            dateOfBirth: developerProfile.dateOfBirth || null,
            discipline: developerProfile.discipline || null,
            degree: developerProfile.degree || null,
            bio: developerProfile.bio || null,
            developerType: developerProfile.developerType || "junior",
            previousExperiences: developerProfile.previousExperiences || [],
            programmingLanguages: developerProfile.programmingLanguages || [],
            projectsLink: developerProfile.projectsLink || null,
            yearOfCompletion: developerProfile.yearOfCompletion || null,
            role: "developer",
            userId: developerProfile.user._id, // Include the user ID in the response
            resumeUrl: developerProfile.resumeUrl || null
        });

    } catch (error) {
        console.error("❌ Error fetching developer profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getDevelopers = async (req, res) => {
    try {
        // Update the query to only find developers with accepted=true
        const developers = await Developer.find({ accepted: true })
            .populate('user', 'email profilePicture _id'); // ✅ Fetch user details including ID
        
        if (!developers || developers.length === 0) {
            console.warn("⚠️ No accepted developers found.");
            return res.status(404).json({ message: "No developers available." });
        }
        
        console.log("✅ Accepted developers fetched from the database:");
        
        const formattedDevelopers = developers.map(dev => {
            const developerDetails = {
                _id: dev._id, // Developer profile ID
                userId: dev.user ? dev.user._id : null, // ✅ User ID (needed for messaging)
                name: `${dev.firstName} ${dev.lastName}`,
                bio: dev.bio || "No bio available",
                location: "Not Specified",
                status: dev.accepted ? "Accepted" : "Pending",
                developerType: dev.developerType || "junior", // ✅ Add developerType field
                languages: dev.programmingLanguages.length > 0 ? dev.programmingLanguages.join(', ') : "Not specified",
                experience: `${dev.previousExperiences.length} years`,
                rate: dev.rate ? `$${dev.rate}/hour` : "Not specified",
                profilePicture: dev.user && dev.user.profilePicture ? dev.user.profilePicture : 'https://randomuser.me/api/portraits/men/1.jpg',
                projectsLink: dev.projectsLink || "No projects linked"
            };
            
            // ✅ Print each developer's details in the backend console
            console.log(`🔹 Developer: ${developerDetails.name}`);
            console.log(`   - Developer ID: ${developerDetails._id}`);
            console.log(`   - User ID: ${developerDetails.userId}`);
            console.log(`   - Bio: ${developerDetails.bio}`);
            console.log(`   - Status: ${developerDetails.status}`);
            console.log(`   - Developer Type: ${developerDetails.developerType}`); // ✅ Log developer type
            console.log(`   - Experience: ${developerDetails.experience}`);
            console.log(`   - Rate: ${developerDetails.rate}`);
            console.log(`   - Profile Picture: ${developerDetails.profilePicture}`);
            console.log(`   - Projects Link: ${developerDetails.projectsLink}`);
            console.log("------------------------------------------------");
            
            return developerDetails;
        });
        
        res.status(200).json(formattedDevelopers);
    } catch (error) {
        console.error('❌ Failed to retrieve developers:', error);
        res.status(500).json({ message: "Failed to retrieve developers", error: error.message });
    }
};

// Check if the user has already submitted their application
exports.checkApplication = async (req, res) => {
    try {
        // Find the developer entry associated with the user
        const developer = await Developer.findOne({ user: req.user._id });

        // Check if the developer exists and if the 'submitted' field is true
        if (developer && developer.submitted) {
            return res.status(200).json({ hasApplied: true, submitted: true, applicationId: developer._id });
        } else if (developer && !developer.submitted) {
            return res.status(200).json({ hasApplied: true, submitted: false, applicationId: developer._id });
        } else {
            return res.status(200).json({ hasApplied: false });
        }
    } catch (error) {
        console.error('Error checking application:', error);
        res.status(500).json({ message: 'Failed to check application status', error: error.message });
    }
};

exports.getApplicationStatus = async (req, res) => {
    try {
        console.log("🔍 Checking application status for user:", req.user._id);

        // ✅ Ensure user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Unauthorized: No user ID found in token" });
        }

        // ✅ Find developer application
        const developer = await Developer.findOne({ user: req.user.id });

        if (!developer) {
            return res.status(404).json({ message: "Application not found" });
        }

        res.status(200).json({
            status: developer.accepted ? "Accepted" : "Pending",
            applicationDetails: {
                firstName: developer.firstName,
                lastName: developer.lastName,
                dateOfBirth: developer.dateOfBirth,
                programmingLanguages: developer.programmingLanguages || [],
                previousExperiences: developer.previousExperiences || [],
                projectsLink: developer.projectsLink || "N/A",
                degree: developer.degree || "N/A",
                discipline: developer.discipline || "N/A",
                educationYear: developer.yearOfCompletion || "N/A",
                resumeUrl: developer.resumeUrl || null
            }
        });
    } catch (error) {
        console.error("❌ Error fetching application status:", error);
        res.status(500).json({ message: "Failed to fetch application status", error: error.message });
    }
};

exports.applyForDeveloper = async (req, res) => {
    try {
        // Basic validation - check for required fields
        const requiredFields = [
            'firstName', 'lastName', 'dateOfBirth', 'programmingLanguages',
            'previousExperiences', 'projectsLink', 'degree', 'discipline', 'educationYear'
        ];
        
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: "Missing required fields", 
                fields: missingFields 
            });
        }
        
        // Check if resume file is uploaded
        if (!req.file) {
            return res.status(400).json({ message: "Resume file is required" });
        }

        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            return res.status(403).json({ message: "Unauthorized: User not authenticated" });
        }

        // Check if the user already has a developer profile
        const existingDeveloper = await Developer.findOne({ user: req.user.id });
        if (existingDeveloper) {
            return res.status(400).json({ message: "You have already applied as a developer." });
        }

        // Extract fields from request body
        const {
            firstName, lastName, dateOfBirth, programmingLanguages,
            previousExperiences, projectsLink, degree, discipline,
            educationYear
        } = req.body;

        // Get the file details
        const resumeFile = req.file;
        const resumeUrl = `${req.protocol}://${req.get('host')}/uploads/${resumeFile.filename}`;

        // Validate programming languages (max 3)
        const languages = programmingLanguages.split(',').map(lang => lang.trim()).filter(Boolean);
        if (languages.length > 3) {
            return res.status(400).json({ message: "Maximum 3 programming languages allowed" });
        }

        // Create new developer document without orders and invoices
        const developer = new Developer({
            user: req.user.id,
            firstName,
            lastName,
            dateOfBirth,
            programmingLanguages: languages,
            previousExperiences: previousExperiences.split(',').map(exp => exp.trim()).filter(Boolean),
            projectsLink,
            degree,
            discipline,
            yearOfCompletion: educationYear,
            resumeUrl,
            submitted: true
        });

        // Save the developer document
        await developer.save();
        
        console.log("✅ Developer application submitted:", developer);
        res.status(201).json({ 
            message: "Developer application submitted successfully", 
            developerId: developer._id,
            resumeUrl: developer.resumeUrl
        });

    } catch (error) {
        console.error("❌ Failed to submit developer application:", error);
        if (error.code === 11000) {
            return res.status(400).json({ 
                message: "You have already submitted an application or there's a conflict in the database."
            });
        }
        res.status(500).json({ message: "Failed to submit developer application.", error: error.message });
    }
};