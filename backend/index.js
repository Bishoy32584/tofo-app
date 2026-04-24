require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Routes
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

//  Service
const NotificationService = require("./services/NotificationService");

const app = express();

// ========================
// Middleware
// ========================
const CLIENT_URL = process.env.CLIENT_URL || "https://tofo-app-1aok-git-main-b85892710-3254s-projects.vercel.app";

app.use(cors({
  origin: CLIENT_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ========================
// Routes
// ========================
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// ========================
// Test Route
// ========================
app.get("/", (req, res) => {
  res.send("TOFO Backend Running ✅");
});

// ========================
// MongoDB Connection
// ========================
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch(err => {
    console.error("❌ MongoDB Error:", err.message);
  });

// ========================
// Server + Socket.io
// ========================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true
  }
});

// ربط Socket بالـ NotificationService
NotificationService.setSocketIO(io);

// Socket Logic
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // استلام userId من الفرونت
  socket.on("register", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// ========================
// Start Server
// ========================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on PORT: ${PORT}`);
});