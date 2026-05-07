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
import { adminRouter } from "./routes/admin.js";
import { analyticsRouter } from "./routes/analytics.js";
import { Message } from "./models/Message.js";
import helmet from "helmet";
import { apiLimiter } from "./middleware/security.js";

const PORT = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Using insecure default for development only.");
  process.env.JWT_SECRET = "dev-insecure-secret-change-me";
}

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" })); // Reduced limit for safety

app.use("/api", apiLimiter);

app.get("/api/health", (_, res) => {
  res.json({ ok: true, name: "CreatorBridge API" });
});

import { authLimiter, contentLimiter } from "./middleware/security.js";

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/users", usersRouter);
app.use("/api/messages", contentLimiter, messagesRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/posts", contentLimiter, postsRouter);
app.use("/api/search", searchRouter);
app.use("/api/stories", contentLimiter, storiesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/analytics", analyticsRouter);

// Serve static uploads
app.use("/uploads", express.static("uploads"));
app.use("/uploads/stories", express.static("uploads/stories"));

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

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const uid = socket.userId;
  socket.join(`user:${uid}`);

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
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected 🔥");
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`CreatorBridge API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
