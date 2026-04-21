function simpleTextVector(text) {
  if (!text) return [];

  const words = text.toLowerCase().split(/\s+/);
  const hashVector = new Array(16).fill(0);

  words.forEach(w => {
    let hash = 0;
    for (let i = 0; i < w.length; i++) {
      hash = (hash * 31 + w.charCodeAt(i)) % 16;
    }
    hashVector[hash] += 1;
  });

  return hashVector.map(v => Math.min(v, 1));
}

function cosineSimilarity(a, b) {
  if (!a.length || !b.length) return 0;

  let dot = 0, magA = 0, magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += (a[i] || 0) * (b[i] || 0);
    magA += (a[i] || 0) ** 2;
    magB += (b[i] || 0) ** 2;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-9);
}

module.exports = {
  simpleTextVector,
  cosineSimilarity
};