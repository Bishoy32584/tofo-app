const UserBehavior = require("./models/UserBehavior");
const Post = require("./models/Post");

async function generatePredictedScores(userId) {
  const userBehavior = await UserBehavior.findOne({ userId });
  if (!userBehavior) return;

  const posts = await Post.find();

  posts.forEach(post => {
    let predicted = 0;

    // مثال بسيط: دمج الـ clicks, hugs, dwell time, tags, mood
    const clicks = userBehavior.notificationClicks?.[post._id] || 0;
    const hugs = post.stats?.hugs || 0;
    const dwell = post.stats?.totalViewTime || 0;
    const tagScore = (post.tags || []).reduce((sum, tag) => sum + (userBehavior.interests.tags[tag] || 0), 0);
    const moodScore = post.mood ? (userBehavior.interests.emotions[post.mood] || 0) : 0;

    predicted = clicks*2 + hugs*3 + dwell*0.5 + tagScore*1.5 + moodScore*2;

    // حفظ في predictedScore
    userBehavior.predictedScore.set(post._id.toString(), predicted);
  });

  await userBehavior.save();
  console.log("Predicted scores updated for user:", userId);
}

module.exports = { generatePredictedScores };