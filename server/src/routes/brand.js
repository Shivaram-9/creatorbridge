import { Router } from "express";
import { User } from "../models/User.js";
import { Deal } from "../models/Deal.js";
import { authMiddleware } from "../middleware/auth.js";
import { EmailService } from "../services/EmailService.js";

export const brandRouter = Router();

brandRouter.use(authMiddleware);

// Advanced Targeting Search
brandRouter.get("/targeting", async (req, res) => {
  try {
    const { category, minFollowers, maxFollowers, verifiedOnly, location } = req.query;
    const filter = { role: "influencer", isBanned: false };

    if (category) filter.category = category;
    if (verifiedOnly === "true") filter.isVerified = true;
    if (location) filter.location = new RegExp(location, "i");
    
    // Follower range check (assuming followers is an array of IDs)
    // For large scale, we should have a followersCount field in User model.
    // For now, we'll use the array length in the aggregation if possible, or assume a count field exists.
    
    const influencers = await User.find(filter)
      .select("name username avatar followers category isVerified location bio")
      .lean();

    // Filter by follower count manually if needed (simple implementation)
    let filtered = influencers;
    if (minFollowers) filtered = filtered.filter(u => (u.followers?.length || 0) >= parseInt(minFollowers));
    if (maxFollowers) filtered = filtered.filter(u => (u.followers?.length || 0) <= parseInt(maxFollowers));

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "Targeting failed" });
  }
});

// Shortlist Management (Reusing savedPosts logic or separate field)
// For brands, let's add a 'shortlistedCreators' field to User model.

// Creator Comparison
brandRouter.post("/compare", async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: "IDs array required" });
    
    const creators = await User.find({ _id: { $in: ids } })
      .select("name username avatar followers following category isVerified profileViews portfolio")
      .lean();
      
    res.json(creators);
  } catch (err) {
    res.status(500).json({ error: "Comparison failed" });
  }
});

// Performance Reports (Aggregated stats for brand's campaigns)
brandRouter.get("/reports", async (req, res) => {
  try {
    const deals = await Deal.find({ brand: req.userId, status: "completed" })
      .populate("influencer", "name username avatar");
      
    const totalSpent = deals.reduce((sum, d) => sum + (d.budget || 0), 0);
    const influencerStats = deals.map(d => ({
      influencer: d.influencer,
      deal: d.title,
      budget: d.budget,
      completedAt: d.updatedAt
    }));

    res.json({
      totalCampaigns: deals.length,
      totalSpent,
      influencerStats
    });
  } catch (err) {
    res.status(500).json({ error: "Report generation failed" });
  }
});
