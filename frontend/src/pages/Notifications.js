import React, { useEffect, useState } from "react";

function Notifications({ notifications: propNotifications }) {

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // 🔹 مزامنة state من App.js
    setNotifications(propNotifications);
  }, [propNotifications]);

  // -----------------------------
  // UI + click behavior
  // -----------------------------
  const handleClick = (n) => {
    if (n.type === "message" && n.chatId) {
      // ⚡ افتح الشات مع chatId الصحيح
      window.location.href = `/chat/${n.chatId}`;
    }

    // ✅ علامة كـ read + تحديث الـ UI
    setNotifications(prev =>
      prev.map(item =>
        item._id === n._id ? { ...item, read: true } : item
      )
    );

    // ⚡ لو عايزين ممكن هنا نرسل update للـ backend لتخزين read = true
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