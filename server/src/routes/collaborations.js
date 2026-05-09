import express from "express";
import { Collaboration } from "../models/Collaboration.js";
import { Notification } from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Get User's Collaborations
router.get("/", authMiddleware, async (req, res) => {
  try {
    const collabs = await Collaboration.find({
      $or: [{ brand: req.userId }, { influencer: req.userId }],
    })
      .populate("brand", "name avatar")
      .populate("influencer", "name avatar")
      .populate("campaign", "title budget banner")
      .sort("-updatedAt");
    res.json(collabs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Collaboration Status
router.patch("/status/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const collab = await Collaboration.findById(req.params.id).populate("campaign", "title");
    if (!collab) return res.status(404).json({ error: "Collaboration not found" });

    if (collab.brand.toString() !== req.userId && collab.influencer.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    collab.status = status;
    await collab.save();

    // Notify the other party
    const recipient = collab.brand.toString() === req.userId ? collab.influencer : collab.brand;
    const notif = await Notification.create({
      user: recipient,
      sender: req.userId,
      type: "collab_status",
      message: `Collaboration status for "${collab.campaign.title}" updated to ${status}`,
    });
    
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${recipient}`).emit("notification", notif);
    }

    res.json(collab);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as collaborationsRouter };
