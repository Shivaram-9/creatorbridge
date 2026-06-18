import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// Prevent users from submitting multiple reviews for the same user
reviewSchema.index({ targetUser: 1, author: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
