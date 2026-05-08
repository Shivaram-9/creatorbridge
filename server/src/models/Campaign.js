import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    budget: { type: String, required: true },
    deadline: { type: Date, required: true },
    requirements: { type: String, required: true },
    hashtags: [{ type: String }],
    banner: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    invitedInfluencers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    acceptedInfluencers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["Open", "Closed", "Completed"],
      default: "Open",
    },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
