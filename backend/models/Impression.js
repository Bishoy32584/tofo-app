const mongoose = require("mongoose");

const impressionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
}, { timestamps: true });

// 🟢 NEW
impressionSchema.index({ userId: 1, postId: 1 });

module.exports = mongoose.model("Impression", impressionSchema);