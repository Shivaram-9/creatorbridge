import mongoose from "mongoose";
import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { authMiddleware } from "../middleware/auth.js";

export const searchRouter = Router();

searchRouter.use(authMiddleware);

/**
 * GET /api/search/users?q=
 * Search for creators and brands
 */
searchRouter.get("/users", async (req, res) => {
  try {
    const { q } = req.query;
    const keyword = typeof q === "string" ? q.trim() : "";
    const regex = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
    
    const query = regex ? {
      $or: [
        { name: regex },
        { username: regex },
        { category: regex },
        { location: regex }
      ]
    } : {};

    const users = await User.find(query)
    .select("name username avatar category followers following role")
    .limit(20)
    .lean();

    res.json(users);
  } catch (err) {
    console.error("User search error:", err);
    res.status(500).json({ error: "User search failed" });
  }
});

/**
 * GET /api/search/posts?q=
 * Search for posts
 */
searchRouter.get("/posts", async (req, res) => {
  try {
    const { q } = req.query;
    const keyword = typeof q === "string" ? q.trim() : "";
    const regex = keyword ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
    
    const query = regex ? {
      $or: [{ text: regex }]
    } : {};

    const posts = await Post.find(query)
    .populate("user", "name username avatar")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

    res.json(posts);
  } catch (err) {
    console.error("Post search error:", err);
    res.status(500).json({ error: "Post search failed" });
  }
});

/**
 * GET /api/search/discover
 * Get suggestions, trending, popular, etc.
 */
searchRouter.get("/discover", async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.userId);

    // 1. Suggested Creators (Random recent ones, excluding self)
    const suggested = await User.find({ _id: { $ne: uid } })
      .select("name username avatar category followers role")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // 2. Trending Users (Most followers using aggregation)
    const trending = await User.aggregate([
      { $match: { _id: { $ne: uid } } },
      { $addFields: { followerCount: { $size: { $ifNull: ["$followers", []] } } } },
      { $sort: { followerCount: -1, createdAt: -1 } },
      { $limit: 6 },
      { $project: { name: 1, username: 1, avatar: 1, category: 1, role: 1, followers: 1 } }
    ]);

    // 3. Popular Posts (Most likes using aggregation)
    const popularPosts = await Post.aggregate([
      { $addFields: { likeCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likeCount: -1, createdAt: -1 } },
      { $limit: 8 },
      { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $project: { text: 1, image: 1, likes: 1, "user.name": 1, "user.username": 1, "user.avatar": 1 } }
    ]);

    // 4. Recently Active (Latest posts creators)
    const recentPosts = await Post.find()
      .select("user")
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    
    const recentUserIds = [...new Set(recentPosts.filter(p => p.user).map(p => p.user.toString()))].slice(0, 8);
    const recentlyActive = await User.find({ _id: { $in: recentUserIds, $ne: uid } })
      .select("name username avatar category role")
      .limit(6)
      .lean();

    res.json({
      suggested,
      trending,
      popularPosts,
      recentlyActive
    });
  } catch (err) {
    console.error("Discover error:", err);
    res.status(500).json({ error: "Failed to load discover data" });
  }
});
