require("dotenv").config();
const mongoose = require("mongoose");
const NotificationService = require("./services/NotificationService");

const MONGO_URI = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "TOFO",
      serverSelectionTimeoutMS: 5000,
      family: 4
    });
    console.log("✅ MongoDB Connected for Test");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  }
};

const testNotifications = async () => {
  await connectDB();

  // ✅ إشعار رسالة جديدة
  const notifMessage = await NotificationService.createNotification({
    userId: "000000000000000000000001",
    type: "message",
    senderId: "000000000000000000000002",
    message: "Test: You have a new message"
  });
  console.log("Message Notification:", notifMessage);

  // ✅ إشعار شخص ضغط 🫂 على منشور
  const notifHug = await NotificationService.createNotification({
    userId: "000000000000000000000001",
    type: "hug",
    senderId: "000000000000000000000003",
    message: "Test: Someone hugged your post"
  });
  console.log("Hug Notification:", notifHug);

  // ✅ إشعار مشاهدة Story/Mood
  const notifStory = await NotificationService.createNotification({
    userId: "000000000000000000000001",
    type: "story_view",
    message: "Test: 3 people viewed your story"
  });
  console.log("Story/Mood Notification:", notifStory);

  // ✅ إشعار دخول مستخدم جديد
  const notifJoin = await NotificationService.createNotification({
    userId: "000000000000000000000001",
    type: "system",
    message: "Test: New user joined"
  });
  console.log("New User Notification:", notifJoin);

  mongoose.disconnect();
};

testNotifications();