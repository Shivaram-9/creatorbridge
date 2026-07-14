import mongoose from "mongoose";
import { Router } from "express";
import { v2 as cloudinary } from "cloudinary";
import { Message } from "../models/Message.js";
import { authMiddleware } from "../middleware/auth.js";
import { chatUpload } from "../middleware/upload.js";

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
            partner: {
              $cond: [
                { $eq: ["$sender", uid] },
                "$receiver",
                "$sender",
              ]
            },
            application: { $ifNull: ["$application", null] }
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
          localField: "_id.partner",
          foreignField: "_id",
          as: "partner",
        },
      },
      {
        $lookup: {
          from: "applications",
          localField: "_id.application",
          foreignField: "_id",
          as: "applicationData"
        }
      },
      {
        $unwind: "$partner",
      },
      {
        $unwind: { path: "$applicationData", preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: "campaigns",
          localField: "applicationData.campaign",
          foreignField: "_id",
          as: "campaignData"
        }
      },
      {
        $unwind: { path: "$campaignData", preserveNullAndEmptyArrays: true }
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
            isVerified: 1,
            isPremium: 1,
          },
          application: {
            $cond: [
              { $eq: [{ $type: "$applicationData" }, "missing"] },
              null,
              {
                _id: "$applicationData._id",
                campaignId: "$campaignData._id",
                campaignTitle: "$campaignData.title",
                status: "$applicationData.status"
              }
            ]
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
    const dealId = req.query.dealId;
    const applicationId = req.query.applicationId;

    const filter = {
      $or: [
        { sender: uid, receiver: oid },
        { sender: oid, receiver: uid },
      ],
    };

    if (applicationId && mongoose.isValidObjectId(applicationId)) {
      filter.application = applicationId;
    } else if (dealId && mongoose.isValidObjectId(dealId)) {
      filter.deal = dealId;
    } else {
      filter.deal = { $exists: false }; // Normal chat
      filter.application = { $exists: false };
    }

    const msgs = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate("sender", "name email role avatar isVerified isPremium")
      .lean();
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

messagesRouter.post("/", async (req, res) => {
  try {
    const { receiverId, content, dealId, applicationId, media: rawMedia, mediaUrl: rawMediaUrl, mediaType: rawMediaType } = req.body;
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
      deal: dealId && mongoose.isValidObjectId(dealId) ? dealId : undefined,
      application: applicationId && mongoose.isValidObjectId(applicationId) ? applicationId : undefined,
    });
    await msg.populate("sender", "name email role avatar isVerified isPremium");
    await msg.populate("receiver", "name email role avatar isVerified isPremium");
    
    const plain = msg.toObject();
    const io = req.app.get("io");
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

    // ─── MEDIA PATH RESOLUTION ──────────────────────────────────────────────
    let mediaPath = "";
    const isCloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (isCloudinary && req.file.buffer) {
      // Manual upload from memory buffer to Cloudinary
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { 
              folder: "Pactogram/chat",
              resource_type: "auto"
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(req.file.buffer);
        });
        mediaPath = uploadResult.secure_url || uploadResult.url;
      } catch (err) {
        console.error("Cloudinary manual upload failed:", err);
        return res.status(500).json({ error: "Failed to upload media to cloud" });
      }
    } else if (req.file.buffer) {
      // Fallback: If Cloudinary is off but we have a buffer, we must save it locally
      // This is less common but good for safety
      const filename = `${Date.now()}-${req.file.originalname}`;
      const localPath = `uploads/chat/${filename}`;
      const fs = await import("fs");
      const path = await import("path");
      const uploadDir = path.join(process.cwd(), "uploads/chat");
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer);
      mediaPath = `/uploads/chat/${filename}`;
    } else {
      // Legacy support for disk storage if multer config was changed back
      mediaPath = req.file.secure_url || req.file.path || req.file.url || "";
      if (!mediaPath.startsWith("http")) {
        mediaPath = `/uploads/chat/${req.file.filename}`;
      }
    }

    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const msg = await Message.create({
      sender: req.userId,
      receiver: receiverId,
      content: (content || "").trim(),
      media: mediaPath,
      mediaUrl: mediaPath,
      mediaType: mediaType,
    });
    await msg.populate("sender", "name email role avatar isVerified isPremium");
    await msg.populate("receiver", "name email role avatar isVerified isPremium");

    const plain = msg.toObject();
    const io = req.app.get("io");
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

// Update Proposal status and handle negotiations
messagesRouter.patch("/:id/proposal", async (req, res) => {
  try {
    const { action, status, newBudget, message } = req.body;
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    // Only receiver can accept/decline, but either can counter offer or cancel
    if (msg.sender.toString() !== req.userId && msg.receiver.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let parsed;
    try {
      parsed = JSON.parse(msg.content);
      if (!parsed.isProposal) throw new Error("Not a proposal");
    } catch(e) {
      return res.status(400).json({ error: "Message is not a proposal" });
    }

    const partnerId = msg.sender.toString() === req.userId ? msg.receiver.toString() : msg.sender.toString();
    
    // Initialize original budget and negotiation history if they don't exist
    if (!parsed.originalBudget) parsed.originalBudget = parsed.budget;
    if (!parsed.negotiationHistory) parsed.negotiationHistory = [];

    let timelineMessage = "";

    if (action === "counterOffer") {
      parsed.status = "Counter Offered";
      parsed.budget = newBudget;
      parsed.negotiationHistory.push({
        sender: req.userId,
        budget: newBudget,
        message: message,
        timestamp: new Date().toISOString()
      });
      timelineMessage = `Counter Offer Sent: ${parsed.currency === 'INR' ? '₹' : (parsed.currency === 'USD' ? '$' : '€')}${newBudget}`;
      if (message) timelineMessage += ` - "${message}"`;
    } else if (action === "accept") {
      parsed.status = "Accepted";
      parsed.acceptedAt = new Date().toISOString();
      timelineMessage = `Proposal Accepted`;
    } else if (action === "decline") {
      parsed.status = "Declined";
      parsed.declinedAt = new Date().toISOString();
      if (message) parsed.declineReason = message;
      timelineMessage = `Proposal Declined`;
    } else if (status) {
      parsed.status = status;
      timelineMessage = `Proposal Status Updated: ${status}`;
    }

    msg.content = JSON.stringify(parsed);
    await msg.save();
    
    // Generate an automatic system message in the chat timeline
    let autoMsg = null;
    if (timelineMessage) {
      autoMsg = new Message({
        sender: req.userId,
        receiver: partnerId,
        content: `[System] ${timelineMessage}`,
      });
      await autoMsg.save();
    }
    
    // Emit real-time events
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${partnerId}`).emit("proposal_updated", msg);
      io.to(`user:${req.userId}`).emit("proposal_updated", msg);
      
      if (autoMsg) {
        io.to(`user:${partnerId}`).emit("message", autoMsg);
        io.to(`user:${req.userId}`).emit("message", autoMsg);
      }
    }
    
    // Generate notification
    try {
       const { Notification } = await import("../models/Notification.js");
       await Notification.create({
         user: partnerId,
         type: 'PROPOSAL_UPDATE',
         title: 'Proposal Update',
         message: timelineMessage,
         link: '/chat'
       });
    } catch (e) {
       console.error("Failed to create notification", e);
    }

    res.json({ ok: true, status: parsed.status, autoMsg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update proposal" });
  }
});
