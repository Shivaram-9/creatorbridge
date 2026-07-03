import { Router } from "express";
import { User } from "../models/User.js";
import { Review } from "../models/Review.js";
import { Notification } from "../models/Notification.js";
import { AlignRequest } from "../models/AlignRequest.js";
import { Collaboration } from "../models/Collaboration.js";
import { Post } from "../models/Post.js";
import { authMiddleware } from "../middleware/auth.js";
import { profileUpload, coverUpload, postUpload } from "../middleware/upload.js";
import { attachAlignmentStatus } from "../utils/alignment.js";
import { createRealTimeNotification } from "../utils/notifications.js";
import bcrypt from "bcryptjs";
import { SecurityAlert } from "../models/SecurityAlert.js";
import { EmailService } from "../services/EmailService.js";

export const usersRouter = Router();

// TEMPORARY ENDPOINT TO RESET STATS
usersRouter.get("/reset-all-stats-secret", async (req, res) => {
  try {
    const { User } = await import("../models/User.js");
    const { Post } = await import("../models/Post.js");
    const u = await User.updateMany({}, { $set: { profileViews: 0, postImpressions: 0 } });
    const p = await Post.updateMany({}, { $set: { views: 0 } });
    res.json({ success: true, usersModified: u.modifiedCount, postsModified: p.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

usersRouter.get("/test-gender/:username", async (req, res) => {
  try {
    const { User } = await import("../models/User.js");
    const user = await User.findOne({ username: req.params.username }).lean();
    res.json({ username: user.username, gender: user.gender, _id: user._id, fullDoc: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


usersRouter.use(authMiddleware);

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

    // 4. Post Impressions (Total views across all user posts)
    const [impressionData] = await Post.aggregate([
      { $match: { user: userId } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    userObj.postImpressions = impressionData ? impressionData.totalViews : 0;
    userObj.profileViews = userObj.profileViews || 0;

  } catch (err) {
    console.error("Error calculating genuine metrics:", err);
    userObj.connectionsCount = 0;
    userObj.profileReach = 0;
    userObj.featuredIn = 0;
  }

  // Metrics calculation removed for real scenario.
  // The system will now use actual values from the database.
  
  return userObj;
}

usersRouter.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const userWithMetrics = await attachMetrics(user);
    res.json(userWithMetrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

// GET /api/users/saved - Fetch populated saved posts
usersRouter.get("/saved", async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "savedPosts",
      populate: { path: "user", select: "name username avatar isVerified role category premiumTier" }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Filter out deleted posts and reverse to show latest first
    const saved = (user.savedPosts || []).filter(p => p !== null).reverse();
    res.json(saved);
  } catch (err) {
    console.error("Get saved error:", err);
    res.status(500).json({ error: "Failed to load saved posts" });
  }
});

// PATCH /api/users/verify/:id - Toggle verification status
usersRouter.patch("/verify/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isVerified = !user.isVerified;
    await user.save();
    
    // Emit Socket Event (Real-time)
    const io = req.app.get("io");
    if (io) {
      if (user.isVerified) {
        io.to(`user:${user._id}`).emit("verification_status_changed", {
          isVerified: true,
          message: "Your account has been verified"
        });
      } else {
        io.to(`user:${user._id}`).emit("verification_status_changed", {
          isVerified: false,
          message: "Your verification status has been removed"
        });
      }
    }

    res.json({ verified: user.isVerified });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Failed to toggle verification" });
  }
});

usersRouter.post("/me/avatar", profileUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Avatar file is required" });
    // Cloudinary returns file.path (full https URL); disk uses filename
    const avatarPath = req.file.path || `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { $set: { avatar: avatarPath } }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    const userWithMetrics = await attachMetrics(user);
    res.json(userWithMetrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

usersRouter.post("/me/cover", coverUpload.single("cover"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Cover file is required" });
    const coverPath = req.file.path || `/uploads/covers/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { $set: { cover: coverPath } }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    const userWithMetrics = await attachMetrics(user);
    res.json(userWithMetrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload cover" });
  }
});

// PUT /api/users/portfolio-details - Save portfolio builder data
usersRouter.put("/portfolio-details", async (req, res) => {
  try {
    const { portfolioDetails } = req.body;
    if (!portfolioDetails) return res.status(400).json({ error: "portfolioDetails required" });
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { portfolioDetails } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true, portfolioDetails: user.portfolioDetails });
  } catch (err) {
    console.error("Error updating portfolio details:", err);
    res.status(500).json({ error: "Failed to save portfolio details" });
  }
});

usersRouter.patch("/me", async (req, res) => {
  try {
    const { name, username, gender, category, bio, experience, location, role, avatar, website, portfolioLink, socialMediaLink, instagram, youtube, trustScore, completedCampaigns, responseRate, onTimeDelivery, averageRating } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).slice(0, 120);
    if (username !== undefined) updates.username = String(username).slice(0, 60);
    if (gender !== undefined && ["Male", "Female", ""].includes(gender)) updates.gender = gender;
    if (category !== undefined) updates.category = String(category).slice(0, 80);
    if (bio !== undefined) updates.bio = String(bio).slice(0, 2000);
    if (experience !== undefined) updates.experience = String(experience).slice(0, 2000);
    if (location !== undefined) updates.location = String(location).slice(0, 120);
    if (website !== undefined) updates.website = String(website).slice(0, 200);
    if (portfolioLink !== undefined) updates.portfolioLink = String(portfolioLink).slice(0, 200);
    if (socialMediaLink !== undefined) updates.socialMediaLink = String(socialMediaLink).slice(0, 200);
    if (role !== undefined && ["influencer", "brand"].includes(role)) updates.role = role;
    if (avatar !== undefined) updates.avatar = String(avatar).slice(0, 1000); // Allow longer paths or base64 if needed
    if (instagram !== undefined) updates.instagram = String(instagram).slice(0, 200);
    if (youtube !== undefined) updates.youtube = String(youtube).slice(0, 200);
    
    // Trust Score Metrics (for testing / admin)
    if (trustScore !== undefined) updates.trustScore = Number(trustScore);
    if (completedCampaigns !== undefined) updates.completedCampaigns = Number(completedCampaigns);
    if (responseRate !== undefined) updates.responseRate = Number(responseRate);
    if (onTimeDelivery !== undefined) updates.onTimeDelivery = Number(onTimeDelivery);
    if (averageRating !== undefined) updates.averageRating = Number(averageRating);

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true, strict: false }).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    const userWithMetrics = await attachMetrics(user);
    if (updates.gender !== undefined) userWithMetrics.gender = updates.gender;
    res.json(userWithMetrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

/* ── Follow / Unfollow endpoints ── */

usersRouter.post("/follow/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    if (targetId === currentId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ error: "User not found" });

    // Block Check (Prompt-6)
    if (targetUser.blockedUsers?.includes(currentId) || targetUser.blockedBy?.includes(currentId)) {
      return res.status(403).json({ error: "You cannot follow this user" });
    }

    // ALWAYS use AlignRequest instead of immediate follow as per user requirement
    // Check legacy follow data first
    const me = await User.findById(currentId);
    const isAlreadyFollowing = me.following.some(id => id.toString() === targetId);
    if (isAlreadyFollowing) {
      return res.status(400).json({ error: "Already connected. End connection first if you wish to reset." });
    }

    const existing = await AlignRequest.findOne({ sender: currentId, receiver: targetId });
    if (existing) {
      if (existing.status === "pending") return res.status(400).json({ error: "Request already pending" });
      if (existing.status === "accepted") return res.status(400).json({ error: "Already aligned" });
      // If rejected, allow re-requesting
      existing.status = "pending";
      await existing.save();
    } else {
      console.log(`Creating fresh AlignRequest from ${currentId} to ${targetId}`);
      await AlignRequest.create({ sender: currentId, receiver: targetId });
    }

    const newRequest = existing || await AlignRequest.findOne({ sender: currentId, receiver: targetId });
    const requestId = newRequest?._id;

    // Create notification for the receiver
    const io = req.app.get("io");
    await createRealTimeNotification(io, {
      user: targetId,
      sender: currentId,
      type: "align_request",
      message: "sent you a connection request",
      requestId: requestId
    });

    // Socket event for specifically triggering the interactive toast is still handled here
    // But createRealTimeNotification already emits the generic "notification" event
    if (io) {
      const me = await User.findById(currentId).select("name username");
      io.to(`user:${targetId}`).emit("align_request_received", {
        senderId: currentId,
        senderName: me?.name || me?.username || "Someone",
        requestId: requestId,
        message: "requested to connect with you"
      });
    }

    res.json({ message: "Connection request sent", requested: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

usersRouter.post("/unfollow/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    // Mutual Unfollow: A stops following B AND B stops following A
    // Also cleanup any AlignRequest records to allow fresh requests later
    await Promise.all([
      User.findByIdAndUpdate(currentId, { $pull: { following: targetId, followers: targetId } }),
      User.findByIdAndUpdate(targetId, { $pull: { following: currentId, followers: currentId } }),
      AlignRequest.deleteMany({
        $or: [
          { sender: currentId, receiver: targetId },
          { sender: targetId, receiver: currentId }
        ]
      })
    ]);

    const updatedMe = await User.findById(currentId).select("-password");
    const userWithMetrics = await attachMetrics(updatedMe);
    res.json(userWithMetrics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

/* ── Portfolio endpoints ── */

/** POST /users/me/portfolio/upload — upload portfolio media */
usersRouter.post("/me/portfolio/upload", postUpload.single("media"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No media file provided" });
    }
    
    let url = "";
    if (req.file.path && req.file.path.startsWith("http")) {
      url = req.file.path;
    } else if (req.file.filename) {
      url = `/uploads/posts/${req.file.filename}`;
    }

    if (!url) {
      return res.status(500).json({ error: "Upload failed to return a valid path" });
    }

    // Convert Cloudinary URL to secure
    if (url.includes("res.cloudinary.com") && url.startsWith("http:")) {
      url = url.replace("http:", "https:");
    }

    res.json({ url });
  } catch (error) {
    console.error("Portfolio upload error:", error);
    res.status(500).json({ error: "Failed to upload portfolio media" });
  }
});

/* ── Portfolio endpoints ── */

/** POST /users/me/portfolio — add an item (max 10) */
usersRouter.post("/me/portfolio", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.portfolio.length >= 10) {
      return res.status(400).json({ error: "Portfolio is full (max 10 items)" });
    }
    const { url, caption, mediaType } = req.body;
    if (!url) return res.status(400).json({ error: "url is required" });
    user.portfolio.push({
      url: String(url),
      caption: String(caption || "").slice(0, 300),
      mediaType: mediaType === "video" ? "video" : "image",
    });
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add portfolio item" });
  }
});

/** DELETE /users/me/portfolio/:itemId — remove an item */
usersRouter.delete("/me/portfolio/:itemId", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    user.portfolio = user.portfolio.filter(
      (item) => item._id.toString() !== req.params.itemId
    );
    await user.save();
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove portfolio item" });
  }
});

/** Discovery: all users except self, optional ?category= */
usersRouter.get("/", async (req, res) => {
  try {
    const { category, role, verified } = req.query;
    const filter = { 
      _id: { $ne: req.userId }, 
      isBanned: { $ne: true },
      isDiscoverable: true,
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId }
    };
    
    if (category && String(category).trim()) {
      filter.category = new RegExp(String(category).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    }
    if (role) filter.role = role;
    if (verified === "true") filter.isVerified = true;

    const users = await User.find(filter)
      .select("-password")
      .sort({ followers: -1, profileViews: -1 })
      .limit(100)
      .lean();

    res.json(await attachAlignmentStatus(req, users));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

/** Search: by name, username, bio, category, location */
usersRouter.get("/search", async (req, res) => {
  try {
    const { q, role, verified, category } = req.query;
    if (!q || typeof q !== "string") return res.json([]);
    const keyword = q.trim();
    if (!keyword) return res.json([]);

    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const filter = {
      _id: { $ne: req.userId },
      isBanned: { $ne: true },
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId },
      $or: [
        { name: regex },
        { username: regex },
        { bio: regex },
        { category: regex },
        { location: regex }
      ],
    };

    if (role) filter.role = role;
    if (verified === "true") filter.isVerified = true;
    if (req.query.premium === "true") filter.isPremium = true;
    if (category) filter.category = category;

    const users = await User.find(filter)
      .select("-password")
      .limit(50)
      .lean();

    res.json(await attachAlignmentStatus(req, users));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

/** Special Discovery Segments */
usersRouter.get("/discover/trending", async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId }, 
      isBanned: { $ne: true },
      isDiscoverable: true,
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId }
    })
      .select("-password")
      .sort({ followers: -1, profileViews: -1 })
      .limit(10)
      .lean();
    res.json(await attachAlignmentStatus(req, users));
  } catch (err) {
    res.status(500).json({ error: "Failed to load trending" });
  }
});

usersRouter.get("/discover/verified", async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId }, 
      isVerified: true,
      isBanned: { $ne: true },
      isDiscoverable: true,
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId }
    })
      .select("-password")
      .limit(15)
      .lean();
    res.json(await attachAlignmentStatus(req, users));
  } catch (err) {
    res.status(500).json({ error: "Failed to load verified" });
  }
});

usersRouter.get("/discover/brands", async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId }, 
      role: "brand",
      isBanned: { $ne: true },
      isDiscoverable: true,
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId }
    })
      .select("-password")
      .limit(15)
      .lean();
    res.json(await attachAlignmentStatus(req, users));
  } catch (err) {
    res.status(500).json({ error: "Failed to load brands" });
  }
});

usersRouter.get("/discover/suggested", async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const filter = { 
      _id: { $ne: req.userId, $nin: me.following },
      isBanned: { $ne: true },
      isDiscoverable: true,
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId }
    };
    if (me.category) {
      filter.category = me.category;
    }
    
    let users = await User.find(filter).select("-password").limit(10).lean();
    
    // Fallback if no specific category match
    if (users.length < 5) {
      const more = await User.find({ 
        _id: { $ne: req.userId, $nin: me.following },
        isBanned: { $ne: true },
        isDiscoverable: true,
        blockedBy: { $ne: req.userId },
        blockedUsers: { $ne: req.userId }
      })
      .select("-password")
      .limit(10)
      .lean();
      users = [...users, ...more.filter(u => !users.find(x => x._id.toString() === u._id.toString()))].slice(0, 10);
    }
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load suggestions" });
  }
});


usersRouter.get("/:id", async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      const userWithMetrics = await attachMetrics(user);
      return res.json(userWithMetrics);
    }
    let user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // Block Check (Prompt-6)
    if (user.blockedUsers?.includes(req.userId) || user.blockedBy?.includes(req.userId)) {
      return res.status(403).json({ error: "This user has blocked you or you have blocked them." });
    }

    user = await attachMetrics(user);
    res.json(await attachAlignmentStatus(req, user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

usersRouter.get("/:id/followers", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("followers", "name username avatar role")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.followers || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load followers" });
  }
});

usersRouter.get("/:id/following", async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("following", "name username avatar role")
      .lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.following || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load following" });
  }
});

// Collections
usersRouter.get("/collections", async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "collections.posts",
      populate: { path: "user", select: "name username avatar isVerified role category premiumTier" }
    });
    res.json(user.collections || []);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

usersRouter.post("/collections", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $push: { collections: { name, posts: [] } } },
      { new: true }
    );
    res.json(user.collections);
  } catch (err) {
    res.status(500).json({ error: "Failed to create collection" });
  }
});

usersRouter.post("/collections/:colId/add", async (req, res) => {
  try {
    const { postId } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "collections._id": req.params.colId },
      { $addToSet: { "collections.$.posts": postId } },
      { new: true }
    );
    res.json(user.collections);
  } catch (err) {
    res.status(500).json({ error: "Failed to add to collection" });
  }
});

usersRouter.delete("/collections/:colId/remove", async (req, res) => {
  try {
    const { postId } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.userId, "collections._id": req.params.colId },
      { $pull: { "collections.$.posts": postId } },
      { new: true }
    );
    res.json(user.collections);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove from collection" });
  }
});

// POST /api/users/change-password
usersRouter.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // Create Security Alert
    await SecurityAlert.create({
      user: user._id,
      type: "password_change",
      message: "Your account password was changed from the settings page."
    });

    // Send security alert email
    EmailService.sendSecurityAlert(user, "password_change").catch(err => 
      console.error("Failed to send password change email:", err.message)
    );

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password route error:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// POST /api/users/support
import { sendEmail } from "../utils/email.js";
usersRouter.post("/support", async (req, res) => {
  try {
    const { subject, message } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ error: "Subject and message are required" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const supportEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;
    if (!supportEmail) {
      return res.status(500).json({ error: "Support email not configured" });
    }

    const htmlContent = `
      <h3>New Help Center Request</h3>
      <p><strong>From:</strong> ${user.name} (${user.email})</p>
      <p><strong>User ID:</strong> ${user._id}</p>
      <hr />
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
    `;

    await sendEmail({
      to: supportEmail,
      replyTo: user.email,
      subject: `[Support Request] ${subject}`,
      html: htmlContent
    });

    res.json({ message: "Support request sent successfully" });
  } catch (err) {
    console.error("Support route error:", err);
    res.status(500).json({ error: "Failed to send support request" });
  }
});

// Profile Rating endpoint
usersRouter.post("/:id/rate", async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const authorId = req.userId;
    const { rating, comment } = req.body;

    if (targetUserId === authorId) {
      return res.status(400).json({ error: "You cannot rate yourself" });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating" });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Upsert the review
    await Review.findOneAndUpdate(
      { targetUser: targetUserId, author: authorId },
      { rating, comment },
      { upsert: true, new: true }
    );

    // Calculate new average
    const allReviews = await Review.find({ targetUser: targetUserId });
    const totalScore = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalScore / allReviews.length;

    // Update user
    targetUser.averageRating = Number(averageRating.toFixed(1));
    // Calculate Trust Score based on Real Metrics
    let newTrustScore = 20; // Base score
    newTrustScore += Math.min(30, (targetUser.completedCampaigns || 0) * 2); // Up to 30 pts for campaigns
    newTrustScore += Math.min(20, ((targetUser.responseRate || 0) / 100) * 20); // Up to 20 pts for response rate
    newTrustScore += Math.min(30, (averageRating / 5) * 30); // Up to 30 pts for average rating
    
    targetUser.trustScore = Math.floor(newTrustScore);
    await targetUser.save();

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("profile_rating_updated", {
        userId: targetUserId,
        averageRating: targetUser.averageRating,
        totalReviews: allReviews.length,
        trustScore: targetUser.trustScore
      });
    }

    res.json({ message: "Rating submitted successfully", averageRating: targetUser.averageRating, trustScore: targetUser.trustScore });
  } catch (err) {
    console.error("Profile rating error:", err);
    res.status(500).json({ error: "Failed to submit rating" });
  }
});

// DELETE /api/users/me - Permanently delete account
usersRouter.delete("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    const { Message } = await import("../models/Message.js");
    const { Session } = await import("../models/Session.js");
    const { Campaign } = await import("../models/Campaign.js");
    const { Deal } = await import("../models/Deal.js");
    
    // Delete all associated user data
    await Promise.all([
      User.findByIdAndDelete(userId),
      Post.deleteMany({ user: userId }),
      Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
      Collaboration.deleteMany({ $or: [{ creator: userId }, { brand: userId }] }),
      Notification.deleteMany({ user: userId }),
      Review.deleteMany({ $or: [{ reviewer: userId }, { target: userId }] }),
      AlignRequest.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] }),
      Session.deleteMany({ userId: userId }),
      Campaign.deleteMany({ brand: userId }),
      Deal.deleteMany({ $or: [{ brand: userId }, { creator: userId }] })
    ]);

    // Also remove this user from all other users' followers/following arrays
    await User.updateMany(
      { $or: [{ followers: userId }, { following: userId }] },
      { $pull: { followers: userId, following: userId } }
    );

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    console.error("Account deletion error:", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});
