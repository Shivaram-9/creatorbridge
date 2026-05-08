import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    influencer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    goals: { type: String },
    requirements: { type: String },
    documents: [{ type: String }],
    
    // Workflow State
    status: {
      type: String,
      enum: ["offered", "negotiating", "accepted", "rejected", "active", "completed", "cancelled"],
      default: "offered"
    },
    
    // Digital Agreement
    agreement: {
      isAccepted: { type: Boolean, default: false },
      acceptedAt: { type: Date },
      terms: { type: String }
    },
    
    // Deliverables Checklist
    deliverables: [
      {
        task: { type: String, required: true },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date },
        proofUrl: { type: String }
      }
    ],
    
    // Progress Tracking
    progress: { type: Number, default: 0 }, // 0 to 100
    
    // Negotiation History
    negotiationHistory: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        budget: { type: Number },
        deadline: { type: Date },
        message: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export const Deal = mongoose.model("Deal", dealSchema);
