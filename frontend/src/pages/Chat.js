import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import socket from "../socket";
import { apiRequest } from "../utils/authManager"; // ✅ ADDED
import "./Chat.css";

function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const [showProfile, setShowProfile] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // 🔥 ADDED (Optimistic + retry system)
  const [pending, setPending] = useState([]);
  const conversationNameRef = useRef("");

  const currentUserId = localStorage.getItem("currentUserId");

  // تحميل المحادثة + تصفير unread
  useEffect(() => {
    const loadConversation = async () => {

      await apiRequest({
        method: "POST",
        url: `/api/conversations/read/${id}`
      });

      const convos = JSON.parse(localStorage.getItem("conversations")) || [];
      let convInfo = convos.find((c) => String(c.id) === String(id));

      if (convInfo) {
        setConversation(convInfo);
        conversationNameRef.current = convInfo.name || "مستخدم";
      } else {
        try {
          const res = await apiRequest({
            method: "GET",
            url: `/api/users/${id}`
          });
          const user = res.data;
          convInfo = { id, name: user.name || "مستخدم غير معروف" };
          setConversation(convInfo);
          conversationNameRef.current = convInfo.name || "مستخدم";
        } catch {
          setConversation({ id, name: "مستخدم غير معروف" });
          conversationNameRef.current = "مستخدم غير معروف";
        }
      }

      try {
        const res = await apiRequest({
          method: "GET",
          url: `/api/messages/${currentUserId}/${id}`
        });

        const data = res.data;

        if (Array.isArray(data)) {
          const formatted = data.map((msg) => ({
            id: msg._id,
            sender: String(msg.sender) === String(currentUserId) ? "You" : convInfo?.name || "مستخدم",
            text: msg.content,
            timestamp: msg.createdAt,
          }));
          setMessages(formatted);
        }
      } catch (err) {
        console.error("خطأ جلب الرسائل:", err);
      }
    };

    if (id) loadConversation();
  }, [id, currentUserId]);

  // =========================
  // 🔥 SOCKET LISTENERS (NEW)
  // =========================
  useEffect(() => {

    // ✅ ensure socket connected
    if (!socket.connected) {
      socket.connect();
    }

    const onNewMessage = (msg) => {

      const isRelevant =
        (String(msg.sender) === String(currentUserId) && String(msg.receiver) === String(id)) ||
        (String(msg.sender) === String(id) && String(msg.receiver) === String(currentUserId));

      if (isRelevant) {
        setMessages(prev => {
          if (prev.some((m) => String(m.id) === String(msg._id))) return prev;
          return [
            ...prev,
            {
              id: msg._id,
              sender: String(msg.sender) === String(currentUserId) ? "You" : (conversationNameRef.current || "مستخدم"),
              text: msg.content,
              timestamp: msg.createdAt || new Date().toISOString(),
              status: "DELIVERED"
            }
          ];
        });
      }
    };

    const onMessageConfirmed = ({ tempId, message }) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === tempId
            ? {
                id: message._id,
                sender: "You",
                text: message.content,
                timestamp: message.createdAt,
                status: "DELIVERED"
              }
            : msg
        )
      );
      setPending(prev => prev.filter((p) => String(p) !== String(tempId)));
    };

    const onConnectError = () => {
      pending.forEach(id => {
        console.log("retry message", id);
      });
    };

    // ✅ prevent duplicate listeners
    socket.off("newMessage");
    socket.off("messageConfirmed");
    socket.off("connect_error");

    socket.on("newMessage", onNewMessage);
    socket.on("messageConfirmed", onMessageConfirmed);
    socket.on("connect_error", onConnectError);

    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("messageConfirmed", onMessageConfirmed);
      socket.off("connect_error", onConnectError);
    };
  }, [id, currentUserId]); // ✅ FIXED

  useEffect(() => {
    if (conversation?.name) {
      conversationNameRef.current = conversation.name;
    }
  }, [conversation]);

  // =========================
  // SEEN LOGIC (FIXED)
  // =========================
  useEffect(() => {
    const seenIds = new Set();

    messages.forEach(msg => {
      if (
        msg.sender !== "You" &&
        msg.id &&
        !seenIds.has(msg.id)
      ) {
        seenIds.add(msg.id);

        socket.emit("messageSeen", {
          messageId: msg.id,
          chatWith: id
        });
      }
    });
  }, [id, messages]);

  // Scroll تلقائي
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    if (inputRef.current) inputRef.current.focus();
  }, [messages]);

  // =========================
  // OPTIMISTIC UI (UPDATED)
  // =========================
  const handleSend = () => {
    if (!input.trim()) return;

    // ✅ connection guard
    if (!socket.connected) {
      alert("Connection lost. Try again.");
      return;
    }

    const tempId = Date.now();

    const tempMessage = {
      id: tempId,
      sender: "You",
      text: input,
      timestamp: new Date(),
      status: "SENDING"
    };

    setMessages(prev => [...prev, tempMessage]);

    socket.emit("sendMessage", {
      receiver: id,
      content: input,
      chatId: id,
      tempId
    });

    setPending(prev => [...prev, tempId]);

    setInput("");
  };

  if (!conversation) {
    return (
      <div className="chat-container">
        <p>المحادثة غير موجودة</p>
        <button onClick={() => navigate("/messages")}>رجوع</button>
      </div>
    );
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="chat-page" dir="rtl" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {showProfile && (
        <div className="profile-overlay">
          <button onClick={() => setShowProfile(false)}>×</button>
          <div className="profile-box">
            <div className="big-avatar">{conversation.name.charAt(0).toUpperCase()}</div>
            <h2>{conversation.name}</h2>
          </div>
        </div>
      )}

      <div className="chat-header">
        <button onClick={() => navigate("/messages")}>←</button>
        <div className="header-info" onClick={() => setShowProfile(true)}>
          <div className="avatar">{conversation.name.charAt(0).toUpperCase()}</div>
          <h3>{conversation.name}</h3>
        </div>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: "auto", padding: "10px", background: "#11111b" }}>
        {messages.length === 0 ? (
          <div className="empty-chat">ابدأ المحادثة الآن ✨</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`bubble ${msg.sender === "You" ? "sent" : "received"}`}
              style={{
                background: "#3b1d6b",
                color: "white",
                maxWidth: "70%",
                margin: "8px",
                padding: "12px 16px",
                borderRadius: "18px",
                alignSelf: msg.sender === "You" ? "flex-end" : "flex-start",
              }}
            >
              <div>{msg.text}</div>
              <span style={{ fontSize: "11px", opacity: 0.7, marginTop: "4px", display: "block" }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
          ))
        )}
        <div ref={chatEndRef}></div>
      </div>

      <div className="chat-input" style={{ padding: "10px 16px", background: "#0c0c14", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="اكتب رسالتك..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "25px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(35,35,55,0.6)",
            color: "#F4F4F5",
            outline: "none",
            fontSize: "16px",
          }}
        />
        <button
          onClick={handleSend}
          style={{
            padding: "12px 20px",
            background: "#6b46c1",
            color: "#F4F4F5",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "18px",
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default Chat;