import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, default: "" },
    media: [{ type: String }], // Multiple images/videos
    mediaType: { type: String, enum: ["image", "video", "gallery"], default: "image" },
    category: { type: String, default: "Lifestyle" },
    location: { type: String, default: "" },
    hashtags: [{ type: String }],
    taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPinned: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

postSchema.pre("save", function (next) {
  const likesCount = this.likes ? this.likes.length : 0;
  const commentsCount = this.comments ? this.comments.length : 0;
  const savesCount = this.saves ? this.saves.length : 0;
  const viewsCount = this.views || 0;
  const sharesCount = this.shares || 0;

  this.engagementScore = likesCount + (commentsCount * 2) + (savesCount * 3) + (viewsCount) + (sharesCount * 5);
  next();
});

export const Post = mongoose.model("Post", postSchema);

// Enterprise Indexes
postSchema.index({ user: 1, createdAt: -1 });
postSchema.index({ engagementScore: -1 });
postSchema.index({ category: 1, engagementScore: -1 });
postSchema.index({ isArchived: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
