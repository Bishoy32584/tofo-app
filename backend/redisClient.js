let client = null;

try {
  const { createClient } = require("redis");

  client = createClient({
    url: process.env.REDIS_URL
  });

  client.on("error", (err) => {
    console.error("Redis error:", err);
  });

  client.connect().then(() => {
    console.log("✅ Redis connected");
  });

} catch (e) {
  console.log("⚠️ Redis disabled - fallback mode");
}

const fallback = new Map();

// =========================
// SET
// =========================
async function set(key, value, ttl = 10) {
  if (!client) {
    fallback.set(key, value);
    return;
  }

  try {
    await client.set(key, JSON.stringify(value));
  } catch (err) {
    console.error("Redis SET error:", err);
  }
}

// =========================
// GET
// =========================
async function get(key) {
  if (!client) {
    const v = fallback.get(key);
    return v ?? null;
  }

  try {
    const v = await client.get(key);
    return v ? JSON.parse(v) : null;
  } catch (err) {
    console.error("Redis GET error:", err);
    return null;
  }
}

// =========================
// DELETE
// =========================
async function del(key) {
  if (!client) {
    fallback.delete(key);
    return;
  }

  try {
    await client.del(key);
  } catch (err) {
    console.error("Redis DEL error:", err);
  }
}

// =========================
// INCR (needed for server.js load guard)
// =========================
async function incr(key) {
  if (!client) {
    const v = (fallback.get(key) || 0) + 1;
    fallback.set(key, v);
    return v;
  }

  try {
    return await client.incr(key);
  } catch (err) {
    console.error("Redis INCR error:", err);
    return 0;
  }
}

// =========================
// DECR (needed for server.js load guard)
// =========================
async function decr(key) {
  if (!client) {
    const v = (fallback.get(key) || 1) - 1;
    fallback.set(key, v);
    return v;
  }

  try {
    return await client.decr(key);
  } catch (err) {
    console.error("Redis DECR error:", err);
    return 0;
  }
}

module.exports = {
  set,
  get,
  del,
  incr,
  decr
};