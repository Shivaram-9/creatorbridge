import mongoose from "mongoose";
import { Router } from "express";
import { Connection } from "../models/Connection.js";
import { Message } from "../models/Message.js";
import { authMiddleware } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

/**
 * GET /notifications
 * Returns a unified list of:
 *   - Incoming pending connection requests  (type: "connection_request")
 *   - Incoming messages from each sender    (type: "message", one per sender — the latest)
 * Sorted newest first. Max 50 items.
 */
notificationsRouter.get("/", async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);

    /* ── 1. Pending connection requests ── */
    const connReqs = await Connection.find({ to: uid, status: "pending" })
      .populate("from", "name email avatar username role")
      .sort({ createdAt: -1 })
      .lean();

    const connNotifs = connReqs.map((c) => ({
      id: c._id.toString(),
      type: "connection_request",
      actor: c.from,
      connectionId: c._id,
      createdAt: c.createdAt,
      read: false,
    }));

    /* ── 2. Latest message from each conversation partner ── */
    /* Aggregate: for each sender→me, get the most recent message */
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
      { $limit: 30 },
    ]);

    /* Populate sender details */
    await Message.populate(msgGroups, {
      path: "sender",
      select: "name email avatar username role",
    });

    const msgNotifs = msgGroups.map((m) => ({
      id: `msg_${m._id}`,
      type: "message",
      actor: m.sender,
      preview: m.content.slice(0, 120),
      messageId: m._id,
      senderId: m.sender?._id || m.sender,
      createdAt: m.createdAt,
      read: false,
    }));

    /* ── 3. Merge and sort ── */
    const all = [...connNotifs, ...msgNotifs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json(all.slice(0, 50));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load notifications" });
  }
});
