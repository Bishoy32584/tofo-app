const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  try {

    console.log("---- AUTH DEBUG ----");
    console.log("Authorization Header:", req.headers.authorization);
    console.log("Cookies:", req.cookies);

    const authHeader = req.headers.authorization;
    console.log("🔹 AUTH HEADER:", authHeader);

    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ NO AUTH HEADER");
      return res.status(401).json({
        message: "No token provided"
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔹 TOKEN:", token);

    if (!token) {
      console.log("❌ TOKEN FORMAT WRONG");
      return res.status(401).json({
        message: "Invalid token format"
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("✅ DECODED:", decoded);

    // ✅ توحيد الـ auth shape
    req.userId = decoded.id;
    req.user = decoded;

    next();

  } catch (err) {

    console.log("❌ JWT ERROR:", err.message);

    return res.status(401).json({
      message: "Unauthorized"
    });
  }
};

module.exports = authenticate;