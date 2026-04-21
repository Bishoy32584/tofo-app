const mongoose = require("mongoose");

// 🔹 Schema لتخزين refresh tokens
const refreshTokenSchema = new mongoose.Schema({
  token: String,
  jti: String,
  deviceInfo: String,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  revoked: {
    type: Boolean,
    default: false
  }
});

// 🔹 Schema المستخدم الرئيسي (موحد)
const userSchema = new mongoose.Schema({

  // ✅ من السيستم القديم
  name: {
    type: String
  },

  mood: {
    type: String
  },

  password: {
    type: String
  },

  // ✅ من نظام الـ auth
  username: {
    type: String,
    unique: true,
    sparse: true
  },

  passwordHash: {
    type: String
  },

  role: {
    type: String,
    default: "user"
  },

  // ✅ مشترك
  email: {
    type: String,
    unique: true,
    sparse: true
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  refreshTokens: [refreshTokenSchema],

  lastLogin: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  // ✅ ADDED ONLY
  profileImage: {
    type: String,
    default: ""
  }

});

// 🔹 تحديث تلقائي لـ updatedAt (FIX)
userSchema.pre("save", async function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model("User", userSchema);