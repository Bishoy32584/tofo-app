const scorePost = (post, userBehavior) => {

  let score = post.baseScore || 0;

  // Emotion
  const emotionScore =
    post.mood && userBehavior?.interests?.emotions?.[post.mood]
      ? 30
      : 0;

  // Tags
  let tagScore = 0;
  if (post.tags?.length && userBehavior?.interests?.tags) {
    post.tags.forEach(tag => {
      tagScore += userBehavior.interests.tags[tag] ? 10 : 0;
    });
  }

  // Views penalty
  const isViewed = userBehavior?.viewedPosts?.includes(post._id?.toString());
  if (isViewed) score -= 50;

  // Hug preference
  score += (post.stats?.hugs || 0) * 2;

  const finalScore = score + emotionScore + tagScore;

  return {
    ...post,
    score: finalScore
  };
};

module.exports = scorePost;