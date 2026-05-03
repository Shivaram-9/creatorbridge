import { Router } from "express";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

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

usersRouter.patch("/me", async (req, res) => {
  try {
    const { name, username, category, bio, location, role, avatar, instagram, youtube, followers } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = String(name).slice(0, 120);
    if (username !== undefined) updates.username = String(username).slice(0, 60);
    if (category !== undefined) updates.category = String(category).slice(0, 80);
    if (bio !== undefined) updates.bio = String(bio).slice(0, 2000);
    if (location !== undefined) updates.location = String(location).slice(0, 120);
    if (role !== undefined && ["influencer", "brand"].includes(role)) updates.role = role;
    if (avatar !== undefined) updates.avatar = String(avatar).slice(0, 500);
    if (instagram !== undefined) updates.instagram = String(instagram).slice(0, 200);
    if (youtube !== undefined) updates.youtube = String(youtube).slice(0, 200);
    if (followers !== undefined) {
      const n = Number(followers);
      updates.followers = Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
    }
    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
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
    const { category } = req.query;
    const filter = { _id: { $ne: req.userId } };
    if (category && String(category).trim()) {
      filter.category = new RegExp(`^${String(category).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    }
    const users = await User.find(filter).select("-password").sort({ name: 1, email: 1 }).lean();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list users" });
  }
});

/** Search: by name or username */
usersRouter.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.json([]);
    const keyword = q.trim();
    if (!keyword) return res.json([]);

    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const users = await User.find({
      _id: { $ne: req.userId },
      $or: [{ name: regex }, { username: regex }],
    })
      .select("-password")
      .limit(50)
      .lean();

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Search failed" });
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
