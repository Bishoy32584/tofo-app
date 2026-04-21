const cache = require("../redisClient");

const pending = new Map();

const BATCH_WINDOW = 8000; // 8 seconds

function invalidateFeed(userId) {
  if (pending.has(userId)) return;

  pending.set(userId, true);

  setTimeout(() => {
    cache.del(`feed:${userId}`);
    pending.delete(userId);
  }, BATCH_WINDOW);
}

module.exports = { invalidateFeed };