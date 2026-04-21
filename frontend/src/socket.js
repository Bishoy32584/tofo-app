// src/socket.js

import { io } from "socket.io-client";
import { getAccessToken } from "./utils/authManager"; // ✅ التعديل

const SOCKET_URL = "http://localhost:5000";

// قراءة التوكن من authManager بدل localStorage
const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: getAccessToken()
  }
});

// 🟢 NEW (after login)
export const connectSocket = () => {
  socket.auth = { token: getAccessToken() };
  socket.connect();
};

export default socket;