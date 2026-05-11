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
    role: { type: String, required: true, enum: ["influencer", "brand", "admin"] },
    isBanned: { type: Boolean, default: false },
    name: { type: String, default: "" },
    username: { type: String, default: "" },
    category: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    avatar: { type: String, default: "" },
    instagram: { type: String, default: "" },
    youtube: { type: String, default: "" },
    website: { type: String, default: "" },
    profileViews: { type: Number, default: 0 },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post", default: [] }],
    collections: [
      {
        name: { type: String, required: true },
        posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }]
      }
    ],
    isVerified: { type: Boolean, default: false }, // Platform verification (badge)
    isPremium: { type: Boolean, default: false }, // Premium subscription status
    premiumTier: { type: String, enum: ["none", "silver", "gold", "platinum"], default: "none" },
    premiumExpiry: { type: Date },
    walletBalance: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 }, // Total lifetime earnings
    pendingEarnings: { type: Number, default: 0 },
    totalPayouts: { type: Number, default: 0 },
    subscriptionStatus: { type: String, enum: ["active", "expired", "none"], default: "none" },
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    isEmailVerified: { type: Boolean, default: false }, // Email verification status
    emailVerificationToken: { type: String },
    verificationCode: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    portfolio: { type: [portfolioItemSchema], default: [] },
    
    // Privacy & Security (Prompt-6)
    isPrivate: { type: Boolean, default: false },
    allowMessagesFrom: { type: String, enum: ["everyone", "following", "none"], default: "everyone" },
    showActivityStatus: { type: Boolean, default: true },
    isDiscoverable: { type: Boolean, default: true },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    blockedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    
    // Onboarding (Prompt-6)
    onboardingComplete: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 1 },
    
    // Notification Preferences (Prompt-6)
    notifSettings: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      campaigns: { type: Boolean, default: true }
    },
    
    // AI Discovery Behavior (Prompt-7)
    viewedProfiles: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    viewedCategories: [{ type: String }],
    interests: [{ type: String }],
    
    // Brand Specific
    shortlistedCreators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },

  { timestamps: true }
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model("User", userSchema);

// Enterprise Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isDiscoverable: 1, category: 1 });
userSchema.index({ isVerified: 1, profileViews: -1 });
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ isPremium: 1 });
