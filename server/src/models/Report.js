import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "post", "comment", "message"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "investigating", "resolved", "dismissed"], default: "pending" },
    adminNotes: { type: String, default: "" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
