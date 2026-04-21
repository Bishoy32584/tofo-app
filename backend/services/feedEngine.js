const Post = require("../models/Post");

// 🟢 cache بسيط
let globalFeedCache = [];
let lastComputed = 0;

const CACHE_DURATION = 10000; // 10 ثواني

async function computeGlobalFeed() {

  console.time("MongoQuery");

  const posts = await Post.find()
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

  globalFeedCache = result;
  lastComputed = Date.now();

  return result;
}

// ✅ دي أهم function في النظام
async function getGlobalFeed() {
  const now = Date.now();

  if (now - lastComputed < CACHE_DURATION && globalFeedCache.length > 0) {
    return globalFeedCache;
  }

  return await computeGlobalFeed();
}

module.exports = {
  getGlobalFeed
};