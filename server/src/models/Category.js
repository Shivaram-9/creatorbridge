import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    parent: { type: String, default: null, index: true }, // null means it's a top-level Discovery category
    related: [{ type: String }],
    creatorSupport: { type: Boolean, default: true },
    brandSupport: { type: Boolean, default: true },
    popularity: { type: Number, default: 0 },
    searchKeywords: [{ type: String }],
    icon: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
