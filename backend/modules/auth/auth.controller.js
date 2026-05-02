const jwt = require("jsonwebtoken");

const { registerUser, loginUser, rotateRefreshToken } = require("./auth.service");

// --------------------
// Register Route
// --------------------

const register = async (req, res) => {

try {

console.log(req.body);

// ✅ التعديل الجديد
let profileImage = "";

if (req.file) {
  profileImage = req.file.path;
}

const { name, email, password, mood } = req.body;

// ✅ التعديل هنا (إرسال الصورة للـ service)
const user = await registerUser({ name, email, password, mood, profileImage });

res.status(201).json({

  message: "User registered successfully",

  userId: user._id

});

} catch (err) {

res.status(400).json({ message: err.message });

}

};

// --------------------
// Login Route
// --------------------

const login = async (req, res) => {

try {

const { email, password } = req.body;

const { user, accessToken, refreshToken } = await loginUser({
  email,
  password
});

// Send refresh token as HttpOnly cookie
res.cookie("refresh_token", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

res.json({
  message: "Login successful",
  accessToken,
  userId: user._id
});

} catch (err) {

res.status(400).json({ message: err.message });

}

};

// --------------------
// Refresh Token Route
// --------------------

const refresh = async (req, res) => {

try {

// ✅ DEBUG (المضاف فقط)
console.log("🍪 COOKIES:", req.cookies);
console.log("🔐 REFRESH:", req.cookies?.refresh_token);

const oldToken = req.cookies.refresh_token;

if (!oldToken) throw new Error("No refresh token");

// ✅ التعديل هنا فقط
const payload = jwt.verify(oldToken, process.env.JWT_REFRESH_SECRET);

const { token: newRefreshToken } = await rotateRefreshToken({
  userId: payload.id,
  oldJti: payload.jti
});

// إنشاء access token جديد
const accessToken = jwt.sign(
  { id: payload.id },
  process.env.JWT_SECRET,
  { expiresIn: "15m" }
);

// إرسال refresh token الجديد
res.cookie("refresh_token", newRefreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000
});

// إرسال access token الجديد للـfrontend
res.json({
  message: "Token rotated successfully",
  accessToken
});

} catch (err) {

res.status(401).json({ message: err.message });

}

};

module.exports = { register, login, refresh };