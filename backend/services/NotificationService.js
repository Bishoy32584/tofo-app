// NotificationService.js
const Notification = require("../models/Notification");
const User = require("../models/User"); // 🔹 لازم نعرف الـ subscriptions
const UserBehavior = require("../models/UserBehavior"); // 🔹 جديد لتسجيل النقرات
const webPush = require("web-push");

webPush.setVapidDetails(
  'mailto:you@example.com', // 🔹 غيّر للـ email الحقيقي
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

class NotificationService {

  static ioInstance = null; // 🔹 لإرسال real-time notifications

  // 🔹 setter للـ socket.io
  static setSocketIO(io) {
    NotificationService.ioInstance = io;
  }

  static async createNotification({ userId, type, senderId, message, chatId }) {

    try {
      // ✅ إضافة senderId و chatId مهم جدًا
      const notification = new Notification({
        userId,
        type,
        senderId,
        chatId,
        message,
        read: false
      });

      const savedNotification = await notification.save();

      // 🔹 إرسال real-time notification عبر Socket.io
      if (NotificationService.ioInstance) {
        NotificationService.ioInstance.to(userId).emit("newNotification", savedNotification);
      }

      // =========================
      // 🔹 إرسال Web Push Notification
      // =========================
      const user = await User.findById(userId);
      if (user?.subscriptions?.length > 0) {
        user.subscriptions.forEach(sub => {
          webPush.sendNotification(
            sub,
            JSON.stringify({
              title: 'TOFO Notification',
              message,
              url: type === 'message' && senderId ? `/chat/${senderId}` : '/',
              tag: type
            })
          ).catch(err => console.error('Push send error:', err));
        });
      }

      return savedNotification;

    } catch (error) {
      console.error("Notification creation failed:", error.message);
      return null;
    }

  }

  // 🔹 المرحلة 2: تسجيل click على notification بدون التأثير على أي stats موجودة
  static async registerClick({ userId, postId }) {
    try {
      await UserBehavior.findOneAndUpdate(
        { userId },
        { $inc: { [`notificationClicks.${postId}`]: 1 } },
        { upsert: true }
      );
    } catch (err) {
      console.error("Notification click registration failed:", err);
    }
  }

}

module.exports = NotificationService;