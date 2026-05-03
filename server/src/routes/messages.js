import mongoose from "mongoose";
import { Router } from "express";
import { Message } from "../models/Message.js";
import { authMiddleware } from "../middleware/auth.js";
import { hasAcceptedConnection } from "../lib/connectionHelpers.js";

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);

messagesRouter.get("/conversation/:otherUserId", async (req, res) => {
  try {
    const { otherUserId } = req.params;
    if (!mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (otherUserId === req.userId) {
      return res.status(400).json({ error: "Invalid conversation" });
    }
    const ok = await hasAcceptedConnection(req.userId, otherUserId);
    if (!ok) {
      return res.status(403).json({ error: "You must be connected to message this user" });
    }
    const uid = new mongoose.Types.ObjectId(req.userId);
    const oid = new mongoose.Types.ObjectId(otherUserId);
    const msgs = await Message.find({
      $or: [
        { sender: uid, receiver: oid },
        { sender: oid, receiver: uid },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("sender", "name email role")
      .lean();
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

messagesRouter.post("/", async (req, res) => {
  try {
    const { receiverId, content, mediaUrl: rawMediaUrl, mediaType: rawMediaType } = req.body;
    if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ error: "Valid receiverId is required" });
    }
    const text = typeof content === "string" ? content.trim() : "";
    const mediaUrl = typeof rawMediaUrl === "string" ? rawMediaUrl.trim() : "";
    const mediaType = rawMediaType === "video" ? "video" : "image";

    if (!text && !mediaUrl) {
      return res.status(400).json({ error: "Message content or media is required" });
    }
    if (receiverId === req.userId) {
      return res.status(400).json({ error: "Invalid receiver" });
    }
    const ok = await hasAcceptedConnection(req.userId, receiverId);
    if (!ok) {
      return res.status(403).json({ error: "You must be connected to message this user" });
    }
    const msg = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: text.slice(0, 5000),
      mediaUrl: mediaUrl.slice(0, 1000) || undefined,
      mediaType: mediaUrl ? mediaType : undefined,
    });
    await msg.populate("sender", "name email role");
    await msg.populate("receiver", "name email role");
    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});
