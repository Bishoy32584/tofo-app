import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/authManager";

const moods = [
  { key: "happy", label: "سعيد 😊" },
  { key: "sad", label: "حزين 😢" },
  { key: "anxious", label: "قلقان 😰" },
  { key: "bored", label: "ملل 😐" },
  { key: "calm", label: "هادئ 😌" },
  { key: "tired", label: "متعب 😴" },
  { key: "angry", label: "غاضب 😡" },
  { key: "excited", label: "متحمس 🤩" }
];

export default function OnboardingMood() {
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const sendMood = async (mood, skipped = false) => {
    setLoading(true);

    await apiRequest({
      method: "POST",
      url: "/api/onboarding/mood",
      data: { mood, skipped }
    });

    navigate("/");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>قبل أن نبدأ، كيف تشعر الآن؟</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {moods.map((m) => (
          <button
            key={m.key}
            onClick={() => sendMood(m.key)}
            style={{ padding: 20, fontSize: 16 }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => sendMood(null, true)}
        style={{ marginTop: 20 }}
      >
        Skip for now
      </button>

      {loading && <p>Loading...</p>}
    </div>
  );
}