import { Router } from "express";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Report } from "../models/Report.js";
import { Transaction } from "../models/Transaction.js";
import { Withdrawal } from "../models/Withdrawal.js";
import { Deal } from "../models/Deal.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

export const adminRouter = Router();

// Publicly accessible but authenticated route to SUBMIT a report
adminRouter.post("/reports", authMiddleware, async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;
    if (!reason || !targetType || !targetId) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const report = await Report.create({
      reporter: req.userId,
      targetType,
      targetId,
      reason,
      description
    });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// --- ADMIN ONLY ROUTES ---
adminRouter.use(authMiddleware, adminMiddleware);

// GET /api/admin/stats - Comprehensive Analytics
adminRouter.get("/stats", async (req, res) => {
  try {
    const [
      userCount, 
      postCount, 
      pendingReports, 
      totalReports,
      premiumUsers,
      totalRevenue,
      pendingWithdrawals,
      dealCount
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments(),
      User.countDocuments({ isPremium: true }),
      Transaction.aggregate([
        { $match: { type: "subscription", status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Withdrawal.countDocuments({ status: "pending" }),
      Deal.countDocuments()
    ]);
    
    const influencerCount = await User.countDocuments({ role: "influencer" });
    const brandCount = await User.countDocuments({ role: "brand" });

    res.json({ 
      userCount, 
      postCount, 
      pendingReports, 
      totalReports,
      influencerCount,
      brandCount,
      premiumUsers,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingWithdrawals,
      dealCount
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET /api/admin/withdrawals - Payout management
adminRouter.get("/withdrawals", async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find()
      .populate("user", "name email username avatar walletBalance")
      .sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// PATCH /api/admin/withdrawals/:id - Approve/Reject Payout
adminRouter.patch("/withdrawals/:id", async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) return res.status(404).json({ error: "Withdrawal not found" });

    if (status === "completed") {
      // In a real app, trigger Razorpay Payout API here
      withdrawal.status = "completed";
      
      await Transaction.findOneAndUpdate(
        { description: `Withdrawal request #${withdrawal._id}` },
        { status: "completed" }
      );
    } else if (status === "rejected") {
      withdrawal.status = "rejected";
      // Refund wallet balance
      const user = await User.findById(withdrawal.user);
      user.walletBalance += withdrawal.amount;
      await user.save();
      
      await Transaction.findOneAndUpdate(
        { description: `Withdrawal request #${withdrawal._id}` },
        { status: "failed" }
      );
    }
    
    withdrawal.adminNotes = adminNotes;
    await withdrawal.save();
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ error: "Failed to update withdrawal" });
  }
});

// GET /api/admin/verifications - Pending verification requests
adminRouter.get("/verifications", async (req, res) => {
  try {
    // Assuming users "request" verification by some flag or we just show unverified creators
    const users = await User.find({ role: "influencer", isVerified: false })
      .sort({ followers: -1 })
      .limit(50);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch verifications" });
  }
});

// PATCH /api/admin/verify/:id - Approve verification
adminRouter.patch("/verify/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to verify user" });
  }
});

// GET /api/admin/users - User management
adminRouter.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(200);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH /api/admin/ban/:id - Toggle ban
adminRouter.patch("/ban/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBanned = !user.isBanned;
    await user.save();
    res.json({ isBanned: user.isBanned });
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle ban status" });
  }
});

// GET /api/admin/reports - Fetch all reports with targets
adminRouter.get("/reports", async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name username avatar")
      .sort({ createdAt: -1 });

    const populatedReports = await Promise.all(reports.map(async (r) => {
      const report = r.toObject();
      if (report.targetType === "user") {
        report.target = await User.findById(report.targetId).select("name username avatar isBanned");
      } else if (report.targetType === "post") {
        report.target = await Post.findById(report.targetId).populate("user", "username name avatar");
      }
      return report;
    }));

    res.json(populatedReports);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

