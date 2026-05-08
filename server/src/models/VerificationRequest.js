import mongoose from "mongoose";

const verificationRequestSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    idProof: { type: String, required: true }, // Path to uploaded ID
    brandProof: { type: String }, // Optional path for brands
    socialLinks: {
      instagram: String,
      youtube: String,
      twitter: String,
      other: String,
    },
    category: { type: String, required: true },
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    adminNotes: { type: String },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const VerificationRequest = mongoose.model("VerificationRequest", verificationRequestSchema);
