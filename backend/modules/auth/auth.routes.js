const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const argon2 = require("argon2");

// ✏️ الخطوة 1.1: إضافة multer
const upload = require("../../middlewares/upload");

// ✅ NEW IMPORT (التعديل)
const { login, refresh, register } = require("./auth.controller");

// 🔹 REGISTER
router.post(
  "/register",
  upload.single("profileImage"),
  async (req, res) => {
    console.log("🔥 REGISTER HIT");
    console.log("BODY:", req.body);

    try {
      const { name, email, password, mood } = req.body;

      if (!name || !email || !password || !mood) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await argon2.hash(password);

      const imagePath = req.file ? req.file.path : "";

      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        mood,
        profileImage: imagePath
      });

      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// 🔹 LOGIN (NEW) + DEBUG LOG
router.post(
  "/login",
  (req, res, next) => {
    console.log("BODY:", req.body);
    next();
  },
  login
);

// 🔹 Refresh Token (NEW)
router.post("/refresh-token", refresh);

module.exports = router;