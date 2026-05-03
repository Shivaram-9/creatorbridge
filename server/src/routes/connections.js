import mongoose from "mongoose";
import { Router } from "express";
import { Connection } from "../models/Connection.js";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

export const connectionsRouter = Router();

connectionsRouter.use(authMiddleware);

connectionsRouter.post("/request", async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId || !mongoose.isValidObjectId(toUserId)) {
      return res.status(400).json({ error: "Valid toUserId is required" });
    }
    if (toUserId === req.userId) {
      return res.status(400).json({ error: "Cannot connect to yourself" });
    }
    const target = await User.findById(toUserId);
    if (!target) return res.status(404).json({ error: "User not found" });

    const existing = await Connection.findOne({
      $or: [
        { from: req.userId, to: toUserId },
        { from: toUserId, to: req.userId },
      ],
    });
    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ error: "Already connected" });
      }
      if (existing.status === "rejected") {
        return res.status(409).json({ error: "A previous request was rejected" });
      }
      return res.status(409).json({ error: "Connection request already exists" });
    }

    const conn = await Connection.create({ from: req.userId, to: toUserId, status: "pending" });
    await conn.populate("from to", "-password");
    res.status(201).json(conn);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Connection request already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Failed to send request" });
  }
});

connectionsRouter.get("/incoming", async (req, res) => {
  try {
    const list = await Connection.find({ to: req.userId, status: "pending" })
      .populate("from", "-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load incoming requests" });
  }
});

connectionsRouter.get("/outgoing", async (req, res) => {
  try {
    const list = await Connection.find({ from: req.userId, status: "pending" })
      .populate("to", "-password")
      .sort({ createdAt: -1 })
      .lean();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load outgoing requests" });
  }
});

connectionsRouter.get("/accepted", async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);
    const rows = await Connection.find({
      status: "accepted",
      $or: [{ from: uid }, { to: uid }],
    })
      .populate("from", "-password")
      .populate("to", "-password")
      .sort({ updatedAt: -1 })
      .lean();

    const partners = rows.map((c) => {
      const other = c.from._id.toString() === req.userId ? c.to : c.from;
      return { connectionId: c._id, user: other };
    });
    res.json(partners);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load connections" });
  }
});

connectionsRouter.patch("/:id/accept", async (req, res) => {
  try {
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ error: "Request not found" });
    if (conn.to.toString() !== req.userId) {
      return res.status(403).json({ error: "Only the recipient can accept" });
    }
    if (conn.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }
    conn.status = "accepted";
    await conn.save();
    await conn.populate("from to", "-password");
    res.json(conn);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to accept" });
  }
});

connectionsRouter.patch("/:id/reject", async (req, res) => {
  try {
    const conn = await Connection.findById(req.params.id);
    if (!conn) return res.status(404).json({ error: "Request not found" });
    if (conn.to.toString() !== req.userId) {
      return res.status(403).json({ error: "Only the recipient can reject" });
    }
    if (conn.status !== "pending") {
      return res.status(400).json({ error: "Request is not pending" });
    }
    conn.status = "rejected";
    await conn.save();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reject" });
  }
});
