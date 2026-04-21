// notificationRoutes.js
const express = require("express");
const router = express.Router();

const Notification = require("../models/Notification");
const User = require("../models/User"); // 🔹 تأكد من استيراد User model
const jwt = require("jsonwebtoken");

// =======================
// Middleware للتحقق من JWT
// =======================
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// =======================
// جلب إشعارات المستخدم
// =======================
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    console.error("❌ Fetch notifications error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

// =======================
// TEST ROUTE (FIXED)
// =======================
router.get("/test", authenticate, async (req, res) => {
  try {
    const NotificationService = require("../services/NotificationService");
    const notification = await NotificationService.createNotification({
      userId: req.user.id,
      type: "system",
      message: "Test notification from server"
    });

    res.json({ success: true, notification });
  } catch (error) {
    console.error("❌ Test notification error:", error.message);
    res.status(500).json({ success: false, message: "Test notification failed" });
  }
});

// =======================
// MARK AS READ (NEW)
// =======================
router.patch("/mark-read", authenticate, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("❌ Mark as read error:", error.message);
    res.status(500).json({ success: false, message: "Failed to mark as read" });
  }
});

// =======================
// 🔹 Web Push Subscription Route
// =======================
router.post("/subscribe", authenticate, async (req, res) => {
  try {
    const subscription = req.body;
    const userId = req.user.id;

    if (!subscription || Object.keys(subscription).length === 0) {
      return res.status(400).json({ message: "Invalid subscription" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.subscriptions = user.subscriptions || [];

    // إزالة أي subscription مكرر
    const exists = user.subscriptions.some(sub =>
      JSON.stringify(sub) === JSON.stringify(subscription)
    );

    if (!exists) {
      user.subscriptions.push(subscription);
      await user.save();
    }

    res.json({ success: true, message: "Subscription saved" });
  } catch (err) {
    console.error("❌ Subscription route error:", err.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;