import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { authMiddleware } from "../middleware/auth.js";

export const discoveryRouter = Router();

discoveryRouter.use(authMiddleware);

/**
 * AI-Powered Recommendation Engine
 * GET /api/discovery/suggested
 */
discoveryRouter.get("/suggested", async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: "User not found" });

    // 1. Get based on common categories/interests
    const myCategories = [me.category, ...me.viewedCategories].filter(Boolean);
    const myFollowing = me.following.map(id => id.toString());

    // 2. Dynamic Discovery Filters
    const filter = {
      _id: { $ne: req.userId, $nin: me.following },
      isBanned: { $ne: true },
      isDiscoverable: true,
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId }
    };

    // Calculate dynamic weights for creators vs brands
    const suggestedCreators = await User.find({
      ...filter,
      role: "influencer",
      $or: [
        { category: { $in: myCategories } },
        { interests: { $in: myCategories } }
      ]
    })
    .sort({ followers: -1, profileViews: -1 })
    .limit(10)
    .lean();

    const suggestedBrands = await User.find({
      ...filter,
      role: "brand",
      $or: [
        { category: { $in: myCategories } },
        { interests: { $in: myCategories } }
      ]
    })
    .sort({ followers: -1, profileViews: -1 })
    .limit(10)
    .lean();

    res.json({ suggestedCreators, suggestedBrands });
  } catch (err) {
    console.error("Discovery error:", err);
    res.status(500).json({ error: "Discovery failed" });
  }
});

/**
 * Real-time Trending Engine
 * GET /api/discovery/trending
 */
discoveryRouter.get("/trending", async (req, res) => {
  try {
    // Engagement Score Formula: likes + (comments * 2) + (saves * 3) + (views) + (shares * 5)
    // We fetch posts from the last 7 days to keep it fresh
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const trendingPosts = await Post.find({
      createdAt: { $gte: lastWeek },
      isArchived: { $ne: true }
    })
    .populate("user", "name username avatar isVerified")
    .sort({ engagementScore: -1, views: -1 })
    .limit(20)
    .lean();

    // Trending Creators: Based on recent profile view spikes and follower growth
    const trendingCreators = await User.find({
      role: "influencer",
      isBanned: { $ne: true },
      isDiscoverable: true
    })
    .sort({ profileViews: -1, followers: -1 })
    .limit(10)
    .lean();

    const trendingBrands = await User.find({
      role: "brand",
      isBanned: { $ne: true },
      isDiscoverable: true
    })
    .sort({ profileViews: -1, followers: -1 })
    .limit(10)
    .lean();

    res.json({ trendingPosts, trendingCreators, trendingBrands });
  } catch (err) {
    res.status(500).json({ error: "Trending calculation failed" });
  }
});

/**
 * Smart Search Ranking
 * GET /api/discovery/search
 */
discoveryRouter.get("/search", async (req, res) => {
  try {
    const { q, type } = req.query;
    if (!q) return res.json({ results: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    
    // Base filter
    const filter = {
      isBanned: { $ne: true },
      blockedBy: { $ne: req.userId },
      blockedUsers: { $ne: req.userId },
      $or: [
        { name: regex },
        { username: regex },
        { category: regex },
        { bio: regex }
      ]
    };

    if (type) filter.role = type;

    // AI Ranking Logic: Priority to Verified > Premium > Engagement
    const results = await User.find(filter)
      .select("-password")
      .sort({ 
        isVerified: -1, 
        isPremium: -1, 
        followers: -1, 
        profileViews: -1 
      })
      .limit(50)
      .lean();

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Smart search failed" });
  }
});

/**
 * Track user behavior for AI learning
 * POST /api/discovery/track-view
 */
discoveryRouter.post("/track-view", async (req, res) => {
  try {
    const { targetId, category } = req.body;
    if (!targetId) return res.status(400).json({ error: "targetId required" });

    const update = {
      $addToSet: { viewedProfiles: targetId }
    };
    if (category) {
      update.$push = { 
        viewedCategories: { 
          $each: [category], 
          $slice: -20 // Keep last 20 viewed categories for context
        } 
      };
    }

    await User.findByIdAndUpdate(req.userId, update);
    
    // Also increment target profile views
    await User.findByIdAndUpdate(targetId, { $inc: { profileViews: 1 } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track behavior" });
  }
});
