import { Router } from "express";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { AlignRequest } from "../models/AlignRequest.js";
import { authMiddleware } from "../middleware/auth.js";

export const privacyRouter = Router();

privacyRouter.use(authMiddleware);

// GET /api/privacy/settings
privacyRouter.get("/settings", async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("isPrivate allowMessagesFrom showActivityStatus isDiscoverable notifSettings");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to load privacy settings" });
  }
});

// PATCH /api/privacy/settings
privacyRouter.patch("/settings", async (req, res) => {
  try {
    const allowedFields = ["isPrivate", "allowMessagesFrom", "showActivityStatus", "isDiscoverable", "notifSettings"];
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updates }, { new: true }).select(allowedFields.join(" "));
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update privacy settings" });
  }
});

// GET /api/privacy/requests
privacyRouter.get("/requests", async (req, res) => {
  try {
    const requests = await AlignRequest.find({ receiver: req.userId, status: "pending" }).populate("sender", "username name avatar");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: "Failed to load requests" });
  }
});

// POST /api/privacy/requests/:requestId/:action
privacyRouter.post("/requests/:requestId/:action", async (req, res) => {
  try {
    const { requestId, action } = req.params;
    const request = await AlignRequest.findOne({ _id: requestId, receiver: req.userId });
    
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.status !== "pending") return res.status(400).json({ error: "Request already processed" });

    if (action === "accept") {
      request.status = "accepted";
      // Mutual alignment: Both follow each other
      await Promise.all([
        User.findByIdAndUpdate(request.receiver, { $addToSet: { followers: request.sender, following: request.sender } }),
        User.findByIdAndUpdate(request.sender, { $addToSet: { followers: request.receiver, following: request.receiver } })
      ]);
      
      const Notification = mongoose.model("Notification");
      await Notification.create({
        user: request.sender,
        sender: request.receiver,
        type: "follow",
        message: "has accepted your request",
      });
    } else {
      request.status = "rejected";
      
      const Notification = mongoose.model("Notification");
      await Notification.create({
        user: request.sender,
        sender: request.receiver,
        type: "align_request",
        message: "has declined your request",
      });
    }

    await request.save();
    res.json({ success: true, action });
  } catch (err) {
    res.status(500).json({ error: "Failed to process request" });
  }
});
