import express from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { postUpload } from "../middleware/upload.js";

const router = express.Router();

// Create Post (Support multiple media)
router.post("/", authMiddleware, postUpload.array("media", 10), async (req, res) => {
  try {
    const { content, category, location, hashtags, taggedUsers } = req.body;
    const mediaFiles = req.files ? req.files.map(f => `/uploads/posts/${f.filename}`) : [];
    
    const post = await Post.create({
      user: req.userId,
      content,
      media: mediaFiles,
      mediaType: mediaFiles.length > 1 ? "gallery" : "image",
      category,
      location,
      hashtags: hashtags ? hashtags.split(",").map(h => h.trim()) : [],
      taggedUsers: taggedUsers ? taggedUsers.split(",") : [],
    });
    
    await post.populate("user", "name avatar role");
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Feed (exclude archived)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ isArchived: false })
      .populate("user", "name avatar role")
      .sort("-isPinned -createdAt");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User's Posts (including pinned first)
router.get("/user/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId, isArchived: false })
      .populate("user", "name avatar role")
      .sort("-isPinned -createdAt");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pin/Unpin Post
router.patch("/pin/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user.toString() !== req.userId) return res.status(403).json({ error: "Unauthorized" });

    post.isPinned = !post.isPinned;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Archive/Unarchive Post
router.patch("/archive/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user.toString() !== req.userId) return res.status(403).json({ error: "Unauthorized" });

    post.isArchived = !post.isArchived;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit Post
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user.toString() !== req.userId) return res.status(403).json({ error: "Unauthorized" });

    const { content, category, location } = req.body;
    post.content = content || post.content;
    post.category = category || post.category;
    post.location = location || post.location;
    
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like Post
router.post("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post.likes.includes(req.userId)) {
      post.likes.push(req.userId);
      await post.save();
    } else {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
      await post.save();
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Post
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.user.toString() !== req.userId) return res.status(403).json({ error: "Unauthorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as postsRouter };
