import express from "express";
import mongoose from "mongoose";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { postUpload } from "../middleware/upload.js";

const router = express.Router();

// Create Post (Support multiple media)
router.post("/", authMiddleware, postUpload.array("media", 10), async (req, res) => {
  try {
    const { content, category, location, hashtags, taggedUsers } = req.body;

    // Cloudinary returns file.path or file.secure_url (full https URL); disk storage uses filename
    const mediaFiles = req.files
      ? req.files.map(f => {
          let url = f.secure_url || f.path || f.url || "";
          const isCloudinary = (f.filename && f.filename.includes("creatorbridge/")) || (url && url.includes("creatorbridge/"));
          
          if (isCloudinary && !url.startsWith("http")) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const publicId = f.filename || url;
            url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
          } else if (!url.startsWith("http")) {
            url = `/uploads/posts/${f.filename}`;
          }
          
          // Ghost Path Rescue
          if (url.includes("/uploads/posts/creatorbridge/")) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
            const publicId = url.split("/uploads/posts/")[1];
            url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
          }
          return url;
        })
      : [];

    const post = await Post.create({
      user: new mongoose.Types.ObjectId(req.userId),
      content: content || "",
      media: mediaFiles || [],
      mediaType: mediaFiles.length > 1 ? "gallery" : mediaFiles.length === 1 ? "image" : "none",
      category: category || "Lifestyle",
      location: location || "",
      hashtags: (typeof hashtags === "string") ? hashtags.split(",").map(h => h.trim()).filter(Boolean) : [],
      taggedUsers: (typeof taggedUsers === "string") ? taggedUsers.split(",").filter(Boolean) : [],
    });

    await post.populate("user", "name username avatar role isVerified isPremium");
    console.log("✅ Post created successfully:", post._id);
    res.status(201).json(post);
  } catch (err) {
    console.error("Post create error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get Feed (Alliances only) - Dedicated Route
router.get("/feed-alliances", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("following followers");
    if (!user) return res.status(404).json({ error: "User not found" });

    const currentUserObjectId = new mongoose.Types.ObjectId(req.userId);
    const following = Array.isArray(user.following) ? user.following : [];
    const followers = Array.isArray(user.followers) ? user.followers : [];

    // Combine following and followers to get all "alliances" plus current user
    const allianceIds = [
      currentUserObjectId,
      ...following,
      ...followers
    ].filter(Boolean);

    const posts = await Post.find({ 
      user: { $in: allianceIds },
      isArchived: { $ne: true }
    })
      .populate("user", "name username avatar role isVerified isPremium")
      .sort({ createdAt: -1 })
      .limit(50);
      
    res.json(posts);
  } catch (err) {
    console.error("Alliance feed error:", err);
    res.status(500).json({ error: "Backend Feed Error: " + err.message });
  }
});

// Get Feed (Public / Discover fallback)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find({ isArchived: false })
      .populate("user", "name username avatar role isVerified isPremium")
      .sort("-isPinned -createdAt")
      .limit(20);
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
    await post.populate("user", "name avatar role");
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
    await post.populate("user", "name avatar role");
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
    await post.populate("user", "name avatar role");
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save/Unsave Post
router.post("/save/:postId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const postId = req.params.postId;
    if (user.savedPosts.includes(postId)) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    } else {
      user.savedPosts.push(postId);
    }
    await user.save();
    res.json({ saved: user.savedPosts.includes(postId) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like Post
router.post("/like/:postId", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (post.likes.includes(req.userId)) {
      post.likes = post.likes.filter(id => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }
    await post.save();
    await post.populate("user", "name avatar role");
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment on Post
router.post("/comment/:postId", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.postId);
    post.comments.push({ user: req.userId, text });
    await post.save();
    await post.populate("comments.user", "name avatar");
    res.json(post.comments[post.comments.length - 1]);
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

// Get users who liked a post
router.get("/:postId/likes", async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId).populate("likes", "name username avatar role bio");
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.json(post.likes || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export { router as postsRouter };
