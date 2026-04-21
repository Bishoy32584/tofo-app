const scorePost = (post, userBehavior) => {
  let score = 0;

  // 1. Emotion Match
  const topEmotion = Array.from(userBehavior.interests.emotions.entries())
                          .sort((a,b)=>b[1]-a[1])[0]?.[0];
  score += (post.emotion === topEmotion ? 1 : 0.3) * 0.25;

  // 2. Tag Match
  const tagsUser = Array.from(userBehavior.interests.tags.keys());
  const commonTags = post.tags.filter(tag => tagsUser.includes(tag)).length;
  const tagMatch = post.tags.length ? commonTags / post.tags.length : 0;
  score += tagMatch * 0.25;

  // 3. Engagement
  const engagement = (post.stats.hugs * 2 + post.stats.chatsStarted * 3) /
                     (post.stats.views || 1);
  score += engagement * 0.2;

  // 4. Recency
  const secondsAgo = (Date.now() - new Date(post.createdAt)) / 1000;
  score += Math.max(0, 1 - secondsAgo/3600) * 0.15; // أقل من ساعة أعلى

  // 5. User Behavior Fit
  const behaviorFit = (userBehavior.behavior.hugsGiven ? 1 : 0);
  score += behaviorFit * 0.1;

  // 6. Diversity Boost (simplified)
  score += 0.05;

  return score;
};

module.exports = scorePost;