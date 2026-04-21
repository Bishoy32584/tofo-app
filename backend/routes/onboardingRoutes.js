const express = require("express");
const router = express.Router();

const UserBehavior = require("../models/UserBehavior");
const authenticate = require("../modules/auth/auth.middleware");

// 🧠 Save onboarding mood
router.post("/mood", authenticate, async (req, res) => {
  try {
    const { mood, skipped } = req.body;

    // 🧠 Skip case → fallback neutral
    if (skipped) {
      await UserBehavior.findOneAndUpdate(
        { userId: req.userId },
        {
          $set: {
            "interests.emotions.neutral": 1,
            onboardingCompleted: true
          },
          $setOnInsert: {
            userId: req.userId
          }
        },
        { upsert: true, new: true }
      );

      return res.json({ success: true });
    }

    // 🧠 Mood case → safe nested update (no overwrite)
    await UserBehavior.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          [`interests.emotions.${mood || "neutral"}`]: 1,
          onboardingCompleted: true
        },
        $setOnInsert: {
          userId: req.userId
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;