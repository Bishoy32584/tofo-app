import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setAccessToken, notifySocket, apiRequest } from "../utils/authManager";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError(null);

    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    try {
      const cleanEmail = email.trim();
      const cleanPassword = password.trim();

      const res = await apiRequest({
        method: "POST",
        url: "/api/auth/login",
        data: { email: cleanEmail, password: cleanPassword }
      });

      const data = res.data;

      setAccessToken(data.accessToken);

      notifySocket();

      localStorage.setItem("currentUserId", data.userId);

      navigate("/onboarding");

    } catch (err) {
      setError(err.response?.data?.message || err.message);
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