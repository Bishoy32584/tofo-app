const Post = require("../models/Post");
const User = require("../models/User");

// 🟢 cache بسيط
let globalFeedCache = [];
let lastComputed = 0;

const CACHE_DURATION = 10000; // 10 ثواني

async function attachUserNames(posts) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  const userIds = [
    ...new Set(
      posts
        .map((post) => post?.user && String(post.user))
        .filter(Boolean)
    )
  ];

  if (userIds.length === 0) {
    return posts.map((post) => ({ ...post, userName: "" }));
  }

  const users = await User.find({ _id: { $in: userIds } })
    .select("_id name")
    .lean();

  const userNameById = new Map(
    users.map((user) => [String(user._id), user.name || ""])
  );

  return posts.map((post) => ({
    ...post,
    userName: userNameById.get(String(post.user)) || ""
  }));
}

async function computeGlobalFeed() {

  console.time("MongoQuery");

  const posts = await Post.find()
    .populate("user", "name profileImage") // ✅ التعديل الوحيد
    .sort({ createdAt: -1 })
    .limit(200)
    .select("content mood stats createdAt isExplicit user tags images expiresAt")
    .lean();

  console.timeEnd("MongoQuery");

  const result = [];

  console.time("Scoring");

  for (const post of posts) {
    if (post.expiresAt && new Date(post.expiresAt) < new Date()) continue;

    if (post.isExplicit) continue;

    const hoursAgo =
      (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60);

    const decay = Math.exp(-0.1 * hoursAgo);

    const impressions = post.stats?.impressions || 0;
    const hugs = post.stats?.hugs || 0;

    const score =
      decay * 1000 +
      Math.log1p(hugs) * 50 +
      Math.log1p(impressions + 1) * 10;

    result.push({
      ...post,
      baseScore: score
    });
  }

  console.timeEnd("Scoring");

  const withUserNames = await attachUserNames(result);

  globalFeedCache = withUserNames;
  lastComputed = Date.now();

  return withUserNames;
}

// ✅ دي أهم function في النظام
async function getGlobalFeed() {
  const now = Date.now();

  if (now - lastComputed < CACHE_DURATION && globalFeedCache.length > 0) {
    return globalFeedCache;
  }

  return await computeGlobalFeed();
}

function clearGlobalFeedCache() {
  globalFeedCache = [];
  lastComputed = 0;
}

module.exports = {
  getGlobalFeed,
  attachUserNames,
  clearGlobalFeedCache
};