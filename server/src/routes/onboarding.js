import { Router } from "express";
import { User } from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

export const onboardingRouter = Router();

onboardingRouter.use(authMiddleware);

// POST /api/onboarding/complete
onboardingRouter.post("/complete", async (req, res) => {
  try {
    const { category, bio, onboardingComplete } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId, 
      { $set: { category, bio, onboardingComplete: onboardingComplete ?? true } }, 
      { new: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to complete onboarding" });
  }
});

// PATCH /api/onboarding/step
onboardingRouter.patch("/step", async (req, res) => {
  try {
    const { step } = req.body;
    const user = await User.findByIdAndUpdate(req.userId, { $set: { onboardingStep: step } }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update step" });
  }
});
