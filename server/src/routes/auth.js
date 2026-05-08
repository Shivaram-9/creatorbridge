import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { sendEmail } from "../utils/email.js";
import crypto from "crypto";

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
      
      const verificationToken = crypto.randomBytes(20).toString("hex");
      const hashedVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");

      const user = await User.create({
        email,
        password: hashed,
        role,
        emailVerificationToken: hashedVerificationToken,
      });

      // Send verification email
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
      await sendEmail({
        to: email,
        subject: "Verify your CreatorBridge account",
        html: `<h1>Welcome to CreatorBridge!</h1>
               <p>Please click the link below to verify your email address:</p>
               <a href="${verifyUrl}" style="padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
               <p>If you did not request this, please ignore this email.</p>`
      }).catch(err => console.error("Initial verification email failed:", err));

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

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await sendEmail({
        to: email,
        subject: "Password Reset Request",
        html: `<h1>Reset Your Password</h1>
               <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
               <a href="${resetUrl}" style="padding: 10px 20px; background: #6366f1; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>`
      });
      
      res.json({ message: "Password reset instructions sent to your email" });
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
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({ emailVerificationToken: hashedToken });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// Send OTP
authRouter.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isEmailVerified) return res.status(400).json({ error: "Email already verified" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = otp;
    await user.save();

    await sendEmail({
      to: email,
      subject: "Your CreatorBridge Verification Code",
      html: `<h1>Verify Your Email</h1>
             <p>Your verification code is: <strong style="font-size: 24px; color: #6366f1;">${otp}</strong></p>
             <p>This code will expire shortly. Do not share it with anyone.</p>`
    });
    
    res.json({ message: "Verification code sent to your email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
authRouter.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.verificationCode !== otp) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({ message: "Email verified successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});
