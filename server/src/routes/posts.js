import { Router } from "express";
import { Post } from "../models/Post.js";
import { authMiddleware } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

export const postsRouter = Router();

postsRouter.use(authMiddleware);

// Create new post
postsRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const { text } = req.body;
    let image = "";

    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    const post = await Post.create({
      user: req.userId,
      text: text || "",
      image,
    });

    await post.populate("user", "name email avatar username role");
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Get all posts (latest first)
postsRouter.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name email avatar username role")
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load posts" });
  }
});

// Get posts of specific user
postsRouter.get("/user/:id", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.id })
      .populate("user", "name email avatar username role")
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load user posts" });
  }
});
