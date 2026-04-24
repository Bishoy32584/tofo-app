const axios = require("axios");

const API =
  process.env.NODE_ENV === "production"
    ? "https://tofo-app-production.up.railway.app/api"
    : "http://localhost:5000/api";

const TOKEN = process.env.TOKEN;

const api = axios.create({
  baseURL: API,
  headers: {
    Authorization: `Bearer ${TOKEN}`
  }
});

const runSeed = async () => {
  try {

    console.log("🚀 Seeding started...");

    // 1️⃣ هات كل البوستات
    const res = await api.get("/posts");
    const posts = res.data;

    console.log(`📊 Found ${posts.length} posts`);

    // 2️⃣ لف عليهم
    for (let post of posts) {

      // 🟢 Views
      const viewsCount = Math.floor(Math.random() * 5) + 1;

      for (let i = 0; i < viewsCount; i++) {
        try {
          await api.post("/posts/view", { postId: post._id });
        } catch (e) {}
      }

      // 🟢 Hugs
      const hugsCount = Math.floor(Math.random() * 3);

      for (let i = 0; i < hugsCount; i++) {
        try {
          await api.post("/posts/hug", { postId: post._id });
        } catch (e) {}
      }

      console.log(`✅ Post ${post._id} seeded`);
    }

    console.log("🏁 Seeding finished");

  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
};

runSeed();