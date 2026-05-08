import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: {
      type: String,
      trim: true,
      maxlength: 5000,
      required: function () {
        return !this.media && !this.mediaUrl;
      },
    },
    media: { type: String, trim: true, maxlength: 1000 },
    mediaUrl: { type: String, trim: true, maxlength: 1000 }, // Legacy support
    mediaType: { type: String, enum: ["image", "video"] },
    read: { type: Boolean, default: false },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
