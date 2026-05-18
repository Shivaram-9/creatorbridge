import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";

export const aiRouter = Router();

aiRouter.use(authMiddleware);

const AI_RESPONSES = {
  guidance: [
    "To grow as a creator, focus on a niche and post consistently at least 3 times a week.",
    "Engage with your followers by replying to comments within the first hour of posting.",
    "Collaborate with other creators in your niche to cross-pollinate audiences."
  ],
  captions: [
    "Sparkling with creativity! ✨ #CreatorLife #Auraon",
    "Behind every great post is a lot of coffee and even more passion. ☕️🚀",
    "Turning dreams into content, one day at a time. 🌟 #Pactogram"
  ],
  campaigns: [
    "Based on your profile, you would be a great fit for tech lifestyle brands.",
    "Consider reaching out to sustainable fashion brands as your audience values eco-conscious content.",
    "Your engagement is highest on weekend mornings; try launching your next campaign then."
  ]
};

aiRouter.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    const user = await User.findById(req.userId);

    let response = "";

    const msg = message.toLowerCase();
    if (msg.includes("caption")) {
      response = AI_RESPONSES.captions[Math.floor(Math.random() * AI_RESPONSES.captions.length)];
    } else if (msg.includes("grow") || msg.includes("guidance")) {
      response = AI_RESPONSES.guidance[Math.floor(Math.random() * AI_RESPONSES.guidance.length)];
    } else if (msg.includes("campaign") || msg.includes("brand")) {
      response = AI_RESPONSES.campaigns[Math.floor(Math.random() * AI_RESPONSES.campaigns.length)];
    } else {
      response = `Hello ${user.name}! I am your Pactogram AI assistant. I can help you with captions, growth strategies, and campaign recommendations. What's on your mind?`;
    }

    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: "AI Assistant is currently offline" });
  }
});

aiRouter.get("/insights", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const postCount = await Post.countDocuments({ user: req.userId });
    
    res.json({
      tips: [
        "Your profile bio could be more descriptive. Try adding 2-3 keywords related to your niche.",
        "Your recent posts show high engagement on video content. Consider making more Reels.",
        `You have ${postCount} posts. Reaching 50 posts often triggers a boost in platform discovery.`
      ],
      engagementRate: "4.8%",
      optimizationScore: 82
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch AI insights" });
  }
});
