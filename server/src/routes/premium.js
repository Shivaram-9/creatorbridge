import { Router } from "express";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { authMiddleware } from "../middleware/auth.js";
import Razorpay from "razorpay";
import crypto from "crypto";

export const premiumRouter = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

premiumRouter.use(authMiddleware);

// GET /api/premium/stats
premiumRouter.get("/stats", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({
      isPremium: user.isPremium,
      premiumTier: user.premiumTier,
      premiumExpiry: user.premiumExpiry,
      earnings: user.earnings,
      walletBalance: user.walletBalance,
      pendingEarnings: user.pendingEarnings,
      subscriptionStatus: user.subscriptionStatus
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load premium stats" });
  }
});

// POST /api/premium/create-order
premiumRouter.post("/create-order", async (req, res) => {
  try {
    const { tier } = req.body;
    const amounts = {
      silver: 499,
      gold: 999,
      platinum: 1999
    };
    const amount = amounts[tier] || 499;

    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: `receipt_sub_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Order Error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

// POST /api/premium/verify-payment
premiumRouter.post("/verify-payment", async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      tier 
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const user = await User.findById(req.userId);
      user.isPremium = true;
      user.premiumTier = tier;
      user.subscriptionStatus = "active";
      
      // 30 days subscription
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      user.premiumExpiry = expiry;
      
      // Auto-activate badge if platinum
      if (tier === "platinum") {
        user.isVerified = true;
      }
      
      await user.save();

      const amounts = { silver: 499, gold: 999, platinum: 1999 };
      await Transaction.create({
        user: req.userId,
        type: "subscription",
        amount: amounts[tier],
        status: "completed",
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        description: `${tier.toUpperCase()} Subscription Activation`,
        invoiceUrl: `/api/premium/invoice/${razorpay_payment_id}`
      });

      res.json({ ok: true, user });
    } else {
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Payment Verification Error:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});
// POST /api/premium/create-verification-order
premiumRouter.post("/create-verification-order", async (req, res) => {
  try {
    const options = {
      amount: 299 * 100, // ₹299 in paise
      currency: "INR",
      receipt: `receipt_verify_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("Razorpay Verification Order Error:", err);
    res.status(500).json({ error: "Failed to create verification payment order" });
  }
});

// POST /api/premium/confirm-verification
premiumRouter.post("/confirm-verification", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      const user = await User.findById(req.userId);
      user.isVerified = true;
      await user.save();

      await Transaction.create({
        user: req.userId,
        type: "subscription",
        amount: 299,
        status: "completed",
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        description: "Professional Verification (Lifetime Access)",
        invoiceUrl: `/api/premium/invoice/${razorpay_payment_id}`
      });

      res.json({ ok: true, user });
    } else {
      res.status(400).json({ error: "Invalid payment signature" });
    }
  } catch (err) {
    console.error("Verification Payment Error:", err);
    res.status(500).json({ error: "Verification payment failed" });
  }
});

// POST /api/premium/withdraw
premiumRouter.post("/withdraw", async (req, res) => {
  try {
    const { amount, payoutMethod, payoutDetails } = req.body;
    const user = await User.findById(req.userId);

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    if (amount < 500) {
      return res.status(400).json({ error: "Minimum withdrawal is ₹500" });
    }

    const withdrawal = await Withdrawal.create({
      user: req.userId,
      amount,
      payoutMethod,
      payoutDetails,
      status: "pending"
    });

    // Deduct from wallet immediately and move to pending? 
    // Or just mark as pending and deduct when completed.
    // Standard is to deduct and hold.
    user.walletBalance -= amount;
    await user.save();

    await Transaction.create({
      user: req.userId,
      type: "withdrawal",
      amount,
      status: "pending",
      description: `Withdrawal request #${withdrawal._id}`,
      transactionId: `WD-${Date.now()}`
    });

    res.json({ ok: true, withdrawal });
  } catch (err) {
    res.status(500).json({ error: "Withdrawal request failed" });
  }
});

// GET /api/premium/transactions
premiumRouter.get("/transactions", async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

// GET /api/premium/invoice/:id
premiumRouter.get("/invoice/:id", async (req, res) => {
  // Simplistic invoice generator or just return metadata
  try {
    const tx = await Transaction.findOne({ transactionId: req.params.id, user: req.userId });
    if (!tx) return res.status(404).send("Invoice not found");
    
    // In a real app, generate PDF here. For now, return HTML/JSON.
    res.send(`
      <div style="font-family: sans-serif; padding: 40px; border: 1px solid #eee; max-width: 800px; margin: auto;">
        <h1>Pactogram Invoice</h1>
        <p>Transaction ID: ${tx.transactionId}</p>
        <p>Date: ${tx.createdAt.toLocaleDateString()}</p>
        <hr/>
        <h3>Description: ${tx.description}</h3>
        <h2>Amount: ₹${tx.amount}</h2>
        <p>Status: ${tx.status.toUpperCase()}</p>
      </div>
    `);
  } catch (err) {
    res.status(500).send("Error generating invoice");
  }
});

