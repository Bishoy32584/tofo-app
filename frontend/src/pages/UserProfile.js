import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

function UserProfile() {
  const navigate = useNavigate();

  return (
    <div className="profile-container">
      <div className="profile-header">
        <button onClick={() => navigate(-1)} className="back-btn">←</button>
        <h2>ملف المستخدم</h2>
      </div>

      <div className="profile-avatar">
        <div className="avatar">A</div> {/* ممكن تحط صورة */}
        <span className="online-dot"></span>
      </div>

      <div className="profile-options">
        <button className="option-btn warning">⚠️ إبلاغ</button>
        <button className="option-btn block">🚫 حظر</button>
        <button className="option-btn change-bg">🎨 تغيير الخلفية</button>
      </div>
    </div>
  );
}

export default UserProfile;