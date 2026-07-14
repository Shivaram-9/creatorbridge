import { User } from "../models/User.js";

export const roleMiddleware = (roles) => async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ error: `Access denied. ${roles.join(" or ")} role required.` });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: "Server error during role verification." });
  }
};

export const brandOnly = roleMiddleware(["brand"]);
export const influencerOnly = roleMiddleware(["influencer", "creator", "admin"]);
export const adminOnly = roleMiddleware(["admin"]);
export const brandOrInfluencer = roleMiddleware(["brand", "influencer", "creator"]);
