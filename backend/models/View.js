const mongoose = require("mongoose");

const viewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  duration: Number
}, { timestamps: true });

// 🟢 NEW
viewSchema.index({ userId: 1, postId: 1 });

module.exports = mongoose.model("View", viewSchema);