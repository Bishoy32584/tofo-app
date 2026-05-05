import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/authManager"; // ✅ إضافة

function Notifications({ notifications: propNotifications }) {

  const [notifications, setNotifications] = useState([]);

  // ✅ جلب الـ notifications من الـ DB عند أول render
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiRequest({
          method: "GET",
          url: "/api/notifications"
        });
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        }
      } catch (err) {
        console.error("Fetch notifications error:", err);
      }
    };

    fetchNotifications();
  }, []);

  // ✅ مزامنة الـ real-time notifications من App.js
  useEffect(() => {
    if (propNotifications?.length > 0) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n._id));
        const newOnes = propNotifications.filter(n => !existingIds.has(n._id));
        return [...newOnes, ...prev];
      });
    }
  }, [propNotifications]);

  // ✅ mark-read في الـ DB + تحديث الـ UI
  const handleClick = async (n) => {
    if (n.type === "message" && n.chatId) {
      window.location.href = `/chat/${n.chatId}`;
    }

    // ✅ تحديث الـ UI فوراً
    setNotifications(prev =>
      prev.map(item =>
        item._id === n._id ? { ...item, read: true } : item
      )
    );

    // ✅ حفظ في الـ DB
    try {
      await apiRequest({
        method: "PATCH",
        url: "/api/notifications/mark-read"
      });
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center" }}>الإشعارات</h2>

      {notifications.length === 0 ? (
        <p style={{ textAlign: "center" }}>لا توجد إشعارات</p>
      ) : (
        <div>
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => handleClick(n)}
              style={{
                background: n.read ? "#222" : "#2e2e4d",
                color: "white",
                padding: "12px",
                marginBottom: "10px",
                borderRadius: "10px",
                cursor: "pointer"
              }}
            >
              <p style={{ margin: 0 }}>{n.message}</p>
              <small style={{ opacity: 0.7 }}>
                {new Date(n.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;