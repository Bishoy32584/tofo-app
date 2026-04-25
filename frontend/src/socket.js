// src/socket.js

import { io } from "socket.io-client";

const SOCKET_URL = "https://tofo-app-production.up.railway.app";

// قراءة التوكن من localStorage
const socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: {
    token: localStorage.getItem("accessToken")
  }
});

// 🟢 NEW (after login)
export const connectSocket = () => {
  socket.auth = { token: localStorage.getItem("accessToken") };
  socket.connect();
};

export default socket;