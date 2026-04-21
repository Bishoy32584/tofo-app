const Post = require("./models/Post");
const View = require("./models/View");
const Impression = require("./models/Impression");
const Hug = require("./models/Hug");
const PostView = require("./models/PostView");
const UserBehavior = require("./models/UserBehavior");

async function cleanupOrphans() {
  try {
    console.log("🧹 Cleanup started...");

    const posts = await Post.find({}, "_id");
    const validPostIds = posts.map(p => p._id.toString());

    // 🟡 delete orphan views
    await View.deleteMany({
      postId: { $nin: validPostIds }
    });

    // 🟡 delete orphan impressions
    await Impression.deleteMany({
      postId: { $nin: validPostIds }
    });

    // 🟡 delete orphan hugs
    await Hug.deleteMany({
      postId: { $nin: validPostIds }
    });

    // 🟡 delete orphan post views
    await PostView.deleteMany({
      postId: { $nin: validPostIds }
    });

    // 🟡 clean viewedPosts inside UserBehavior
    const users = await UserBehavior.find();

    for (const user of users) {
      const filtered = user.viewedPosts.filter(id =>
        validPostIds.includes(id.toString())
      );

      user.viewedPosts = filtered;
      await user.save();
    }

    console.log("✅ Cleanup finished");

  } catch (err) {
    console.error("Cleanup Error:", err);
  }
}

module.exports = cleanupOrphans;