import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    reason: { 
      type: String, 
      required: true,
      enum: ["Spam", "Abuse", "Fake account", "Inappropriate content", "Other"]
    },
    description: { type: String, default: "" },
    status: { 
      type: String, 
      enum: ["pending", "resolved", "dismissed"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
