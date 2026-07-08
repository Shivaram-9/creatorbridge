import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { messagesRouter } from "./routes/messages.js";
import { notificationsRouter } from "./routes/notifications.js";
import { postsRouter } from "./routes/posts.js";
import { searchRouter } from "./routes/search.js";
import { storiesRouter } from "./routes/stories.js";

import { analyticsRouter } from "./routes/analytics.js";
import { campaignsRouter } from "./routes/campaigns.js";
import { collaborationsRouter } from "./routes/collaborations.js";
import { premiumRouter } from "./routes/premium.js";
import { privacyRouter } from "./routes/privacy.js";
import { securityRouter } from "./routes/security.js";
import { moderationRouter } from "./routes/moderation.js";
import { onboardingRouter } from "./routes/onboarding.js";
import { discoveryRouter } from "./routes/discovery.js";
import { dealsRouter } from "./routes/deals.js";
import { categoriesRouter } from "./routes/categories.js";
import { aiRouter } from "./routes/ai.js";
import { verificationRouter } from "./routes/verification.js";
import { brandRouter } from "./routes/brand.js";

import { Message } from "./models/Message.js";
import { Session } from "./models/Session.js";
import helmet from "helmet";
import { apiLimiter, authLimiter } from "./middleware/security.js";

const PORT = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Using insecure default for development only.");
  process.env.JWT_SECRET = "dev-insecure-secret-change-me";
}

const smtpCheck = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "CLIENT_URL"].filter(key => !process.env[key]);
if (smtpCheck.length > 0) {
  console.warn(`Warning: Missing email configuration for: ${smtpCheck.join(", ")}. Email verification and password recovery will not work.`);
} else {
  console.log("Email system configuration detected. ✅");
}

const app = express();

// 1. Priority Middlewares (MUST BE FIRST)
const allowedOrigins = [
  "https://pactogram.com",
  "https://www.pactogram.com",
  "https://pactogram.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// 2. Security
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow serving uploads across origins
app.use("/api", apiLimiter);

app.get("/api/health", (_, res) => {
  // Health check - triggered at 2026-05-11
  res.json({ ok: true, name: "Pactogram API", version: "1.0.1" });
});

// 3. Auth Routes (Bypassing limiter for now)
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/posts", postsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/search", searchRouter);
app.use("/api/stories", storiesRouter);

app.use("/api/analytics", analyticsRouter);
app.use("/api/campaigns", campaignsRouter);
app.use("/api/collaborations", collaborationsRouter);
app.use("/api/premium", premiumRouter);
app.use("/api/privacy", privacyRouter);
app.use("/api/security", securityRouter);
app.use("/api/moderation", moderationRouter);
app.use("/api/onboarding", onboardingRouter);
app.use("/api/discovery", discoveryRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/verification", verificationRouter);
app.use("/api/brand", brandRouter);


// Serve static uploads with explicit CORS for cross-origin media loading
app.use("/uploads", cors(), express.static("uploads"));
app.use("/uploads/stories", cors(), express.static("uploads/stories"));

const server = http.createServer(app);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ error: message });
});

export const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
});

app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Session validation for Socket
    const session = await Session.findOne({ token, isRevoked: false });
    if (!session) return next(new Error("Session revoked"));

    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

import { User } from "./models/User.js";

io.on("connection", async (socket) => {
  const uid = socket.userId;
  socket.join(`user:${uid}`);

  // Mark user as online
  await User.findByIdAndUpdate(uid, { isOnline: true, lastActive: new Date() });

  socket.on("disconnect", async () => {
    // Mark user as offline
    await User.findByIdAndUpdate(uid, { isOnline: false, lastActive: new Date() });
  });

  socket.on("send_message", async (payload, ack) => {
    try {
      const receiverId = payload?.receiverId;
      const content = typeof payload?.content === "string" ? payload.content.trim() : "";
      const media = (typeof payload?.media === "string" ? payload.media.trim() : "") || (typeof payload?.mediaUrl === "string" ? payload.mediaUrl.trim() : "");
      const mediaType = payload?.mediaType === "video" ? "video" : "image";

      if (!receiverId || (!content && !media)) {
        ack?.({ error: "receiverId and either content or media are required" });
        return;
      }
      if (receiverId === uid) {
        ack?.({ error: "Invalid receiver" });
        return;
      }
      
      // Block Check (Prompt-6)
      const receiver = await User.findById(receiverId);
      if (!receiver || receiver.blockedUsers.includes(uid) || receiver.blockedBy.includes(uid)) {
        ack?.({ error: "Cannot send message to this user" });
        return;
      }

      const msg = await Message.create({
        sender: uid,
        receiver: receiverId,
        content: content.slice(0, 5000),
        media: media.slice(0, 1000) || undefined,
        mediaUrl: media.slice(0, 1000) || undefined,
        mediaType: media ? mediaType : undefined,
      });
      await msg.populate("sender", "name email role");
      await msg.populate("receiver", "name email role");
      const plain = msg.toObject();
      io.to(`user:${receiverId}`).emit("message", plain);
      socket.emit("message", plain);
      ack?.({ ok: true, message: plain });
    } catch (e) {
      console.error(e);
      ack?.({ error: "Send failed" });
    }
  });

  socket.on("typing", (payload) => {
    const { receiverId } = payload;
    if (receiverId) {
      io.to(`user:${receiverId}`).emit("typing", { senderId: uid });
    }
  });

  socket.on("stop_typing", (payload) => {
    const { receiverId } = payload;
    if (receiverId) {
      io.to(`user:${receiverId}`).emit("stop_typing", { senderId: uid });
    }
  });

});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("Connected to MongoDB");
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Pactogram API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
