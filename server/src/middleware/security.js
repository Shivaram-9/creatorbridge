import rateLimit from "express-rate-limit";

// Protection against brute-force attacks on auth
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, 
  message: { error: "Too many attempts. Please try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API protection - skip for authenticated users (they have JWT token)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  skip: (req) => req.method === "OPTIONS" || !!req.headers.authorization, // Skip if user is logged in
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Content creation protection (posts, stories, messages)
export const contentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 500,
  skip: (req) => req.method === "OPTIONS" || !!req.headers.authorization, // Skip if user is logged in
  message: { error: "Slow down! You're creating content too quickly." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper to sanitize search strings for MongoDB/Regex
export const sanitizeSearch = (str) => {
  if (typeof str !== "string") return "";
  // Escape special regex characters to prevent ReDoS or malformed queries
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
