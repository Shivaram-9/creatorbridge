import mongoose from "mongoose";

const alignRequestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

// Prevent duplicate requests
alignRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

export const AlignRequest = mongoose.model("AlignRequest", alignRequestSchema);
