const mongoose = require("mongoose");

const postViewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

// 🔥 منع التكرار لنفس المستخدم ونفس البوست
postViewSchema.index({ userId: 1, postId: 1 }, { unique: true });

module.exports = mongoose.model("PostView", postViewSchema);