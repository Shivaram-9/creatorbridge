import { Router } from "express";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import { authMiddleware } from "../middleware/auth.js";

export const moderationRouter = Router();

moderationRouter.use(authMiddleware);

// POST /api/moderation/report
moderationRouter.post("/report", async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    const report = await Report.create({
      reporter: req.userId,
      targetType,
      targetId,
      reason,
      description
    });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// POST /api/moderation/block/:userId
moderationRouter.post("/block/:userId", async (req, res) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.userId) return res.status(400).json({ error: "Cannot block yourself" });

    await User.findByIdAndUpdate(req.userId, { $addToSet: { blockedUsers: targetId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { blockedBy: req.userId } });

    // Auto unfollow
    await User.findByIdAndUpdate(req.userId, { $pull: { following: targetId, followers: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { following: req.userId, followers: req.userId } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to block user" });
  }
});

// POST /api/moderation/unblock/:userId
moderationRouter.post("/unblock/:userId", async (req, res) => {
  try {
    const targetId = req.params.userId;
    await User.findByIdAndUpdate(req.userId, { $pull: { blockedUsers: targetId } });
    await User.findByIdAndUpdate(targetId, { $pull: { blockedBy: req.userId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// GET /api/moderation/blocked
moderationRouter.get("/blocked", async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("blockedUsers", "username name avatar");
    res.json(user.blockedUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to load blocked users" });
  }
});
