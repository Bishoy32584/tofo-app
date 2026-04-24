// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Notifications from "./pages/Notifications";
import MainLayout from "./components/MainLayout";
import { ChatProvider } from "./context/ChatContext";
import "./App.css";

import { useEffect, useState } from "react";
import socket from "./socket";
import { apiRequest } from "./utils/authManager";
import Login from "./pages/Login";
import { setAccessToken, getAccessToken } from "./utils/authManager";

// ✅ STEP 5 — إضافة i18n (فقط إضافة)
import { getTranslations } from "./i18n";

// ✅ ADDED ONLY
import OnboardingMood from "./pages/OnboardingMood";

// ✅ ADDED ONLY (Register page)
import Register from "./pages/Register";

function App() {

  // ✅ STEP 1 + STEP 2 (الإضافة الوحيدة)
  const userLang = navigator.language || navigator.userLanguage;
  const lang = userLang.startsWith("ar") ? "ar" : "en";

  // ❌ تم حذف المتغير t لأنه غير مستخدم

  // ✅ STEP 7 — RTL support
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  console.log("VAPID KEY:", process.env.REACT_APP_VAPID_PUBLIC_KEY);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ✅ إضافة state جديد
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAccessToken());

  useEffect(() => {
    console.log("🚀 App started");

    const handleAuthChange = () => {
      setIsAuthenticated(!!getAccessToken());
    };

    window.addEventListener("authChanged", handleAuthChange);

    const initAuthAndSocket = async () => {
      try {
        const res = await apiRequest({
          method: "POST",
          url: "/api/auth/refresh-token"
        });

        if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);
          console.log("🔄 Access token refreshed");

          socket.auth = { token: res.data.accessToken };

          socket.connect();
          console.log("✅ Socket connected with token");
        }

      } catch (err) {
        console.log("❌ Refresh token failed");
      }
    };

    initAuthAndSocket();

    socket.on("connect", () => {
      console.log("🟢 Connected to Socket.io Server:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.log("❌ Socket Connection Error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected from Socket.io Server:", reason);
    });

    socket.on("newNotification", (data) => {
      console.log("🔥 NEW NOTIFICATION:", data);

      setNotifications((prev) => [data, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    const refreshInterval = setInterval(async () => {
      try {
        const res = await apiRequest({
          method: "POST",
          url: "/api/auth/refresh-token"
        });

        if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);

          socket.auth = { token: res.data.accessToken };
          socket.disconnect().connect();
        }

      } catch (err) {
        console.log("❌ Auto refresh failed");
      }
    }, 10 * 60 * 1000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => {
          console.log('✅ Service Worker registered:', reg);
          subscribeUser().catch(err => console.error("❌ Subscription failed:", err));
        })
        .catch(err => console.error('❌ SW registration failed:', err));
    }

    async function subscribeUser() {
      const reg = await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
      });

      await apiRequest({
        method: "POST",
        url: "/api/notifications/subscribe",
        data: sub
      });
    }

    window.subscribeUser = subscribeUser;

    function urlBase64ToUint8Array(base64String) {
      const padding = '='.repeat((4 - base64String.length % 4) % 4);
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
    }

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      socket.off("newNotification");
      socket.disconnect();
      clearInterval(refreshInterval);
    };

  }, []);

  return (
    <ChatProvider>
      <Router>

        <button
          onClick={async () => {
            const permission = await Notification.requestPermission();
            console.log("PERMISSION:", permission);
          }}
          style={{ position: "fixed", top: 10, right: 10, zIndex: 1000 }}
        >
          Enable Notifications
        </button>

        <Routes>

          {!isAuthenticated ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Login />} />
            </>
          ) : (
            <>
              <Route element={
                <MainLayout
                  notifications={notifications}
                  unreadCount={unreadCount}
                />
              }>
                <Route path="/" element={<Home />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/notifications" element={
                  <Notifications notifications={notifications} />
                } />

                {/* ✅ ADDED ONLY */}
                <Route path="/onboarding" element={<OnboardingMood />} />

              </Route>

              <Route path="/chat/:id" element={<Chat />} />
            </>
          )}

        </Routes>
      </Router>
    </ChatProvider>
  );
}

export default App;