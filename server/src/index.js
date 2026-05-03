import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { authRouter } from "./routes/auth.js";
import { usersRouter } from "./routes/users.js";
import { connectionsRouter } from "./routes/connections.js";
import { messagesRouter } from "./routes/messages.js";
import { notificationsRouter } from "./routes/notifications.js";
import { Message } from "./models/Message.js";
import { hasAcceptedConnection } from "./lib/connectionHelpers.js";

const PORT = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set. Using insecure default for development only.");
  process.env.JWT_SECRET = "dev-insecure-secret-change-me";
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_, res) => {
  res.json({ ok: true, name: "CreatorBridge API" });
});

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/connections", connectionsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/notifications", notificationsRouter);

const server = http.createServer(app);

const io = new Server(server, {
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
      const mediaUrl = typeof payload?.mediaUrl === "string" ? payload.mediaUrl.trim() : "";
      const mediaType = payload?.mediaType === "video" ? "video" : "image";

      if (!receiverId || (!content && !mediaUrl)) {
        ack?.({ error: "receiverId and either content or mediaUrl are required" });
        return;
      }
      if (receiverId === uid) {
        ack?.({ error: "Invalid receiver" });
        return;
      }
      const ok = await hasAcceptedConnection(uid, receiverId);
      if (!ok) {
        ack?.({ error: "Not connected" });
        return;
      }
      const msg = await Message.create({
        sender: uid,
        receiver: receiverId,
        content: content.slice(0, 5000),
        mediaUrl: mediaUrl.slice(0, 1000) || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
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
