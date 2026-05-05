import { Router } from "express";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
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
      .populate("comments.user", "name username avatar")
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
      .populate("comments.user", "name username avatar")
      .sort({ createdAt: -1 })
      .lean();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load user posts" });
  }
});

// Like/Unlike post
postsRouter.post("/like/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const isLiked = post.likes.includes(req.userId);
    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== req.userId);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    // Create notification for like
    if (post.user.toString() !== req.userId && !isLiked) {
      const me = await User.findById(req.userId);
      await Notification.create({
        user: post.user,
        sender: req.userId,
        type: "like",
        post: post._id,
        message: `${me.username || me.name} liked your post`,
      });
    }

    res.json({ likes: post.likes, liked: !isLiked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to like post" });
  }
});

// Add comment
postsRouter.post("/comment/:id", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = {
      user: req.userId,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Create notification for comment
    if (post.user.toString() !== req.userId) {
      const me = await User.findById(req.userId);
      await Notification.create({
        user: post.user,
        sender: req.userId,
        type: "comment",
        post: post._id,
        message: `${me.username || me.name} commented on your post`,
      });
    }

    // Populate the newly added comment's user info
    const updatedPost = await Post.findById(req.params.id)
      .populate("comments.user", "name username avatar")
      .lean();
    
    const addedComment = updatedPost.comments[updatedPost.comments.length - 1];
    res.status(201).json(addedComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});
