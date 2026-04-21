const express = require("express");
const router = express.Router();
const User = require("../models/User");

// إنشاء مستخدم جديد
router.post("/", async (req, res) => {
  try {
    const { name, mood } = req.body;

    const newUser = new User({ name, mood });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// جلب كل المستخدمين
router.get("/", async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;