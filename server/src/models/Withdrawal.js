import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "completed"], default: "pending" },
    payoutMethod: { type: String, default: "UPI" },
    payoutDetails: { type: String }, // e.g. UPI ID or Bank details
    adminNotes: { type: String },
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }
  },
  { timestamps: true }
);

export const Withdrawal = mongoose.model("Withdrawal", withdrawalSchema);
