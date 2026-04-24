import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import { AiOutlineHome } from "react-icons/ai";
import { FiMessageCircle } from "react-icons/fi";
import { IoNotificationsOutline } from "react-icons/io5";

function MainLayout({ notifications: propNotifications }) {

  const navigate = useNavigate();
  const location = useLocation();

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // -----------------------------
  // حساب unreadNotifications من propNotifications
  // -----------------------------
  useEffect(() => {
    const unread = propNotifications.filter(n => !n.read).length;
    setUnreadNotifications(unread);
  }, [propNotifications]);

  // -----------------------------
  // حساب عدد الرسائل غير المقروءة من السيرفر
  // -----------------------------
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("https://tofo-app-production.up.railway.app/api/conversations", {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("accessToken")
          }
        });

        const data = await res.json();

        const userId = localStorage.getItem("currentUserId");

        let total = 0;

        data.forEach(conv => {
          total += conv.unread?.[userId] || 0;
        });

        setUnreadMessages(total);

      } catch (err) {
        console.error("Unread fetch error:", err);
      }
    };

    fetchUnread();
  }, [location.pathname]);

  // -----------------------------
  // PATCH mark-read عند دخول صفحة /notifications
  // -----------------------------
  useEffect(() => {
    if (location.pathname === "/notifications") {
      fetch("https://tofo-app-production.up.railway.app/api/notifications/mark-read", {
        method: "PATCH",
        headers: { Authorization: "Bearer " + localStorage.getItem("accessToken") }
      })
        .then(res => res.json())
        .then(data => {
          console.log("✅ Mark notifications as read:", data);
          setUnreadNotifications(0);
        })
        .catch(err => console.error("❌ Mark notifications failed", err));
    }
  }, [location.pathname]);

  return (
    <div style={{ paddingBottom: "65px" }}>
      <Outlet />

      {/* Bottom Navigation */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "65px",
          background: "#1a1a2e",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderTop: "1px solid #333",
          zIndex: 100
        }}
      >
        {/* HOME */}
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "white", fontSize: "26px", position: "relative", cursor: "pointer" }}>
          <AiOutlineHome />
        </button>

        {/* MESSAGES */}
        <button onClick={() => navigate("/messages")} style={{ background: "none", border: "none", color: "white", fontSize: "26px", position: "relative", cursor: "pointer" }}>
          <FiMessageCircle />
          {unreadMessages > 0 && (
            <span style={{ position: "absolute", top: "-6px", right: "-10px", background: "red", color: "white", borderRadius: "50%", padding: "3px 7px", fontSize: "11px", fontWeight: "bold" }}>
              {unreadMessages}
            </span>
          )}
        </button>

        {/* NOTIFICATIONS */}
        <button onClick={() => navigate("/notifications")} style={{ background: "none", border: "none", color: "white", fontSize: "26px", position: "relative", cursor: "pointer" }}>
          <IoNotificationsOutline />
          {unreadNotifications > 0 && (
            <span style={{ position: "absolute", top: "-6px", right: "-10px", background: "red", color: "white", borderRadius: "50%", padding: "3px 7px", fontSize: "11px", fontWeight: "bold" }}>
              {unreadNotifications}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default MainLayout;