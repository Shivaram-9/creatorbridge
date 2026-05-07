import mongoose from "mongoose";
import { Router } from "express";
import { Message } from "../models/Message.js";
import { authMiddleware } from "../middleware/auth.js";
import { chatUpload } from "../middleware/upload.js";
import { io } from "../index.js";

export const messagesRouter = Router();

messagesRouter.use(authMiddleware);

// Get list of conversations
messagesRouter.get("/", async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    
    // Aggregate to find unique partners and their last message
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: uid }, { receiver: uid }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", uid] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", uid] },
                    { $eq: ["$read", false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner",
        },
      },
      {
        $unwind: "$partner",
      },
      {
        $project: {
          _id: 1,
          partner: {
            _id: 1,
            name: 1,
            username: 1,
            avatar: 1,
            role: 1,
          },
          lastMessage: 1,
          unreadCount: 1,
        },
      },
      {
        $sort: { "lastMessage.createdAt": -1 },
      },
    ]);

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load conversations" });
  }
});

messagesRouter.get("/conversation/:otherUserId", async (req, res) => {
  try {
    const { otherUserId } = req.params;
    if (!mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (otherUserId === req.userId) {
      return res.status(400).json({ error: "Invalid conversation" });
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
    const { receiverId, content, media: rawMedia, mediaUrl: rawMediaUrl, mediaType: rawMediaType } = req.body;
    if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ error: "Valid receiverId is required" });
    }
    const text = typeof content === "string" ? content.trim() : "";
    const media = (typeof rawMedia === "string" ? rawMedia.trim() : "") || (typeof rawMediaUrl === "string" ? rawMediaUrl.trim() : "");
    const mediaType = rawMediaType === "video" ? "video" : "image";

    if (!text && !media) {
      return res.status(400).json({ error: "Message content or media is required" });
    }
    if (receiverId === req.userId) {
      return res.status(400).json({ error: "Invalid receiver" });
    }
    const msg = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: text.slice(0, 5000),
      media: media.slice(0, 1000) || undefined,
      mediaUrl: media.slice(0, 1000) || undefined,
      mediaType: media ? mediaType : undefined,
    });
    await msg.populate("sender", "name email role");
    await msg.populate("receiver", "name email role");
    
    const plain = msg.toObject();
    if (io) {
      io.to(`user:${receiverId}`).emit("message", plain);
      io.to(`user:${req.userId}`).emit("message", plain);
    }
    
    res.status(201).json(plain);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

messagesRouter.post("/media", chatUpload.single("media"), async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ error: "Valid receiverId is required" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "Media file is required" });
    }

    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";
    const mediaPath = `/uploads/chat/${req.file.filename}`;

    const msg = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: content ? content.trim().slice(0, 5000) : "",
      media: mediaPath,
      mediaUrl: mediaPath,
      mediaType,
    });

    await msg.populate("sender", "name email role");
    await msg.populate("receiver", "name email role");

    const plain = msg.toObject();
    if (io) {
      io.to(`user:${receiverId}`).emit("message", plain);
      io.to(`user:${req.userId}`).emit("message", plain);
    }

    res.status(201).json(plain);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload media message" });
  }
});
// Mark conversation as read
messagesRouter.patch("/read/:partnerId", async (req, res) => {
  try {
    const { partnerId } = req.params;
    const uid = req.userId;
    
    await Message.updateMany(
      { sender: partnerId, receiver: uid, read: false },
      { $set: { read: true } }
    );
    
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});
