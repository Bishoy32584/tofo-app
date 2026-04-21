import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, notifySocket } from "../utils/authManager"; // ✅ إضافة notifySocket فقط

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);

    // ✅ سطرين الاختبار فقط
    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    try {
      // ✅ التعديل الوحيد: تنظيف القيم من المسافات
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "خطأ في تسجيل الدخول");
      }

      setAccessToken(data.accessToken);

      notifySocket();

      localStorage.setItem("currentUserId", data.userId);

      navigate("/onboarding");

    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center" }}>
      <h2>تسجيل الدخول</h2>

      <input
        type="email"
        placeholder="البريد الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "10px 0" }}
      />

      <input
        type="password"
        placeholder="كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px", margin: "10px 0" }}
      />

      <button onClick={handleLogin} style={{ padding: "10px 20px", marginTop: "10px" }}>
        تسجيل الدخول
      </button>

      {/* ✅ ADDED ONLY (UX link to register) */}
      <p
        onClick={() => navigate("/register")}
        style={{ cursor: "pointer", marginTop: "15px", color: "#007bff" }}
      >
        إنشاء حساب جديد
      </p>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}
    </div>
  );
}

export default Login;