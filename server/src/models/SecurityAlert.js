import mongoose from "mongoose";

const securityAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
      type: String, 
      enum: ["new_login", "suspicious_login", "password_change", "email_change"], 
      required: true 
    },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const SecurityAlert = mongoose.model("SecurityAlert", securityAlertSchema);
