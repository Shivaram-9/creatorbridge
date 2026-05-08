import jwt from "jsonwebtoken";
import { Session } from "../models/Session.js";

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;

    // Session validation (Prompt-6)
    const session = await Session.findOne({ token, isRevoked: false });
    if (!session) {
      return res.status(401).json({ error: "Session expired or revoked" });
    }

    // Update last used
    session.lastUsed = new Date();
    session.save().catch(() => {}); // Background update

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
