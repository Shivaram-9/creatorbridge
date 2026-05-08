import mongoose from "mongoose";

const dailySnapshotSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    followers: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 },
    postViews: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }, // Likes + Comments
  },
  { timestamps: true }
);

// Ensure one snapshot per user per day
dailySnapshotSchema.index({ user: 1, date: 1 }, { unique: true });

export const DailySnapshot = mongoose.model("DailySnapshot", dailySnapshotSchema);

const analyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["profile_view", "post_view", "post_impression"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // UserId or PostId
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Viewer ID (optional)
    timestamp: { type: Date, default: Date.now },
  }
);

export const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);
