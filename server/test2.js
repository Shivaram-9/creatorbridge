import mongoose from "mongoose";
import { User } from "./src/models/User.js";
import { attachAlignmentStatus } from "./src/utils/alignment.js";
import { Collaboration } from "./src/models/Collaboration.js";
import dotenv from "dotenv";
dotenv.config();

async function attachMetrics(user) {
  if (!user) return user;
  const userObj = typeof user.toObject === "function" ? user.toObject() : user;
  const userId = userObj._id;
  try {
    const followers = userObj.followers || [];
    const following = userObj.following || [];
    const connectionIds = new Set([
      ...followers.map(id => id.toString()),
      ...following.map(id => id.toString())
    ]);
    userObj.connectionsCount = connectionIds.size;
    userObj.profileReach = await User.countDocuments({ viewedProfiles: userId });
    userObj.featuredIn = 0;
  } catch (err) {
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
  await mongoose.connect(process.env.MONGO_URI);
  let user = await User.findOne().select("-password").lean();
  console.log("From DB lean(), trustScore is:", user.trustScore);
  user = await attachMetrics(user);
  console.log("After attachMetrics, trustScore is:", user.trustScore);
  
  const req = { userId: user._id.toString() };
  const finalObj = await attachAlignmentStatus(req, user);
  console.log("After attachAlignmentStatus, trustScore is:", finalObj.trustScore);
  process.exit(0);
}
test();
