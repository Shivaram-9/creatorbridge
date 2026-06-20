import mongoose from "mongoose";
import { User } from "./src/models/User.js";
import { Collaboration } from "./src/models/Collaboration.js";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://shivaram:Shiva%40123@cluster0.wvw9n.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0");

async function attachMetrics(user) {
  if (!user) return user;
  
  const userObj = typeof user.toObject === "function" ? user.toObject() : user;
  const userId = userObj._id;

  try {
    // 1. Connections Count
    const followers = userObj.followers || [];
    const following = userObj.following || [];
    const connectionIds = new Set([
      ...followers.map(id => id.toString()),
      ...following.map(id => id.toString())
    ]);
    userObj.connectionsCount = connectionIds.size;

    // 2. Profile Reach
    userObj.profileReach = await User.countDocuments({ viewedProfiles: userId });

    // 3. Featured In / Partnerships
    if (userObj.role === "brand") {
      const uniqueCreators = await Collaboration.distinct("influencer", {
        brand: userId,
        status: { $in: ["Accepted", "Completed"] }
      });
      userObj.featuredIn = uniqueCreators.length;
    } else if (userObj.role === "influencer") {
      const uniqueBrandsInCollabs = await Collaboration.distinct("brand", {
        influencer: userId,
        status: { $in: ["Accepted", "Completed"] }
      });
      const uniqueBrandsShortlisted = await User.distinct("_id", {
        role: "brand",
        shortlistedCreators: userId
      });
      const unionSet = new Set([
        ...uniqueBrandsInCollabs.map(id => id.toString()),
        ...uniqueBrandsShortlisted.map(id => id.toString())
      ]);
      userObj.featuredIn = unionSet.size;
    } else {
      userObj.featuredIn = 0;
    }
  } catch (err) {
    console.error("Error calculating genuine metrics:", err);
    userObj.connectionsCount = 0;
    userObj.profileReach = 0;
    userObj.featuredIn = 0;
  }

  // 4. Auto-fill Demo Trust Score Metrics if missing (for development/testing)
  if (!userObj.trustScore) {
    const generateSeededValue = (id, min, max, seed) => {
      let sum = 0;
      const idStr = String(id);
      for (let i = 0; i < idStr.length; i++) sum += idStr.charCodeAt(i) * seed;
      return Math.floor(min + (sum % (max - min + 1)));
    };
    const idStr = userObj._id || "default";
    userObj.trustScore = generateSeededValue(idStr, 70, 99, 1);
    userObj.completedCampaigns = generateSeededValue(idStr, 5, 45, 2);
    userObj.responseRate = generateSeededValue(idStr, 80, 100, 3);
    userObj.onTimeDelivery = generateSeededValue(idStr, 85, 100, 4);
    userObj.averageRating = Number((generateSeededValue(idStr, 40, 50, 5) / 10).toFixed(1));
  }

  return userObj;
}

async function test() {
  const user = await User.findOne();
  if (!user) {
    console.log("No user found");
    process.exit(0);
  }
  console.log("Before:", user.trustScore);
  const userWithMetrics = await attachMetrics(user);
  console.log("After:", userWithMetrics.trustScore);
  process.exit(0);
}
test();
