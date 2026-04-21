const mongoose = require("mongoose");

const hugSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
}, { timestamps: true });

// 🟢 NEW
hugSchema.index({ userId: 1, postId: 1 });

module.exports = mongoose.model("Hug", hugSchema);