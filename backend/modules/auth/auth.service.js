const User = require("../../models/User");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// --------------------
// Helper: Generate JWTs
// --------------------
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  });
};

const generateRefreshToken = (userId) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { id: userId, jti },
    process.env.JWT_REFRESH_SECRET, // ✅ التعديل هنا فقط
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
    }
  );
  return { token, jti };
};

// --------------------
// Register User
// --------------------
const registerUser = async ({ name, email, password, mood, profileImage }) => { // ✅ تعديل
  const existing = await User.findOne({ email });
  if (existing) throw new Error("Email already registered");

  const hashed = await argon2.hash(password, { type: argon2.argon2id });

  // ✅ التعديل هنا
  const newUser = new User({ 
    name, 
    email, 
    password: hashed, 
    mood,
    profileImage 
  });

  await newUser.save();
  return newUser;
};

// --------------------
// Login User
// --------------------
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Invalid credentials");

  const valid = await argon2.verify(user.password, password);
  if (!valid) throw new Error("Invalid credentials");

  // Generate Tokens
  const accessToken = generateAccessToken(user._id);
  const { token: refreshToken, jti } = generateRefreshToken(user._id);

  // Store refresh token in DB
  user.refreshTokens.push({
    token: refreshToken,
    jti,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7d
  });
  await user.save();

  return { user, accessToken, refreshToken };
};

// --------------------
// Rotate Refresh Token
// --------------------
const rotateRefreshToken = async ({ userId, oldJti, deviceInfo }) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const tokenIndex = user.refreshTokens.findIndex(
    (t) => t.jti === oldJti && !t.revoked
  );
  if (tokenIndex === -1)
    throw new Error("Refresh token invalid or revoked");

  // Revoke old token
  user.refreshTokens[tokenIndex].revoked = true;

  // Issue new refresh token
  const { token, jti } = generateRefreshToken(user._id);
  user.refreshTokens.push({
    token,
    jti,
    deviceInfo,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();
  return { token, jti };
};

module.exports = {
  registerUser,
  loginUser,
  rotateRefreshToken,
  generateAccessToken,
};