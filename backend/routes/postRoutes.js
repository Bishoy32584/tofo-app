const express = require("express");
const router = express.Router();

const Post = require("../models/Post");
const UserBehavior = require("../models/UserBehavior");
const PostView = require("../models/PostView");

// ✅ إضافات جديدة
const View = require("../models/View");
const Impression = require("../models/Impression");
const Hug = require("../models/Hug");

const authenticate = require("../modules/auth/auth.middleware");

// ✏️ إضافة semantic
const { simpleTextVector, cosineSimilarity } = require("../utils/semantic");

// 🟢 In-memory cache (REPLACES REDIS)
const cache = require("../redisClient");

// 🟢 Rate limit
const rateLimit = require("express-rate-limit");

const feedLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 50, // ✅ التعديل الوحيد
});

// 🟢 Request Deduplication
const pendingRequests = new Map();

// 🔥 upload middleware
const upload = require("../middlewares/upload");

// 🚀 HYBRID ENGINE IMPORT (NEW)
const { getGlobalFeed, attachUserNames, clearGlobalFeedCache } = require("../services/feedEngine");

// ✅ NEW (التعديل)
const scorePost = require("../services/rankingEngine");

// 🟢 NEW
const { invalidateFeed } = require("../services/feedInvalidation");

// ==========================
// 🔥 Image Moderation Engine
// ==========================
const sightengine = require("sightengine")(
  process.env.SIGHT_USER,
  process.env.SIGHT_SECRET
);

// 🔥 Cloudinary
const cloudinary = require("../utils/cloudinary");

// 🔹 Create Post
router.post(
  "/",
  (req, res, next) => {
    console.log("📥 Request:", req.method, req.originalUrl, Date.now());
    next();
  },
  authenticate,
  upload.array("images", 5),
  async (req, res) => {
    try {

      // ✅ الإضافة هنا فقط
      console.log("📥 BODY:", req.body);
      console.log("📥 FILES:", req.files || req.file);

      const { content, mood, isAnonymous } = req.body;

      const trimmedContent = typeof content === "string" ? content.trim() : "";

      if (!trimmedContent && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ message: "Content required" });
      }

      // ==========================
      // ✅ CLOUDINARY UPLOAD (NEW)
      // ==========================
      const imageUrls = [];

      for (const file of req.files || []) {

        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "tofo-posts" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          stream.end(file.buffer);
        });

        imageUrls.push(result.secure_url);
      }

      let isExplicit = false;
      let explicitScore = 0;

      // ==========================
      // 🔁 UPDATED LOOP (NEW)
      // ==========================
      for (const fileResultUrl of imageUrls) {

        const result = await sightengine
          .check(["nudity"])
          .set_url(fileResultUrl);

        const score = result?.nudity?.raw || 0;

        if (score > 0.7) {
          isExplicit = true;
        }

        explicitScore = Math.max(explicitScore, score);
      }

      const post = new Post({
        user: req.userId,
        content: trimmedContent,
        mood,
        isAnonymous,
        postVector: simpleTextVector(trimmedContent),
        images: imageUrls,
        isExplicit,
        explicitScore
      });

      await post.save();

      // 🟢 NEW
      invalidateFeed(req.userId);

      res.status(201).json(post);

    } catch (err) {
      console.error("Create Post Error:", err);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// 🔹 Get Feed (HYBRID VERSION)
router.get("/feed",
  (req, res, next) => {
    console.log("📥 Request:", req.method, req.originalUrl, Date.now());
    next();
  },
  authenticate, feedLimiter, async (req, res) => {
  try {

    console.log("USER ID FROM TOKEN:", req.userId);

    console.time("TOTAL_FEED");

    const cacheKey = `feed:${req.userId}`;

    const cached = cache.get(cacheKey);
    if (cached && cached.length > 0) {
      console.timeEnd("TOTAL_FEED");
      return res.json(cached);
    }

    if (pendingRequests.has(cacheKey)) {
      const result = await pendingRequests.get(cacheKey);
      console.timeEnd("TOTAL_FEED");
      return res.json(result);
    }

    const promise = (async () => {

      console.time("GLOBAL_FEED");
      const globalFeed = await getGlobalFeed();
      console.timeEnd("GLOBAL_FEED");

      if (!globalFeed.length) {
        const fallback = await Post.find().limit(20).lean();
        return await attachUserNames(fallback);
      }

      const userBehavior = await UserBehavior.findOne({
        userId: req.userId
      }) || {
        viewedPosts: [],
        interests: { emotions: {}, tags: {} }
      };

      const shadowScore = userBehavior?.shadowBanScore || 0;

      console.time("PERSONALIZE");
      const scoredPosts = globalFeed.map(post =>
        scorePost(post, userBehavior)
      );
      console.timeEnd("PERSONALIZE");

      if (shadowScore > 0.9) {
        return [];
      }

      scoredPosts.sort((a, b) => b.score - a.score);

      return scoredPosts;

    })();

    pendingRequests.set(cacheKey, promise);

    const result = await promise;

    pendingRequests.delete(cacheKey);

    cache.set(cacheKey, result, 10);

    console.timeEnd("TOTAL_FEED");

    res.json(result);

  } catch (err) {
    console.error("Feed Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ==========================
// Impression Tracking
// ==========================
router.post("/impression", authenticate, async (req, res) => {
  try {

    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "postId required" });
    }

    const exists = await Impression.findOne({
      userId: req.userId,
      postId
    });

    if (!exists) {
      await Impression.create({
        userId: req.userId,
        postId
      });

      Post.updateOne(
        { _id: postId },
        { $inc: { "stats.impressions": 1 } }
      ).catch(() => {});
    }

    await UserBehavior.findOneAndUpdate(
      { userId: req.userId },
      {
        $inc: {
          "behavior.impressions": 1
        }
      },
      { upsert: true }
    );

    invalidateFeed(req.userId);

    res.sendStatus(200);

  } catch (err) {
    console.error("Impression Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ==========================
// View Tracking
// ==========================
router.post("/view", authenticate, async (req, res) => {
  try {

    const { postId, duration } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "postId required" });
    }

    await View.create({
      userId: req.userId,
      postId,
      duration: duration || 0
    });

    Post.updateOne(
      { _id: postId },
      {
        $inc: {
          "stats.views": 1,
          "stats.totalViewTime": duration || 0
        }
      }
    ).catch(() => {});

    await UserBehavior.findOneAndUpdate(
      { userId: req.userId },
      {
        $push: {
          viewedPosts: {
            $each: [postId],
            $slice: -500
          }
        }
      },
      { upsert: true }
    );

    invalidateFeed(req.userId);

    res.sendStatus(200);

  } catch (err) {
    console.error("View Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// ==========================
// Hug Tracking
// ==========================
router.post("/hug", authenticate, async (req, res) => {
  try {

    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ message: "postId required" });
    }

    await Hug.create({
      userId: req.userId,
      postId
    });

    Post.updateOne(
      { _id: postId },
      { $inc: { "stats.hugs": 1 } }
    ).catch(() => {});

    const post = await Post.findById(postId);

    await UserBehavior.findOneAndUpdate(
      { userId: req.userId },
      {
        $inc: {
          "behavior.hugsGiven": 1,
          [`interests.emotions.${post.mood}`]: 1
        }
      },
      { upsert: true }
    );

    invalidateFeed(req.userId);

    res.sendStatus(200);

  } catch (err) {
    console.error("Hug Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Delete Post
router.delete("/:id", authenticate, async (req, res) => {
  try {

    const deleted = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.userId
    });

    if (!deleted) {
      return res.status(404).json({ message: "Post not found or unauthorized" });
    }

    invalidateFeed(req.userId);
    clearGlobalFeedCache();

    res.json({
      success: true,
      postId: String(deleted._id)
    });

  } catch (err) {
    console.error("Delete Post Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;