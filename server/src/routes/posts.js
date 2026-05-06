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

// Get feed posts (latest first) - from self and followed users
postsRouter.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Include self + following
    const following = Array.isArray(user.following) ? user.following : [];
    const userIds = [req.userId, ...following];

    const posts = await Post.find({ user: { $in: userIds } })
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

// Delete post
postsRouter.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.userId) {
      return res.status(403).json({ error: "You can only delete your own posts" });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete post" });
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

// Toggle Save post
postsRouter.post("/save/:id", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.savedPosts) user.savedPosts = [];
    
    const isSaved = user.savedPosts.some(id => id.toString() === postId);

    if (isSaved) {
      user.savedPosts = user.savedPosts.filter(id => id.toString() !== postId);
    } else {
      user.savedPosts.push(postId);
    }

    await user.save();
    res.json({ saved: !isSaved });
  } catch (err) {
    console.error("Save error:", err);
    res.status(500).json({ error: "Failed to save post" });
  }
});

// Get saved posts
postsRouter.get("/saved", async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: "savedPosts",
      populate: { path: "user", select: "name username avatar" }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Filter out nulls (deleted posts)
    const validPosts = (user.savedPosts || []).filter(p => p !== null);
    
    // Sort manually if needed, or rely on original order. 
    // Mongoose populate might not preserve order with options.sort easily in some versions.
    validPosts.reverse(); // Show latest saved first

    res.json(validPosts);
  } catch (err) {
    console.error("Get saved error:", err);
    res.status(500).json({ error: "Failed to load saved posts" });
  }
});
