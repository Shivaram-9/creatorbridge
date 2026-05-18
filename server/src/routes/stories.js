import { Router } from "express";
import { Story } from "../models/Story.js";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";
import { storyUpload } from "../middleware/upload.js";

export const storiesRouter = Router();

storiesRouter.use(authMiddleware);

// POST /api/stories - Upload story
storiesRouter.post("/", storyUpload.single("media"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Media file is required" });

    let url = req.file.secure_url || req.file.path || req.file.url || "";
    const isCloudinary = (req.file.filename && req.file.filename.includes("Pactogram/")) || (url && url.includes("Pactogram/"));

    if (isCloudinary && !url.startsWith("http")) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const publicId = req.file.filename || url;
      url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    } else if (!url.startsWith("http")) {
      url = `/uploads/stories/${req.file.filename}`;
    }

    // Ghost Path Rescue
    if (url.includes("/uploads/stories/Pactogram/")) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const publicId = url.split("/uploads/stories/")[1];
      url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    }
    
    const mediaPath = url;
    const mediaType = req.file.mimetype.startsWith("video") ? "video" : "image";

    const story = await Story.create({
      user: req.userId,
      media: mediaPath,
      mediaType,
    });

    const populatedStory = await story.populate("user", "name username avatar isVerified");
    res.status(201).json(populatedStory);
  } catch (err) {
    console.error("Story upload error:", err);
    res.status(500).json({ error: "Failed to upload story" });
  }
});

// GET /api/stories/feed - Get stories for the feed
storiesRouter.get("/feed", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Get followed users' IDs plus own ID
    const userIds = [...(user.following || []), req.userId];

    // Find stories from these users that haven't expired
    // MongoDB TTL will handle deletion, so we just find all and group by user
    const stories = await Story.find({ user: { $in: userIds } })
      .populate("user", "name username avatar isVerified")
      .sort({ createdAt: 1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {});

    res.json(Object.values(groupedStories));
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ error: "Failed to fetch stories feed" });
  }
});

// POST /api/stories/view/:id - Mark story as viewed
storiesRouter.post("/view/:id", async (req, res) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.userId }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("View error:", err);
    res.status(500).json({ error: "Failed to mark story as viewed" });
  }
});

// DELETE /api/stories/:id - Delete own story
storiesRouter.delete("/:id", async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });
    if (!story) return res.status(404).json({ error: "Story not found or unauthorized" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: "Failed to delete story" });
  }
});
