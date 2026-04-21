const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const mongoose = require("mongoose");

// ✅ التعديل (لازم يتضاف علشان نستخدمه)
const UserBehavior = require("../models/UserBehavior");

const authenticate = require("../modules/auth/auth.middleware");

// TEST ROUTE
router.get("/test", async (req, res) => {
  try {
    const messages = await Message.find({});
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// جلب كل الرسائل
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).sort({ createdAt: -1 });

    res.json(messages);

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// جلب الرسائل بين مستخدمين (CURSOR BASED PAGINATION)
router.get("/:user1/:user2", authenticate, async (req, res) => {
  try {
    const { user1, user2 } = req.params;
    const { cursor } = req.query;

    const query = {
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(messages.reverse());

  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ───── POST message (FIXED SECURE) ─────
router.post("/", authenticate, async (req, res) => {
  try {
    const { receiver, content, mood, isAnonymous } = req.body;

    // ✅ sender بقى جاي من التوكن مش من المستخدم
    const sender = req.userId;

    if (!receiver || !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newMessage = new Message({
      sender,
      receiver,
      content,
      mood,
      isAnonymous,
    });

    await newMessage.save();

    // ✅ التعديل هنا
    await UserBehavior.findOneAndUpdate(
      { userId: sender },
      { $inc: { "behavior.chatsStarted": 1 } },
      { upsert: true }
    );

    res.status(201).json(newMessage);

  } catch (err) {
    console.error("POST /messages error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;