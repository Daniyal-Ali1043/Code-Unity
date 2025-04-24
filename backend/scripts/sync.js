const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/UserModel"); // Adjust path if necessary

// Directly define MongoDB URI and Weavy API Key here
const MONGO_URI = "mongodb://localhost:27017/CodeUnity"; // Replace with your actual database name
const WEAVY_API_KEY = "wyu_WA6SWbAzuk0hjLK4VkZjeN56rfdShM2uF18U"; // Replace with your actual Weavy API key

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

const syncAllUsersWithWeavy = async () => {
  try {
    const users = await User.find({});
    console.log(`🔄 Syncing ${users.length} users with Weavy...`);

    for (const user of users) {
      try {
        await axios.post(
          "https://05704b8bdfde49c5934189d4c343c01a.weavy.io/api/users",
          {
            uid: user._id,      // Unique user ID from MongoDB
            name: user.username, // Full name
          },
          {
            headers: {
              Authorization: `Bearer ${WEAVY_API_KEY}`,
            },
          }
        );
        console.log(`✅ Synced user: ${user.username} | Alias: ${user.alias} | Role: ${user.role}`);
      } catch (error) {
        console.error(`❌ Error syncing user ${user.username}:`, error.response?.data || error.message);
      }
    }
  } catch (err) {
    console.error("❌ Error fetching users:", err.message);
  } finally {
    mongoose.connection.close();
  }
};

// Run the script
syncAllUsersWithWeavy();
