function analyzeContent(text = "") {
  const lower = text.toLowerCase();

  // 1. sentiment (simple heuristic)
  let sentiment = "neutral";
  if (lower.includes("زهق") || lower.includes("تعب") || lower.includes("ضغط")) {
    sentiment = "negative";
  }
  if (lower.includes("حماس") || lower.includes("سعيد")) {
    sentiment = "positive";
  }

  // 2. category (rule-based)
  let category = "general";
  if (lower.includes("امتحان") || lower.includes("مذاكرة")) {
    category = "education";
  }

  if (lower.includes("شغل") || lower.includes("وظيفة")) {
    category = "career";
  }

  // 3. topic extraction (lightweight keywords)
  const topics = [];
  if (lower.includes("امتحان")) topics.push("exam");
  if (lower.includes("مذاكرة")) topics.push("study");
  if (lower.includes("ضغط")) topics.push("stress");

  return {
    sentiment,
    category,
    topics
  };
}

module.exports = { analyzeContent };