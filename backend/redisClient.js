const cache = new Map();

function set(key, value, ttlSeconds = 10) {
  cache.set(key, value);

  setTimeout(() => {
    cache.delete(key);
  }, ttlSeconds * 1000);
}

function get(key) {
  return cache.get(key);
}

function del(key) {
  cache.delete(key);
}

module.exports = {
  set,
  get,
  del
};