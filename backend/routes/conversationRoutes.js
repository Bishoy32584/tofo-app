const express = require("express");
const router = express.Router();

const Conversation = require("../models/Conversation");
const authenticate = require("../modules/auth/auth.middleware");

// جلب كل محادثات المستخدم
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.find({
      participants: { $in: [userId] }
    })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "name");

    res.json(conversations);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// 🔹 تصفير unread عند فتح الشات
router.post("/read/:otherUserId", authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    const participants = [userId, otherUserId].sort();

    const conversation = await Conversation.findOne({
      participants: { $all: participants }
    });

    if (!conversation) {
      return res.json({ message: "No conversation found" });
    }

    conversation.unread.set(userId.toString(), 0);

    await conversation.save();

    res.json({ message: "Unread reset done" });

  } catch (err) {
    console.error("Reset unread error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;