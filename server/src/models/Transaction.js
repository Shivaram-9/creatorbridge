import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["subscription", "payout", "bonus"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    paymentMethod: { type: String, default: "stripe" },
    transactionId: { type: String, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
