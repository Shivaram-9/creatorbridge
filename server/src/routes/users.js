import { Router } from "express";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";
import { profileUpload } from "../middleware/upload.js";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
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
      populate: { path: "user", select: "name username avatar isVerified" }
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
    res.json({ verified: user.isVerified });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Failed to toggle verification" });
  }
});

usersRouter.post("/me/avatar", profileUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Avatar file is required" });
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.userId, { $set: { avatar: avatarPath } }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

usersRouter.patch("/me", async (req, res) => {
  try {
    const { name, username, category, bio, location, role, avatar, instagram, youtube } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).slice(0, 120);
    if (username !== undefined) updates.username = String(username).slice(0, 60);
    if (category !== undefined) updates.category = String(category).slice(0, 80);
    if (bio !== undefined) updates.bio = String(bio).slice(0, 2000);
    if (location !== undefined) updates.location = String(location).slice(0, 120);
    if (role !== undefined && ["influencer", "brand"].includes(role)) updates.role = role;
    if (avatar !== undefined) updates.avatar = String(avatar).slice(0, 1000); // Allow longer paths or base64 if needed
    if (instagram !== undefined) updates.instagram = String(instagram).slice(0, 200);
    if (youtube !== undefined) updates.youtube = String(youtube).slice(0, 200);

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
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

    // Add target to current user's following
    const me = await User.findByIdAndUpdate(
      currentId,
      { $addToSet: { following: targetId } },
      { new: true }
    );

    // Add current user to target user's followers
    await User.findByIdAndUpdate(
      targetId,
      { $addToSet: { followers: currentId } }
    );

    // Create notification
    await Notification.create({
      user: targetId,
      sender: currentId,
      type: "follow",
      message: `${me.username || me.name || "Someone"} started following you`,
    });

    res.json(me);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

usersRouter.post("/unfollow/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.userId;

    // Remove target from current user's following
    const me = await User.findByIdAndUpdate(
      currentId,
      { $pull: { following: targetId } },
      { new: true }
    );

    // Remove current user from target user's followers
    await User.findByIdAndUpdate(
      targetId,
      { $pull: { followers: currentId } }
    );

    res.json(me);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to unfollow user" });
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
    const filter = { _id: { $ne: req.userId }, isBanned: { $ne: true } };
    
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
    res.json(users);
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
    if (category) filter.category = category;

    const users = await User.find(filter)
      .select("-password")
      .limit(50)
      .lean();

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
  }
});

/** Special Discovery Segments */
usersRouter.get("/discover/trending", async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId }, isBanned: { $ne: true } })
      .select("-password")
      .sort({ followers: -1, profileViews: -1 })
      .limit(10)
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load trending" });
  }
});

usersRouter.get("/discover/verified", async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId }, 
      isVerified: true,
      isBanned: { $ne: true } 
    })
      .select("-password")
      .limit(15)
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load verified" });
  }
});

usersRouter.get("/discover/brands", async (req, res) => {
  try {
    const users = await User.find({ 
      _id: { $ne: req.userId }, 
      role: "brand",
      isBanned: { $ne: true } 
    })
      .select("-password")
      .limit(15)
      .lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to load brands" });
  }
});

usersRouter.get("/discover/suggested", async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const filter = { 
      _id: { $ne: req.userId, $nin: me.following },
      isBanned: { $ne: true } 
    };
    if (me.category) {
      filter.category = me.category;
    }
    
    let users = await User.find(filter).select("-password").limit(10).lean();
    
    // Fallback if no specific category match
    if (users.length < 5) {
      const more = await User.find({ 
        _id: { $ne: req.userId, $nin: me.following },
        isBanned: { $ne: true }
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
      return res.json(user);
    }
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
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
