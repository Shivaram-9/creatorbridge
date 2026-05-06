import { User } from "../models/User.js";

export const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin rights required." });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error during admin verification." });
  }
};
