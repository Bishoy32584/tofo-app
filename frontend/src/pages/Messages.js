import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/authManager";
import socket from "../socket";
import "./Messages.css";

function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = localStorage.getItem("currentUserId");

  const upsertConversationFromMessage = (msg) => {
    const otherUserId =
      String(msg.sender) === String(currentUserId)
        ? String(msg.receiver)
        : String(msg.sender);

    setConversations((prev) => {
      const existing = prev.find((c) => String(c.id) === otherUserId);
      const nextItem = existing
        ? {
            ...existing,
            lastMessage: msg.content,
            timestamp: msg.createdAt || new Date().toISOString(),
            unread:
              String(msg.receiver) === String(currentUserId)
                ? (existing.unread || 0) + 1
                : 0
          }
        : {
            id: otherUserId,
            name: "مستخدم",
            lastMessage: msg.content,
            timestamp: msg.createdAt || new Date().toISOString(),
            unread: String(msg.receiver) === String(currentUserId) ? 1 : 0
          };

      const withoutExisting = prev.filter((c) => String(c.id) !== otherUserId);
      return [nextItem, ...withoutExisting];
    });
  };

  useEffect(() => {

    // ✅ ensure socket connected
    if (!socket.connected) {
      socket.connect();
    }

    const fetchConversations = async () => {
      try {
        const res = await apiRequest({
          method: "GET",
          url: "/api/conversations"
        });

        const data = res.data;

        if (Array.isArray(data)) {
          const formatted = data.map((conv) => {
            const otherUser = conv.participants?.find(
              (p) => p._id !== localStorage.getItem("currentUserId")
            );

            return {
              id: otherUser?._id,
              name: otherUser?.name || "مستخدم غير معروف",
              lastMessage: conv.lastMessage,
              timestamp: conv.lastMessageAt,
              unread: conv.unread?.get(localStorage.getItem("currentUserId")) || 0,
            };
          });

          const sorted = formatted.sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const timeB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return timeB - timeA;
          });

          setConversations(sorted);
        } else {
          setConversations([]);
        }
      } catch (err) {
        console.error("Fetch conversations error:", err);
        setConversations([]);
      }

      setLoading(false);
    };

    fetchConversations();
  }, []);

  useEffect(() => {
    const onNewMessage = (msg) => {
      upsertConversationFromMessage(msg);
    };

    const onMessageConfirmed = ({ message }) => {
      if (message) {
        upsertConversationFromMessage(message);
      }
    };

    socket.on("newMessage", onNewMessage);
    socket.on("messageConfirmed", onMessageConfirmed);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messageConfirmed", onMessageConfirmed);
    };
  }, [currentUserId]);

  if (loading) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <div className="messages-page" dir="rtl">
      <h2>المحادثات</h2>

      {conversations.length === 0 ? (
        <div className="empty-state">
          <p>لا توجد محادثات بعد</p>
          <p>ابدأ محادثة جديدة من الصفحة الرئيسية</p>
        </div>
      ) : (
        <div className="conversations-list">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="conversation-item"
              onClick={() => navigate(`/chat/${conv.id}`)}
              style={{
                cursor: "pointer",
                padding: "15px",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <div
                className="avatar"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "#6b46c1",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  fontWeight: "bold",
                }}
              >
                {conv.name?.charAt(0) || "?"}
              </div>

              <div className="info" style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "18px" }}>
                  {conv.name || "مستخدم غير معروف"}
                </h3>
                <p
                  className="last-message"
                  style={{ margin: "5px 0 0", color: "#666", fontSize: "14px" }}
                >
                  {conv.lastMessage || "لا توجد رسائل"}
                </p>
              </div>

              <div
                className="time"
                style={{ color: "#999", fontSize: "12px", textAlign: "right" }}
              >
                {conv.timestamp
                  ? new Date(conv.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Messages;