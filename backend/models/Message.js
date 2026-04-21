const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    // 🔥 NEW LIFECYCLE
    status: {
      type: String,
      enum: ["SENDING", "SENT", "DELIVERED", "SEEN"],
      default: "SENT",
    },

    deliveredAt: Date,
    seenAt: Date,
  },
  {
    timestamps: true,
  }
);

// ✅ التعديل الوحيد الأول
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

// ✅ التعديل الوحيد الثاني (اللي اتضاف)
messageSchema.index({ status: 1 });

module.exports = mongoose.model("Message", messageSchema);