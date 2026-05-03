import mongoose from "mongoose";

const portfolioItemSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    mediaType: { type: String, enum: ["image", "video"], default: "image" },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, required: true, enum: ["influencer", "brand"] },
    name: { type: String, default: "" },
    username: { type: String, default: "" },
    category: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    avatar: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    followers: { type: Number, default: 0 },
    portfolio: { type: [portfolioItemSchema], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model("User", userSchema);
