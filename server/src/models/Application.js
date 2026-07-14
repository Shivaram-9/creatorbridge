import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
    influencer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expectedPayment: { type: String, required: true },
    deliveryTime: { type: String, required: true },
    message: { type: String, required: true },
    portfolio: { type: String, required: true },
    socialHandle: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Application = mongoose.model("Application", applicationSchema);
