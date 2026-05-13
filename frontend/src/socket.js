import { io } from "socket.io-client";

const SOCKET_URL = "https://tofo-app-production.up.railway.app";

// 🟢 Socket.IO fix (unchanged logic, فقط إضافة credentials + تحسين stability)
const socket = io(SOCKET_URL, {
  cors: corsOptions
});

// 🟢 NEW (after login)
export const connectSocket = () => {
  socket.auth = { token: localStorage.getItem("accessToken") };
  socket.connect();
};

export default socket;