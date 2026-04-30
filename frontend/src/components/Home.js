import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import socket from "../socket"; // ✅ رجعناه
import { apiRequest } from "../utils/authManager";

import PostCard from "../components/PostCard";

const moods = [
  { text: "زهق", emoji: "😐" },
  { text: "سعادة", emoji: "😊" },
  { text: "ضغط", emoji: "😓" },
  { text: "حماس", emoji: "🔥" },
  { text: "حيرة", emoji: "🤷‍♂️" }
];

const API = "https://tofo-app-production.up.railway.app";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [myPost, setMyPost] = useState("");
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const senderId = localStorage.getItem("currentUserId");

  useEffect(() => {
    if (!images.length) {
      setPreviewUrls([]);
      return;
    }
    const urls = images.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [images]);

  const getUserId = (user) => {
    if (!user) return null;
    if (typeof user === "string") return user;
    return user._id;
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({ text: post.content || "" });
    } else {
      navigator.clipboard.writeText(post.content || "");
      alert("تم النسخ");
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);

      const res = await apiRequest({
        method: "GET",
        url: `${API}/api/posts/feed`,
      });

      const mapped = res.data.map((msg) => ({
        ...msg,
        mood: msg.mood || moods[0],
      }));

      setPosts(mapped);

    } catch (err) {
      console.error("Fetch posts error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    let timeoutId = null;
    let lastFetch = 0;

    const handler = (event) => {
      const { action } = event.detail || {};

      if (action === "impression" || action === "view") return;

      if (action === "hug" || action === "new-post") {
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
          const now = Date.now();
          if (now - lastFetch < 5000) return;

          lastFetch = now;
          fetchPosts();

        }, 3000);
      }
    };

    window.addEventListener("feed-update", handler);

    return () => window.removeEventListener("feed-update", handler);
  }, []);

  const sendPost = async () => {
    const text = (myPost ?? "").trim();
    const hasImages = images.length > 0;
    if (!text && !hasImages) return;

    const badWords = ["sex", "xxx", "porn", "nude"];

    if (text) {
      for (let word of badWords) {
        if (text.toLowerCase().includes(word)) {
          alert("المحتوى غير مناسب");
          return;
        }
      }
    }

    try {
      const formData = new FormData();
      formData.append("content", text);
      formData.append("mood", selectedMood.text);
      formData.append("isAnonymous", isAnonymous);

      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }

      await apiRequest({
        method: "POST",
        url: `${API}/api/posts`,
        data: formData
      });

      setMyPost("");
      setImages([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsAnonymous(false);
      setSelectedMood(moods[0]);

      fetchPosts();

    } catch (err) {
      console.error("Send post error:", err);
    }
  };

  const handleHug = async (id) => {
    try {
      await apiRequest({
        method: "POST",
        url: `${API}/api/posts/hug`,
        data: { postId: id }
      });

      setPosts(prev =>
        prev.map(p =>
          p._id === id
            ? {
                ...p,
                stats: {
                  ...p.stats,
                  hugs: (p.stats?.hugs || 0) + 1
                }
              }
            : p
        )
      );

    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const res = await apiRequest({
        method: "DELETE",
        url: `${API}/api/posts/${postId}`
      });

      if (res.data?.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch (err) {
      console.error("Delete post error:", err);
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="home-container">

      <div className="post-composer">

        <textarea
          className="composer-input"
          placeholder="شارك شعورك..."
          value={myPost}
          onChange={(e) => setMyPost(e.target.value)}
        />

        <div className="anonymous-toggle">
          <span className="hat-icon">🎭</span>
          <span className="anonymous-text">نشر كمجهول</span>

          <label className="switch">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={() => setIsAnonymous(!isAnonymous)}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="file-upload-wrapper">
          <label className="upload-btn">
            رفع صورة
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const list = e.target.files;
                setImages(list && list.length ? Array.from(list) : []);
              }}
            />
          </label>
        </div>

        {previewUrls.length > 0 ? (
          <div className="composer-preview-row">
            {previewUrls.map((url, idx) => (
              <img
                key={url}
                className="composer-preview-thumb"
                src={url}
                alt=""
              />
            ))}
          </div>
        ) : null}

        <button
          className="post-btn"
          onClick={sendPost}
        >
          نشر
        </button>

      </div>

      <div className="feed">
        {loading ? (
          <div>جاري التحميل...</div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              timeAgo={(d) =>
                Math.floor((Date.now() - new Date(d)) / 60000) + " دقيقة"
              }
              handleHug={handleHug}
              handleShare={handleShare}
              getUserId={getUserId}
              currentUserId={senderId}
              onDelete={handleDeletePost}
              senderId={senderId}
              socket={socket} // ✅ ده التعديل التاني
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
