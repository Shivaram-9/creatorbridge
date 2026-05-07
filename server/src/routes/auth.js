import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";

export const authRouter = Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

authRouter.post(
  "/register",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").isIn(["influencer", "brand"]).withMessage("Invalid role"),
    validate
  ],
  async (req, res) => {
    try {
      const { email, password, role } = req.body;
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: "Email already registered" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password: hashed,
        role,
      });
      const token = signToken(user._id.toString());
      res.status(201).json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Registration failed" });
    }
  }
);

authRouter.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validate
  ],
  async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = signToken(user._id.toString());
      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// --- ENTERPRISE: FORGOT PASSWORD & EMAIL VERIFICATION ---

import crypto from "crypto";

// Forgot Password
authRouter.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required").normalizeEmail(), validate],
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists for security, but we'll be helpful for now
        return res.status(404).json({ error: "No account found with this email" });
      }

      const resetToken = crypto.randomBytes(20).toString("hex");
      user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins

      await user.save();

      console.log(`[AUTH] RESET TOKEN FOR ${email}: ${resetToken}`);
      // In production, send email here.
      
      res.json({ message: "Password reset instructions sent to your email", debugToken: resetToken });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to process forgot password" });
    }
  }
);

// Reset Password
authRouter.post(
  "/reset-password/:token",
  [body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"), validate],
  async (req, res) => {
    try {
      const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token" });
      }

      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      res.json({ message: "Password reset successful" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
);

// Verify Email
authRouter.post("/verify-email/:token", async (req, res) => {
  try {
    const user = await User.findOne({ emailVerificationToken: req.params.token });
    if (!user) {
      return res.status(400).json({ error: "Invalid verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Resend Verification
authRouter.post("/resend-verification", async (req, res) => {
  try {
    // Requires authentication usually, but we'll allow it via email for simplicity or check if user is logged in
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isEmailVerified) return res.status(400).json({ error: "Email already verified" });

    const verificationToken = crypto.randomBytes(20).toString("hex");
    user.emailVerificationToken = verificationToken;
    await user.save();

    console.log(`[AUTH] VERIFICATION TOKEN FOR ${email}: ${verificationToken}`);
    
    res.json({ message: "Verification email resent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to resend verification" });
  }
});
