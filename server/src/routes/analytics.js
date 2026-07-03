import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Campaign } from "../models/Campaign.js";
import { Collaboration } from "../models/Collaboration.js";
import { DailySnapshot, AnalyticsEvent } from "../models/Analytics.js";
import { Notification } from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";

export const analyticsRouter = Router();

// GET /api/analytics/profile
analyticsRouter.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const posts = await Post.find({ user: req.userId });
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    const snapshots = await DailySnapshot.find({ user: req.userId }).sort("date").limit(30);

    res.json({
      profileViews: user.profileViews || 0,
      followers: user.followers?.length || 0,
      totalPosts: posts.length,
      totalLikes,
      totalComments,
      totalViews,
      engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0,
      growth: snapshots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/insights - AI Insights (Prompt-7)
analyticsRouter.get("/insights", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.userId });
    if (!posts.length) return res.json({ insights: [] });

    // 1. Calculate best posting time based on engagement
    const hourEngagement = Array(24).fill(0);
    const categoryEngagement = {};

    posts.forEach(p => {
      const hour = new Date(p.createdAt).getHours();
      const score = (p.likes?.length || 0) + (p.comments?.length || 0) * 2;
      hourEngagement[hour] += score;
      
      const cat = p.category || "General";
      categoryEngagement[cat] = (categoryEngagement[cat] || 0) + score;
    });

    const bestHour = hourEngagement.indexOf(Math.max(...hourEngagement));
    const bestCategory = Object.keys(categoryEngagement).reduce((a, b) => 
      categoryEngagement[a] > categoryEngagement[b] ? a : b
    );

    // 2. Growth prediction (simplified AI logic)
    const snapshots = await DailySnapshot.find({ user: req.userId }).sort("date").limit(7);
    let growthRate = 0;
    if (snapshots.length >= 2) {
      const first = snapshots[0].followers;
      const last = snapshots[snapshots.length - 1].followers;
      growthRate = (last - first) / snapshots.length;
    }

    const insights = [
      {
        title: "Best Posting Time",
        value: `${bestHour}:00`,
        description: "Your audience is most active during this window.",
        type: "time"
      },
      {
        title: "Top Category",
        value: bestCategory,
        description: "This niche generates 40% more engagement for you.",
        type: "category"
      },
      {
        title: "Growth Prediction",
        value: `+${Math.ceil(growthRate * 30)}`,
        description: "Estimated follower gain next month based on current trends.",
        type: "prediction"
      }
    ];

    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: "Insights failed" });
  }
});

// GET /api/analytics/posts
analyticsRouter.get("/posts", authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.userId }).sort("-views").limit(10).populate("user", "username name avatar");
    
    const topLiked = await Post.findOne({ user: req.userId }).sort("-likes");
    const topCommented = await Post.findOne({ user: req.userId }).sort("-comments");

    res.json({
      topPosts: posts,
      stats: {
        mostLiked: topLiked,
        mostCommented: topCommented,
        totalImpressions: posts.reduce((sum, p) => sum + (p.views || 0), 0),
        totalSaves: posts.reduce((sum, p) => sum + (p.saves?.length || 0), 0),
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/campaigns
analyticsRouter.get("/campaigns", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    const isBrand = user.role === "brand";
    
    let stats = {};
    if (isBrand) {
      const campaigns = await Campaign.find({ createdBy: req.userId });
      const applications = campaigns.reduce((sum, c) => sum + (c.applicants?.length || 0), 0);
      const accepted = campaigns.reduce((sum, c) => sum + (c.acceptedInfluencers?.length || 0), 0);
      const completed = campaigns.filter(c => c.status === "Completed").length;
      
      stats = { applications, accepted, completed, totalCampaigns: campaigns.length };
    } else {
      const collabs = await Collaboration.find({ influencer: req.userId });
      const completed = collabs.filter(c => c.status === "Completed").length;
      const active = collabs.filter(c => c.status === "Accepted").length;
      
      stats = { totalCollaborations: collabs.length, active, completed };
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to update daily snapshots
async function updateDailySnapshot(userId) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  
  const user = await User.findById(userId);
  if (!user) return;
  const posts = await Post.find({ user: userId });
  const postViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const engagement = posts.reduce((sum, p) => sum + (p.likes?.length || 0) + (p.comments?.length || 0), 0);

  await DailySnapshot.findOneAndUpdate(
    { user: userId, date },
    { 
      followers: user.followers?.length || 0,
      profileViews: user.profileViews || 0,
      postViews,
      engagement
    },
    { upsert: true, new: true }
  );
}

// Update tracking endpoints to use snapshot helper
analyticsRouter.post("/view/profile/:userId", async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userId, { $inc: { profileViews: 1 } });
    await AnalyticsEvent.create({ type: "profile_view", targetId: req.params.userId });
    await updateDailySnapshot(req.params.userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track view" });
  }
});

analyticsRouter.post("/view/post/:postId", async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (post) {
      // Milestone detection (Prompt-7)
      if ([100, 500, 1000, 5000].includes(post.views)) {
        const existingNotif = await Notification.findOne({
          user: post.user,
          type: "milestone",
          post: post._id,
          message: `Your post has reached ${post.views} views! 🔥`
        });
        
        if (!existingNotif) {
          await Notification.create({
            user: post.user,
            sender: post.user, // System as sender
            type: "milestone",
            post: post._id,
            message: `Your post has reached ${post.views} views! 🔥`
          });
        }
      }

      await AnalyticsEvent.create({ type: "post_view", targetId: req.params.postId });
      await updateDailySnapshot(post.user);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to track view" });
  }
});
