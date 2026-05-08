import { Router } from "express";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { SecurityAlert } from "../models/SecurityAlert.js";
import { authMiddleware } from "../middleware/auth.js";

export const securityRouter = Router();

securityRouter.use(authMiddleware);

// GET /api/security/sessions
securityRouter.get("/sessions", async (req, res) => {
  try {
    const sessions = await Session.find({ user: req.userId, isRevoked: false }).sort("-lastUsed");
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load sessions" });
  }
});

// DELETE /api/security/sessions/:sessionId
securityRouter.delete("/sessions/:sessionId", async (req, res) => {
  try {
    await Session.findOneAndUpdate({ _id: req.params.sessionId, user: req.userId }, { isRevoked: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to revoke session" });
  }
});

// DELETE /api/security/sessions - Logout from all other devices
securityRouter.delete("/sessions", async (req, res) => {
  try {
    const currentToken = req.headers.authorization?.split(" ")[1];
    await Session.updateMany({ user: req.userId, token: { $ne: currentToken } }, { isRevoked: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to logout from other devices" });
  }
});

// GET /api/security/alerts
securityRouter.get("/alerts", async (req, res) => {
  try {
    const alerts = await SecurityAlert.find({ user: req.userId }).sort("-createdAt").limit(20);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: "Failed to load alerts" });
  }
});

// POST /api/security/alerts/read
securityRouter.post("/alerts/read", async (req, res) => {
  try {
    await SecurityAlert.updateMany({ user: req.userId }, { isRead: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark alerts as read" });
  }
});
