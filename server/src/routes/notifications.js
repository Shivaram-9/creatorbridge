import { Router } from "express";
import { Notification } from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

// Get all notifications for logged-in user
notificationsRouter.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.userId })
      .populate("sender", "name username avatar")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
notificationsRouter.post("/read/:id", async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    res.json(notification);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Mark all as read
notificationsRouter.post("/read-all", async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId, read: false }, { read: true });
    res.json({ message: "All marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});
