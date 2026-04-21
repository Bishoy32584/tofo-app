const mongoose = require("mongoose");

const userBehaviorSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  // ✅ الحقول الحالية بدون أي تغيير
  viewedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  }],

  interests: {
    emotions: { 
      type: Map, 
      of: Number, 
      default: {} 
    },
    tags: { 
      type: Map, 
      of: Number, 
      default: {} 
    }
  },

  behavior: {
    hugsGiven: { type: Number, default: 0 },
    chatsStarted: { type: Number, default: 0 },
    avgSessionTime: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 } // ✅ موجود
  },

  // 🔹 NEW: Shadow Ban Score
  shadowBanScore: { type: Number, default: 0 },

  // ✅ المرحلة الثالثة: تسجيل نقرات notifications لكل post
  notificationClicks: {
    type: Map,
    of: Number,
    default: {}
  },

  // 🔹 المرحلة الرابعة: تحضير predictive scoring لكل post
  predictedScore: {
    type: Map,
    of: Number,
    default: {}
  },

  // 🔥 NEW
  maxMapSize: {
    type: Number,
    default: 1000
  }

}, { timestamps: true });

// 🟢 NEW
userBehaviorSchema.index({ userId: 1 });

module.exports = mongoose.model("UserBehavior", userBehaviorSchema);