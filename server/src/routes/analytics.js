import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { authMiddleware } from "../middleware/auth.js";

export const analyticsRouter = Router();

// GET /api/analytics/profile - Get analytics for current user
analyticsRouter.get("/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 1. Basic Stats
    const totalFollowers = user.followers?.length || 0;
    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });
    const totalPosts = posts.length;
    
    let totalLikes = 0;
    let totalComments = 0;
    let totalViews = 0;
    
    posts.forEach(p => {
      totalLikes += p.likes?.length || 0;
      totalComments += p.comments?.length || 0;
      totalViews += p.views || 0;
    });

    // 2. Engagement Rate (Total Engagements / Total Views or Followers)
    const totalEngagement = totalLikes + totalComments;
    const engagementRate = totalViews > 0 
      ? ((totalEngagement / totalViews) * 100).toFixed(2) 
      : 0;

    // 3. Post Performance (Top 5)
    const topPosts = [...posts]
      .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      .slice(0, 5);

    // 4. Growth Data (Mocked over last 7 days for the chart, as we don't have historical snapshots)
    // In a real production app, we'd have a separate collection for historical snapshots
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        followers: Math.max(0, totalFollowers - (6 - i) * Math.floor(Math.random() * 5)),
        engagement: Math.max(0, Math.floor(totalEngagement / 7) + Math.floor(Math.random() * 10))
      };
    });

    res.json({
      overview: {
        followers: totalFollowers,
        posts: totalPosts,
        likes: totalLikes,
        comments: totalComments,
        profileViews: user.profileViews || 0,
        postViews: totalViews,
        engagementRate: `${engagementRate}%`
      },
      topPosts,
      charts: {
        growth: last7Days
      }
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// POST /api/analytics/view/profile/:userId - Increment profile views
analyticsRouter.post("/view/profile/:userId", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { $inc: { profileViews: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track view" });
  }
});

// POST /api/analytics/view/post/:postId - Increment post views
analyticsRouter.post("/view/post/:postId", async (req, res) => {
  try {
    await Post.findByIdAndUpdate(req.params.postId, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track view" });
  }
});
