const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, default: "", required: false },
  mood: String,
  emotion: String,
  tags: [String],
  isAnonymous: Boolean,
  media: Object,

  postVector: {
    type: [Number],
    default: []
  },

  // ✅ إضافة الصور (ONLY CHANGE)
  images: {
    type: [String],
    default: []
  },

  // ✅ إضافة التعديل الجديد فقط (analysis layer)
  analysis: {
    sentiment: String,
    category: String,
    topics: [String]
  },

  // ✅ ADDED ONLY (explicit content score system)
  explicitScore: { type: Number, default: 0 },

  stats: {
    views: { type: Number, default: 0 },
    hugs: { type: Number, default: 0 },
    chatsStarted: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    totalViewTime: { type: Number, default: 0 }
  },

  // 🔥 expires after 24h
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }

}, { timestamps: true });

// TTL index
postSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// 🔥 NEW INDEXES
postSchema.index({ createdAt: -1 });
postSchema.index({ user: 1 });

module.exports = mongoose.model("Post", postSchema);