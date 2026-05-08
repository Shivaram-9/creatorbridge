import { Router } from "express";
import { VerificationRequest } from "../models/VerificationRequest.js";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { profileUpload } from "../middleware/upload.js";

export const verificationRouter = Router();

verificationRouter.use(authMiddleware);

// Apply for verification
verificationRouter.post("/apply", profileUpload.single("idProof"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "ID Proof is required" });
    
    const existing = await VerificationRequest.findOne({ user: req.userId, status: "pending" });
    if (existing) return res.status(400).json({ error: "A request is already pending" });

    const request = await VerificationRequest.create({
      user: req.userId,
      idProof: `/uploads/avatars/${req.file.filename}`, // Reusing avatar upload logic for now
      socialLinks: JSON.parse(req.body.socialLinks || "{}"),
      category: req.body.category,
      brandProof: req.body.brandProof,
    });

    res.json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to submit request" });
  }
});

// Get status
verificationRouter.get("/status", async (req, res) => {
  try {
    const request = await VerificationRequest.findOne({ user: req.userId }).sort({ createdAt: -1 });
    res.json(request || { status: "none" });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch status" });
  }
});
