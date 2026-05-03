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
        return !this.mediaUrl;
      },
    },
    mediaUrl: { type: String, trim: true, maxlength: 1000 },
    mediaType: { type: String, enum: ["image", "video"] },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, receiver: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
