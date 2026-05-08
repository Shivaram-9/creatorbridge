import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["earning", "payout", "refund", "subscription", "withdrawal", "bonus"], required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
    description: { type: String },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    payoutMethod: { type: String },
    transactionId: { type: String },
    invoiceUrl: { type: String },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String }
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);

transactionSchema.index({ user: 1 });
transactionSchema.index({ transactionId: 1 }, { unique: true, sparse: true });
transactionSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

