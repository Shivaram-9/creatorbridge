import mongoose from "mongoose";
import { Router } from "express";
import { Message } from "../models/Message.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

/**
 * GET /notifications
 * Returns a list of incoming messages (latest per sender).
 */
notificationsRouter.get("/", async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);

    /* ── Latest message from each conversation partner ── */
    const msgGroups = await Message.aggregate([
      { $match: { receiver: uid } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$sender",
          latestMsg: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$latestMsg" } },
      { $sort: { createdAt: -1 } },
      { $limit: 50 },
    ]);

    await Message.populate(msgGroups, {
      path: "sender",
      select: "name email avatar username role",
    });

    const msgNotifs = msgGroups.map((m) => ({
      id: `msg_${m._id}`,
      type: "message",
      actor: m.sender,
      preview: m.content ? m.content.slice(0, 120) : "Media",
      messageId: m._id,
      senderId: m.sender?._id || m.sender,
      createdAt: m.createdAt,
      read: false,
    }));

    res.json(msgNotifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});
