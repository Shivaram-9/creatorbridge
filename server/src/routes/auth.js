import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { User } from "../models/User.js";
import { Session } from "../models/Session.js";
import { SecurityAlert } from "../models/SecurityAlert.js";
import { EmailService } from "../services/EmailService.js";

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

async function createSession(user, token, req) {
  const ua = req.get("User-Agent") || "";
  const ip = req.ip || req.connection.remoteAddress;
  
  await Session.create({
    user: user._id,
    token,
    device: {
      type: /mobile|android|iphone/i.test(ua) ? "mobile" : "desktop",
      os: /windows/i.test(ua) ? "Windows" : /mac/i.test(ua) ? "MacOS" : /linux/i.test(ua) ? "Linux" : "Unknown",
      browser: /chrome/i.test(ua) ? "Chrome" : /firefox/i.test(ua) ? "Firefox" : /safari/i.test(ua) ? "Safari" : "Unknown",
      ip
    }
  });

  // Security Alert for new login (if multiple sessions exist)
  const sessionCount = await Session.countDocuments({ user: user._id, isRevoked: false });
  if (sessionCount > 1) {
    await SecurityAlert.create({
      user: user._id,
      type: "new_login",
      message: `New login detected from a ${/mobile/i.test(ua) ? "mobile" : "desktop"} device.`,
      metadata: { ip, userAgent: ua }
    });
  }
}

authRouter.post("/register", async (req, res) => {
  // 1. Detailed Logging
  console.log("REGISTER REQUEST BODY:", JSON.stringify(req.body, null, 2));

  const { name, email, password, role = "influencer" } = req.body;

  // 2. Basic Validation Only
  if (!name || !email || !password) {
    console.log("REGISTER FAIL: Missing required fields", { name: !!name, email: !!email, password: !!password });
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  try {
    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`REGISTER FAIL: Email ${email} already exists`);
      return res.status(400).json({ message: "Email already registered" });
    }

    // 3. Password Hashing
    const hashed = await bcrypt.hash(password, 10);
    const hashedVerificationToken = crypto.randomBytes(32).toString("hex");

    // 4. MongoDB User Creation
    console.log("Attempting to create user in MongoDB...");
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: ["influencer", "brand", "admin"].includes(role) ? role : "influencer",
      emailVerificationToken: hashedVerificationToken,
    });

    console.log(`REGISTER SUCCESS: User created with ID ${user._id}`);

    // Send verification email (non-blocking)
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${hashedVerificationToken}`;
    EmailService.send(email, "Verify your Pactogram account", "Verify Email", `
      <p>Welcome to Pactogram!</p>
      <p>Please click the button below to verify your email address:</p>
      <a href="${verifyUrl}" class="btn">Verify Email</a>
    `).catch(err => console.error("Verification email error:", err.message));

    const token = signToken(user._id.toString());
    await createSession(user, token, req);
    
    res.status(201).json({ token, user });
  } catch (error) {
    console.error("REGISTER CRITICAL ERROR:", error);
    res.status(400).json({ message: error.message });
  }
});



authRouter.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    validate
  ],
  async (req, res) => {
    console.log("LOGIN ATTEMPT:", req.body.email);
    try {
      const { email, password } = req.body;
      const processedEmail = email ? email.toLowerCase().trim() : "";
      const user = await User.findOne({ email: processedEmail });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (user.isBanned) {
        return res.status(403).json({ error: "Your account has been suspended" });
      }

      const token = signToken(user._id.toString());
      await createSession(user, token, req);
      
      res.json({ token, user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Login failed" });
    }
  }
);

// --- FORGOT PASSWORD & EMAIL VERIFICATION ---

// Forgot Password
authRouter.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email is required").normalizeEmail(), validate],
  async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ error: "No account found with this email" });
      }

      const resetToken = crypto.randomBytes(20).toString("hex");
      user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 mins

      await user.save();

      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
      await EmailService.send(email, "Password Reset Request", "Reset Your Password", `
        <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
      `);

      
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

      // Security Alert
      await SecurityAlert.create({
        user: user._id,
        type: "password_change",
        message: "Your password was successfully reset."
      });
      EmailService.sendSecurityAlert(user, "password_change");


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
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = otp;
    await user.save();

    console.log("=========================================");
    console.log(`VERIFICATION CODE FOR ${email}: ${otp}`);
    console.log("=========================================");

    const emailSent = await EmailService.send(email, "Your Pactogram Verification Code", "Verify Identity", `
      <p>Your verification code is: <strong style="font-size: 24px; color: #6366f1;">${otp}</strong></p>
      <p>This code will expire shortly. Do not share it with anyone.</p>
    `);

    if (!emailSent) {
      return res.json({ 
        message: `Verification code generated! (SMTP not configured, code: ${otp})`,
        code: otp 
      });
    }

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

// POST /api/auth/social-login
authRouter.post("/social-login", async (req, res) => {
  try {
    const { email, name, uid, provider } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required for social sign-in" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user for social login
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const hashed = await bcrypt.hash(randomPassword, 10);
      
      // Generate a clean username based on email prefix
      const usernamePrefix = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
      const uniqueSuffix = Math.floor(1000 + Math.random() * 9000).toString();
      const username = `${usernamePrefix}_${uniqueSuffix}`;

      user = await User.create({
        name: name || email.split("@")[0],
        username,
        email: email.toLowerCase().trim(),
        password: hashed,
        role: "influencer", // default role, user can change later or select during onboarding
        isEmailVerified: true, // Social accounts are pre-verified
      });

      // Send welcome email (non-blocking)
      EmailService.sendWelcome(user).catch(err => 
        console.error("Failed to send welcome email:", err.message)
      );
    }

    const token = signToken(user._id.toString());
    await createSession(user, token, req);

    res.json({ token, user });
  } catch (err) {
    console.error("Social login route error:", err);
    res.status(500).json({ error: "Failed to process social login" });
  }
});
