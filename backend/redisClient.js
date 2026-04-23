const { createClient } = require("redis");

// =========================
// Redis Client Init
// =========================
const client = createClient({
  url: process.env.REDIS_URL
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

(async () => {
  await client.connect();
  console.log("✅ Redis connected");
})();

// =========================
// Compatibility Layer (same API as Map version)
// =========================

// set(key, value, ttlSeconds)
async function set(key, value, ttlSeconds = 10) {
  try {
    const serialized = JSON.stringify(value);

    if (ttlSeconds) {
      await client.set(key, serialized, {
        EX: ttlSeconds
      });
    } else {
      await client.set(key, serialized);
    }
  } catch (err) {
    console.error("Redis SET error:", err);
  }
}

// get(key)
async function get(key) {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Redis GET error:", err);
    return null;
  }
}

// del(key)
async function del(key) {
  try {
    await client.del(key);
  } catch (err) {
    console.error("Redis DEL error:", err);
  }
}

module.exports = {
  set,
  get,
  del
};