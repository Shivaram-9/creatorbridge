import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Report } from "../models/Report.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRouter = Router();

// Publicly accessible but authenticated route to SUBMIT a report
adminRouter.post("/reports", authMiddleware, async (req, res) => {
  try {
    const { targetUser, targetPost, reason, description } = req.body;
    if (!reason) return res.status(400).json({ error: "Reason is required" });

    const report = await Report.create({
      reporter: req.userId,
      targetUser,
      targetPost,
      reason,
      description
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// --- ADMIN ONLY ROUTES ---
adminRouter.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats - Analytics overview
adminRouter.get("/stats", async (req, res) => {
  try {
    const [userCount, postCount, pendingReports] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: "pending" })
    ]);
    res.json({ userCount, postCount, pendingReports });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/admin/reports - Fetch all reports
adminRouter.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name username avatar")
      .populate("targetUser", "name username avatar isBanned")
      .populate("targetPost")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// PATCH /api/admin/reports/:id - Resolve report
adminRouter.patch("/reports/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to update report" });
  }
});

// GET /api/admin/users - User management
adminRouter.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH /api/admin/ban/:id - Toggle ban
adminRouter.patch("/ban/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle ban status" });
  }
});

// DELETE /api/admin/posts/:id - Force delete post
adminRouter.delete("/posts/:id", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});
