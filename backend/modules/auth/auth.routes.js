const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const argon2 = require("argon2");

// ✏️ الخطوة 1.1: إضافة multer
const upload = require("../../middlewares/upload");

// ✅ NEW IMPORT (التعديل)
const { login, refresh, register } = require("./auth.controller");

// 🔹 REGISTER (UPDATED ONLY)
router.post(
  "/register",
  upload.single("profileImage"),
  register
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