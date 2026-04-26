const os = require("os");

console.log("🧠 CPU cores:", os.cpus().length);
console.log("🧠 Total RAM (MB):", Math.round(os.totalmem() / 1024 / 1024));
console.log("🧠 Free RAM (MB):", Math.round(os.freemem() / 1024 / 1024));
console.log("🧠 Platform:", os.platform());

const dns = require("node:dns/promises");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

// Routes
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const authRoutes = require("./modules/auth/auth.routes");
const postRoutes = require("./routes/postRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

// ✅ ADDED ONLY
const onboardingRoutes = require("./routes/onboardingRoutes");

// Models & Services
const Message = require("./models/Message");
const NotificationService = require("./services/NotificationService");
const Conversation = require("./models/Conversation");

// 🔥 NEW: cleanup job
const cleanupOrphans = require("./cleanup");

// =====================
// REQUIRED ADDITION ONLY
// =====================
const Post = require("./models/Post");

// Redis cache (existing)
const cache = require("./redisClient");

const app = express();

console.log("SERVER FILE VERSION: REALTIME + MONGO ACTIVE");

const PORT = process.env.PORT || 5000;

// 🔹 CORS (✅ التعديل الوحيد هنا فقط)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://tofo-app-1aok.vercel.app",
    "https://tofo-app-1aok-git-main-b85892710-3254s-projects.vercel.app",
    "https://tofo-app-inky.vercel.app"
  ],
  credentials: true
}));

app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf.toString("utf8"); } }));

// =========================
// 🔥 LOAD GUARD
// =========================
const MAX_ACTIVE_USERS = 300;

app.use(async (req, res, next) => {
  try {
    const current = await cache.incr("active_requests");

    if (current === 1) {
      await cache.expire("active_requests", 5);
    }

    if (current > MAX_ACTIVE_USERS) {
      await cache.decr("active_requests");

      return res.status(503).json({
        message: "OVERLOAD"
      });
    }

    res.on("finish", async () => {
      await cache.decr("active_requests");
    });

    next();

  } catch (err) {
    console.error("Load guard error:", err);
    next();
  }
});

app.use(cookieParser());
app.use(helmet());

// =========================
// STATIC FILES
// =========================
app.use("/uploads", express.static("uploads"));

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 50,
  message: "Too many requests from this IP, please try again later."
});

app.use("/api/", apiLimiter);

// =================
// API Routes
// =================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/conversations", conversationRoutes);

// ✅ ADDED ONLY
app.use("/api/onboarding", onboardingRoutes);

// =================
// Root
// =================
app.get("/", (req, res) => {
  res.send("ROOT WORKING FROM SERVER.JS");
});

// =================
// 404
// =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// =================
// Error handler
// =================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
});

// =================
// HTTP SERVER
// =================
const server = http.createServer(app);

// =================
// SOCKET.IO (NO REDIS ADAPTER)
// =================
const io = new Server(server, {
  cors: { origin: process.env.SOCKET_ORIGIN || "*" }
});

NotificationService.setSocketIO(io);

// =================
// Socket Auth
// =================
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("Authentication error: No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.userId = decoded.id;
    next();

  } catch (err) {
    return next(new Error("Authentication error: " + err.message));
  }
});

// =================
// SOCKET LOGIC
// =================
io.on("connection", (socket) => {

  if (socket.userId) {
    socket.join(socket.userId);
  }

  socket.on("sendMessage", async ({ receiver, content, chatId, tempId }) => {
    try {
      const sender = socket.userId;

      const message = new Message({
        sender,
        receiver,
        content,
        status: "SENT"
      });

      const saved = await message.save();

      const participants = [sender, receiver].sort();

      let conversation = await Conversation.findOne({
        participants: { $all: participants }
      });

      if (!conversation) {
        conversation = new Conversation({ participants, unread: {} });
      }

      conversation.lastMessage = content;
      conversation.lastMessageAt = new Date();

      await conversation.save();

      io.to(sender).emit("messageConfirmed", {
        tempId,
        message: saved
      });

      io.to(receiver).emit("newMessage", saved);

    } catch (err) {
      console.error(err);
    }
  });

  socket.on("messageDelivered", async ({ messageId }) => {
    await Message.findByIdAndUpdate(messageId, {
      status: "DELIVERED",
      deliveredAt: new Date()
    });
  });

  socket.on("messageSeen", async ({ messageId, chatWith }) => {
    await Message.findByIdAndUpdate(messageId, {
      status: "SEEN",
      seenAt: new Date(),
      read: true
    });

    io.to(chatWith).emit("messageSeenAck", { messageId });
  });

  socket.on("disconnect", () => {});
});

// =================
// Cleanup
// =================
setInterval(async () => {
  try {
    await cleanupOrphans();
  } catch (e) {
    console.error("Cleanup failed:", e.message);
  }
}, 60 * 60 * 1000);

// =================
setInterval(() => {
  console.log("🧪 TEST: server is alive at", new Date().toISOString());
}, 5000);

// =================
// MongoDB
// =================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "TOFO",
      serverSelectionTimeoutMS: 5000,
      family: 4
    });

    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    console.log("📡 Mongo Latency:", Date.now() - start, "ms");

    server.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );

  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

connectDB();