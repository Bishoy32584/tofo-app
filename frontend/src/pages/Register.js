import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/authManager";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mood, setMood] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async () => {
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanMood = mood.trim();

    if (!cleanName || !cleanEmail || !cleanPassword || !cleanMood) {
      setError("Name, email, password, and mood are required");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("name", cleanName);
      formData.append("email", cleanEmail);
      formData.append("password", cleanPassword);
      formData.append("mood", cleanMood);

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      console.log("Register FormData entries:", [...formData.entries()]);

      const res = await apiRequest({
        method: "POST",
        url: "/api/auth/register",
        data: formData
        // axios will set boundary automatically
      });

      const data = res.data;

      navigate("/login");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", textAlign: "center" }}>
      <h2>إنشاء حساب</h2>

      <input
        type="text"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "10px 0" }}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "10px 0" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "10px 0" }}
      />

      <input
        type="text"
        placeholder="Mood"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
        style={{ width: "100%", padding: 10, margin: "10px 0" }}
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setProfileImage(e.target.files[0])}
        style={{ margin: "10px 0" }}
      />

      <button
        onClick={handleRegister}
        disabled={loading}
        style={{ padding: "10px 20px", marginTop: 10, color: "#F4F4F5", background: "#6b46c1", border: "none", borderRadius: "8px" }}
      >
        {loading ? "Creating..." : "Register"}
      </button>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
    </div>
  );
}

export default Register;