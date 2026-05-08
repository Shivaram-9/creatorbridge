import { Router } from "express";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { authMiddleware } from "../middleware/auth.js";

export const premiumRouter = Router();

premiumRouter.use(authMiddleware);

// GET /api/premium/stats - Get earnings and subscription status
premiumRouter.get("/stats", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      isPremium: user.isPremium,
      premiumTier: user.premiumTier,
      earnings: user.earnings,
      subscriptionStatus: user.subscriptionStatus
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load premium stats" });
  }
});

// GET /api/premium/transactions - Get transaction history
premiumRouter.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

// POST /api/premium/upgrade - Placeholder for payment processing
premiumRouter.post("/upgrade", async (req, res) => {
  try {
    const { tier, transactionId } = req.body;
    
    // In a real app, verify transactionId with Stripe/Razorpay here
    
    const user = await User.findById(req.userId);
    user.isPremium = true;
    user.premiumTier = tier;
    user.subscriptionStatus = "active";
    await user.save();

    await Transaction.create({
      user: req.userId,
      type: "subscription",
      amount: tier === "gold" ? 999 : tier === "platinum" ? 1999 : 499,
      status: "completed",
      transactionId: transactionId || `cb_${Date.now()}`,
      description: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium Subscription`
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to upgrade subscription" });
  }
});

// POST /api/premium/add-earnings - Admin or platform triggered earnings
premiumRouter.post("/add-earnings", async (req, res) => {
  try {
    const { amount, description } = req.body;
    const user = await User.findById(req.userId);
    user.earnings += Number(amount);
    await user.save();

    await Transaction.create({
      user: req.userId,
      type: "bonus",
      amount,
      status: "completed",
      description: description || "Platform Bonus"
    });

    res.json({ earnings: user.earnings });
  } catch (err) {
    res.status(500).json({ error: "Failed to add earnings" });
  }
});
