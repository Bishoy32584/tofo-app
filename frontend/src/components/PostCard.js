import React, { useEffect, useRef } from "react";
import { apiRequest } from "../utils/authManager";

const MEDIA_BASE = "https://tofo-app-production.up.railway.app";

function resolvePostImageUrl(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const normalized = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${MEDIA_BASE.replace(/\/+$/, "")}/${normalized}`;
}

const PostCard = ({ post, timeAgo, handleHug, handleShare, getUserId, senderId, socket }) => {

  const userId = getUserId(post.user);

  const postRef = useRef(null);
  const sentRef = useRef(false);

  // ✅ إضافة الحماية الجديدة
  const requestLock = useRef(false);

  const viewStartRef = useRef(null);
  const hasSentViewRef = useRef(false);

  // ✅ NEW
  const impressionSentRef = useRef(false);

  useEffect(() => {
    const element = postRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {

          if (!sentRef.current && !requestLock.current && !impressionSentRef.current) {
            sentRef.current = true;
            requestLock.current = true;

            if (!post?._id) return;

            apiRequest({
              method: "POST",
              url: `/api/posts/impression`,
              data: { postId: post._id }
            }).finally(() => {
              requestLock.current = false;
              impressionSentRef.current = true;
            }).catch((err) => {
              if (process.env.NODE_ENV === "development") {
                console.log("View Error:", err.message);
              }
            });
          }

          if (!viewStartRef.current) {
            viewStartRef.current = Date.now();
          }
        }

        if (!entry.isIntersecting) {

          if (viewStartRef.current && !hasSentViewRef.current) {

            const duration = (Date.now() - viewStartRef.current) / 1000;

            if (duration < 1) return;

            hasSentViewRef.current = true;

            if (!post?._id) return;

            apiRequest({
              method: "POST",
              url: `/api/posts/view`,
              data: {
                postId: post._id,
                duration
              }
            }).catch((err) => {
              if (process.env.NODE_ENV === "development") {
                console.log("View Error:", err.message);
              }
            });
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);

      if (viewStartRef.current && !hasSentViewRef.current) {

        const duration = (Date.now() - viewStartRef.current) / 1000;

        if (duration < 1) return;

        hasSentViewRef.current = true;

        if (!post?._id) return;

        apiRequest({
          method: "POST",
          url: `/api/posts/view`,
          data: {
            postId: post._id,
            duration
          }
        }).catch((err) => {
          if (process.env.NODE_ENV === "development") {
            console.log("View Error:", err.message);
          }
        });
      }
    };

  }, [post._id]);

  // ✅ التعديل الوحيد
  if (post.isExplicit) {
    return <div>🚫 هذا المحتوى غير متاح</div>;
  }

  return (
    <div ref={postRef} className="post-card">

      <div className="post-header">
        <span className="mood-emoji small">{post.mood?.emoji || "😐"}</span>
        <img className="avatar" src={`https://i.pravatar.cc/48?u=${post._id}`} alt="" />

        <div className="user-info-right">
          <h4>{post.isAnonymous ? "مجهول" : post.user?.name || "مستخدم"}</h4>
          <span className="time">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {post.content ? (
        <p className="post-content">{post.content}</p>
      ) : null}

      {Array.isArray(post.images) && post.images.length > 0 ? (
        <div className="post-image-gallery">
          {post.images.map((src, idx) => {
            const url = resolvePostImageUrl(src);
            if (!url) return null;
            return (
              <img
                key={`${post._id}-img-${idx}`}
                className="post-gallery-img"
                src={url}
                alt=""
              />
            );
          })}
        </div>
      ) : null}

      <div className="post-actions">

        <button
          className="send-message-btn"
          onClick={async () => {
            const text = prompt("اكتب رسالتك:");
            if (!text || !userId) return;

            await apiRequest({
              method: "POST",
              url: `/api/messages`,
              data: {
                sender: senderId,
                receiver: userId,
                content: text
              }
            });

            socket.emit("sendMessage", {
              sender: senderId,
              receiver: userId,
              content: text,
              chatId: userId
            });

            alert("تم إرسال الرسالة");
          }}
        >
          إرسال رسالة
        </button>

        <button className="action-btn" onClick={() => handleHug(post._id)}>🫂</button>
        <button className="action-btn" onClick={() => handleShare(post)}>📤</button>

      </div>

    </div>
  );
};

export default PostCard;