import { Router } from "express";
import { Deal } from "../models/Deal.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { Notification } from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";

export const dealsRouter = Router();

dealsRouter.use(authMiddleware);

/**
 * AI Smart Matching: Suggest creators for brands
 */
dealsRouter.get("/match", async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    if (me.role !== "brand") return res.status(403).json({ error: "Only brands can use smart matching" });

    // AI Logic: Suggest based on brand's category and high engagement creators
    const suggestions = await User.find({
      role: "influencer",
      category: me.category,
      isBanned: false,
      isDiscoverable: true
    })
    .sort({ followers: -1, profileViews: -1 })
    .limit(5)
    .lean();

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: "Matching failed" });
  }
});

/**
 * Create a new deal offer (Brand only)
 */
dealsRouter.post("/", async (req, res) => {
  try {
    const { influencerId, title, budget, deadline, goals, requirements, campaignId } = req.body;
    
    // Check if user is brand
    const me = await User.findById(req.userId);
    if (me.role !== "brand") return res.status(403).json({ error: "Only brands can create deals" });

    const deal = await Deal.create({
      title,
      brand: req.userId,
      influencer: influencerId,
      campaign: campaignId,
      budget,
      deadline,
      goals,
      requirements
    });

    // Notify influencer
    await Notification.create({
      user: influencerId,
      sender: req.userId,
      type: "campaign_invite",
      message: `${me.name || me.username} sent you a new collaboration offer: ${title}`
    });

    res.status(201).json(deal);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * Get all deals for current user
 */
dealsRouter.get("/", async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    const filter = me.role === "brand" ? { brand: req.userId } : { influencer: req.userId };
    
    const deals = await Deal.find(filter)
      .populate("brand", "name username avatar")
      .populate("influencer", "name username avatar")
      .populate("campaign", "title")
      .sort("-createdAt");
      
    res.json(deals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get specific deal detail
 */
dealsRouter.get("/:id", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id)
      .populate("brand", "name username avatar role")
      .populate("influencer", "name username avatar role")
      .populate("campaign");
      
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    
    // Check if part of deal
    if (deal.brand._id.toString() !== req.userId && deal.influencer._id.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Negotiate a deal
 */
dealsRouter.patch("/:id/negotiate", async (req, res) => {
  try {
    const { budget, deadline, message } = req.body;
    const deal = await Deal.findById(req.params.id);
    
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    
    // Push to history
    deal.negotiationHistory.push({
      sender: req.userId,
      budget: budget || deal.budget,
      deadline: deadline || deal.deadline,
      message,
      timestamp: new Date()
    });
    
    if (budget) deal.budget = budget;
    if (deadline) deal.deadline = deadline;
    deal.status = "negotiating";
    
    await deal.save();
    
    // Notify other party
    const otherPartyId = deal.brand.toString() === req.userId ? deal.influencer : deal.brand;
    await Notification.create({
      user: otherPartyId,
      sender: req.userId,
      type: "collab_status",
      message: `A new negotiation offer was sent for deal: ${deal.title}`
    });

    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Accept Deal / Sign Agreement
 */
dealsRouter.post("/:id/accept", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    
    if (deal.influencer.toString() !== req.userId) {
      return res.status(403).json({ error: "Only influencers can accept deals" });
    }

    deal.status = "accepted";
    deal.agreement.isAccepted = true;
    deal.agreement.acceptedAt = new Date();
    
    await deal.save();
    
    // Notify Brand
    await Notification.create({
      user: deal.brand,
      sender: req.userId,
      type: "collab_status",
      message: `Influencer accepted the deal and signed the agreement: ${deal.title}`
    });

    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Update Deliverables (Influencer)
 */
dealsRouter.patch("/:id/deliverables/:delivId", async (req, res) => {
  try {
    const { isCompleted, proofUrl } = req.body;
    const deal = await Deal.findById(req.params.id);
    
    const deliv = deal.deliverables.id(req.params.delivId);
    if (!deliv) return res.status(404).json({ error: "Deliverable not found" });
    
    if (isCompleted !== undefined) {
      deliv.isCompleted = isCompleted;
      if (isCompleted) deliv.completedAt = new Date();
    }
    if (proofUrl) deliv.proofUrl = proofUrl;
    
    // Update progress
    const completedCount = deal.deliverables.filter(d => d.isCompleted).length;
    deal.progress = Math.round((completedCount / deal.deliverables.length) * 100);
    
    if (deal.progress === 100) {
        deal.status = "active"; // Or "ready_for_review"
    }

    await deal.save();
    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Complete Deal & Release Payment (Brand)
 */
dealsRouter.post("/:id/complete", async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    
    if (deal.brand.toString() !== req.userId) {
      return res.status(403).json({ error: "Only brands can mark deals as completed" });
    }

    deal.status = "completed";
    await deal.save();
    
    // Release Payment Logic
    // 1. Update Influencer Earnings
    const influencer = await User.findById(deal.influencer);
    influencer.earnings += deal.budget;
    influencer.pendingEarnings -= deal.budget; // Assuming it was pending
    if (influencer.pendingEarnings < 0) influencer.pendingEarnings = 0;
    await influencer.save();
    
    // 2. Create Transaction
    await Transaction.create({
      user: deal.influencer,
      type: "earning",
      amount: deal.budget,
      status: "completed",
      description: `Earnings from deal: ${deal.title}`,
      deal: deal._id
    });

    // Notify Influencer
    await Notification.create({
      user: deal.influencer,
      sender: req.userId,
      type: "collab_status",
      message: `Deal completed! Payment of $${deal.budget} has been added to your earnings.`
    });

    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
