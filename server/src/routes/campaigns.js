import express from "express";
import { Campaign } from "../models/Campaign.js";
import { Collaboration } from "../models/Collaboration.js";
import { Notification } from "../models/Notification.js";
import { authMiddleware } from "../middleware/auth.js";
import { brandOnly, influencerOnly } from "../middleware/role.js";

const router = express.Router();

// Create Campaign (Brand Only)
router.post("/create", authMiddleware, brandOnly, async (req, res) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      createdBy: req.userId,
    });
    res.status(201).json(campaign);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all Campaigns
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("createdBy", "name avatar role").sort("-createdAt");
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Campaign
router.get("/:id", async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("createdBy", "name avatar role")
      .populate("applicants", "name avatar role")
      .populate("invitedInfluencers", "name avatar role")
      .populate("acceptedInfluencers", "name avatar role");
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Campaign
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.userId && req.userRole !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await campaign.deleteOne();
    res.json({ message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply to Campaign (Influencer Only)
router.post("/apply/:id", authMiddleware, influencerOnly, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.applicants.includes(req.userId)) {
      return res.status(400).json({ error: "Already applied" });
    }
    campaign.applicants.push(req.userId);
    await campaign.save();

    // Create Notification for Brand
    const notif = await Notification.create({
      user: campaign.createdBy,
      sender: req.userId,
      type: "campaign_apply",
      message: `An influencer has applied to your campaign: ${campaign.title}`,
    });
    
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${campaign.createdBy}`).emit("notification", notif);
    }

    res.json({ message: "Application submitted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Invite Influencer (Brand Only)
router.post("/invite/:campaignId/:userId", authMiddleware, brandOnly, async (req, res) => {
  try {
    const { campaignId, userId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });
    if (campaign.createdBy.toString() !== req.userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (campaign.invitedInfluencers.includes(userId)) {
      return res.status(400).json({ error: "Already invited" });
    }
    campaign.invitedInfluencers.push(userId);
    await campaign.save();

    // Create Notification for Influencer
    const notif = await Notification.create({
      user: userId,
      sender: req.userId,
      type: "campaign_invite",
      message: `You've been invited to join the campaign: ${campaign.title}`,
    });
    
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${userId}`).emit("notification", notif);
    }

    res.json({ message: "Invitation sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Respond to Invite/Application (Accept/Reject)
router.post("/respond/:campaignId", authMiddleware, async (req, res) => {
  try {
    const { status, userId } = req.body; // status: "Accepted" or "Rejected"
    const campaign = await Campaign.findById(req.params.campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found" });

    // If Brand responding to Application
    if (campaign.createdBy.toString() === req.userId) {
      if (status === "Accepted") {
        campaign.acceptedInfluencers.push(userId);
        // Create Collaboration
        await Collaboration.create({
          brand: req.userId,
          influencer: userId,
          campaign: campaign._id,
        });
        
        const notif = await Notification.create({
          user: userId,
          sender: req.userId,
          type: "collab_status",
          message: `Your application for "${campaign.title}" was accepted!`,
        });
        
        const io = req.app.get("io");
        if (io) {
          io.to(`user:${userId}`).emit("notification", notif);
        }
      }
    } 
    // If Influencer responding to Invite
    else if (campaign.invitedInfluencers.includes(req.userId)) {
        if (status === "Accepted") {
            campaign.acceptedInfluencers.push(req.userId);
            // Create Collaboration
            await Collaboration.create({
              brand: campaign.createdBy,
              influencer: req.userId,
              campaign: campaign._id,
            });
            
            const notif = await Notification.create({
              user: campaign.createdBy,
              sender: req.userId,
              type: "collab_status",
              message: `Influencer accepted your invite for "${campaign.title}"!`,
            });
            
            const io = req.app.get("io");
            if (io) {
              io.to(`user:${campaign.createdBy}`).emit("notification", notif);
            }
          }
    } else {
        return res.status(403).json({ error: "Unauthorized" });
    }

    await campaign.save();
    res.json({ message: `Response recorded: ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as campaignsRouter };
