import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true },
    device: {
      type: { type: String }, // mobile, desktop, tablet
      os: { type: String },
      browser: { type: String },
      ip: { type: String }
    },
    lastUsed: { type: Date, default: Date.now },
    isRevoked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", sessionSchema);
