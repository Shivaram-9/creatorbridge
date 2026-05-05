import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    image: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Post = mongoose.model("Post", postSchema);
